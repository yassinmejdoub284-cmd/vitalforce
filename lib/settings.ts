import "server-only";
import { inArray } from "drizzle-orm";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { z } from "zod";
import { db, hasDatabase } from "@/lib/db";
import { settings as settingsTable } from "@/lib/db/schema";

const optionalText = z.string().trim().max(500).default("");
const amount = z.coerce.number().min(0).max(100000);

export const settingsSchemas = {
  store: z.object({
    siteName: z.string().trim().min(2).max(80).default("VITAL FORCE"),
    phone: optionalText.default("+216 27 200 603"),
    whatsapp: optionalText.default("21627200603"),
    email: optionalText,
    address: optionalText.default("Rue Sidi Mansour km 6, Sfax"),
    addressAr: optionalText.default("طريق سيدي منصور كلم 6، صفاقس"),
    facebook: optionalText,
    instagram: optionalText,
    tiktok: optionalText,
    announcement: optionalText,
    announcementAr: optionalText,
    ordersEnabled: z.boolean().default(true)
  }),
  delivery: z.object({
    /** Frais facturés au client. */
    fee: amount.default(7),
    /** Livraison incluse dans le prix: le client ne paie pas de frais en plus. */
    included: z.boolean().default(false),
    /** Livraison offerte à partir de ce sous-total (0 = désactivé). */
    freeThreshold: amount.default(0),
    /** Ce que la société de livraison vous facture par colis livré. */
    carrierCost: amount.default(7),
    /** Ce que la société vous facture pour un colis retourné. */
    returnCost: amount.default(4),
    /** Coût d'une commande que vous livrez vous-même (carburant, livreur...). */
    selfCost: amount.default(0),
    eta: optionalText.default("24-72 h selon la ville"),
    etaAr: optionalText.default("24-72 ساعة حسب المدينة")
  }),
  costs: z.object({
    /** Coût de confirmation téléphonique (appel / agent) par commande reçue. */
    confirmationCost: amount.default(0.5),
    /** Coûts fixes mensuels (local, salaires...) pour le profit net. */
    monthlyFixed: amount.default(0)
  }),
  meta: z.object({
    pixelId: z.string().trim().regex(/^\d{0,20}$/, "ID pixel: chiffres uniquement").default(""),
    capiToken: optionalText,
    testEventCode: optionalText,
    /** "order" = Purchase envoyé à la commande, "confirmed" = seulement après confirmation téléphonique. */
    purchaseOn: z.enum(["order", "confirmed"]).default("order"),
    adAccountId: z.string().trim().regex(/^(act_)?\d{0,24}$/, "ID compte pub: chiffres uniquement").default(""),
    marketingToken: optionalText
  }),
  jetpack: z.object({
    addToken: optionalText,
    trackToken: optionalText,
    allowOpen: z.boolean().default(true),
    fragile: z.boolean().default(false),
    designation: optionalText.default("Complément alimentaire VITAL FORCE")
  }),
  notifications: z.object({
    newOrder: z.boolean().default(true),
    visitors: z.boolean().default(true),
    /** Au plus une notification « visiteurs en ligne » toutes les N minutes. */
    visitorIntervalMin: z.coerce.number().int().min(1).max(1440).default(15),
    statusChanges: z.boolean().default(true)
  }),
  orders: z.object({
    blockBlacklisted: z.boolean().default(true),
    /** Une nouvelle commande du même numéro dans ce délai est marquée « doublon ». */
    duplicateHours: z.coerce.number().int().min(0).max(720).default(24),
    restockOnReturn: z.boolean().default(true)
  })
};

export type SettingsGroup = keyof typeof settingsSchemas;
export type Settings = { [K in SettingsGroup]: z.infer<(typeof settingsSchemas)[K]> };
export const settingsGroups = Object.keys(settingsSchemas) as SettingsGroup[];
export const secretFields: Partial<Record<SettingsGroup, string[]>> = {
  meta: ["capiToken", "marketingToken"],
  jetpack: ["addToken", "trackToken"]
};

export function defaultSettings(): Settings {
  return Object.fromEntries(settingsGroups.map((group) => [group, settingsSchemas[group].parse({})])) as Settings;
}

function withEnvFallbacks(value: Settings): Settings {
  return {
    ...value,
    meta: {
      ...value.meta,
      pixelId: value.meta.pixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
      capiToken: value.meta.capiToken || process.env.META_CONVERSIONS_API_TOKEN || "",
      testEventCode: value.meta.testEventCode || process.env.META_TEST_EVENT_CODE || "",
      adAccountId: value.meta.adAccountId || process.env.META_AD_ACCOUNT_ID || "",
      marketingToken: value.meta.marketingToken || process.env.META_MARKETING_TOKEN || ""
    },
    jetpack: {
      ...value.jetpack,
      addToken: value.jetpack.addToken || process.env.JETPACK_ADD_TOKEN || "",
      trackToken: value.jetpack.trackToken || process.env.JETPACK_TRACK_TOKEN || ""
    }
  };
}

/** Lecture directe (admin, API). */
export async function getSettings(): Promise<Settings> {
  const defaults = defaultSettings();
  if (!hasDatabase()) return withEnvFallbacks(defaults);
  try {
    const rows = await db.select().from(settingsTable).where(inArray(settingsTable.key, settingsGroups));
    const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    const merged = Object.fromEntries(settingsGroups.map((group) => {
      const parsed = settingsSchemas[group].safeParse({ ...(defaults[group] as object), ...((stored[group] as object) ?? {}) });
      return [group, parsed.success ? parsed.data : defaults[group]];
    })) as Settings;
    return withEnvFallbacks(merged);
  } catch (error) {
    console.error("[settings] lecture impossible", error);
    return withEnvFallbacks(defaults);
  }
}

export type PublicSettings = {
  store: Settings["store"];
  delivery: Pick<Settings["delivery"], "fee" | "included" | "freeThreshold" | "eta" | "etaAr">;
  pixelId: string;
  purchaseOn: Settings["meta"]["purchaseOn"];
};

export function toPublicSettings(value: Settings): PublicSettings {
  return {
    store: value.store,
    delivery: { fee: value.delivery.fee, included: value.delivery.included, freeThreshold: value.delivery.freeThreshold, eta: value.delivery.eta, etaAr: value.delivery.etaAr },
    pixelId: value.meta.pixelId,
    purchaseOn: value.meta.purchaseOn
  };
}

/** Lecture mise en cache pour la boutique, invalidée à chaque enregistrement dans l'admin. */
export const getPublicSettings = unstable_cache(async () => toPublicSettings(await getSettings()), ["public-settings-v1"], { tags: ["settings"], revalidate: 600 });

export async function saveSettingsGroup<K extends SettingsGroup>(group: K, input: unknown) {
  const current = await getSettings();
  const raw = { ...(current[group] as object), ...(input as object) } as Record<string, unknown>;
  // Un secret laissé vide ou masqué dans le formulaire garde sa valeur actuelle.
  for (const field of secretFields[group] ?? []) {
    const incoming = (input as Record<string, unknown>)[field];
    if (incoming === undefined || incoming === "" || (typeof incoming === "string" && incoming.includes("•"))) raw[field] = (current[group] as Record<string, unknown>)[field];
  }
  const value = settingsSchemas[group].parse(raw);
  await db.insert(settingsTable).values({ key: group, value }).onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date() } });
  refreshStorefront("settings");
  return value as Settings[K];
}

export async function clearSecret(group: SettingsGroup, field: string) {
  const current = await getSettings();
  const value = { ...(current[group] as Record<string, unknown>), [field]: "" };
  await db.insert(settingsTable).values({ key: group, value }).onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date() } });
}

export function refreshStorefront(tag: "settings" | "products") {
  try {
    revalidateTag(tag, { expire: 0 });
    revalidatePath("/", "layout");
  } catch {
    // Hors contexte Next (scripts): rien à invalider.
  }
}

export function maskSecret(value: string) {
  if (!value) return "";
  return `••••••${value.slice(-4)}`;
}

/** Réglages envoyés au navigateur de l'admin: les secrets sont masqués. */
export function maskedSettings(value: Settings) {
  const copy = structuredClone(value) as Record<string, Record<string, unknown>>;
  for (const [group, fields] of Object.entries(secretFields)) {
    for (const field of fields ?? []) copy[group][field] = maskSecret(String(copy[group][field] ?? ""));
  }
  return copy as Settings;
}

export { deliveryFeeFor } from "@/lib/pricing";
