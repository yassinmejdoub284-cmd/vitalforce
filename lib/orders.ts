import "server-only";
import { and, eq, gt, inArray, isNotNull, isNull, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db, type Tx } from "@/lib/db";
import { blacklist, orderEvents, orderItems, orders, products, type OrderRow, type OrderStatus } from "@/lib/db/schema";
import { addJetpackOrder, JetpackError, statusFromCarrier, trackJetpackOrders } from "@/lib/jetpack";
import { sendCapiPurchase } from "@/lib/meta-server";
import { deliveryFeeFor, roundMoney } from "@/lib/pricing";
import { notifyAdmins } from "@/lib/push";
import { getSettings, refreshStorefront, type Settings } from "@/lib/settings";
import { governorateValues, normalizeTunisianPhone } from "@/lib/tunisia";

const phoneField = z.string().trim().transform((value, context) => {
  const phone = normalizeTunisianPhone(value);
  if (!phone) context.addIssue({ code: "custom", message: "Numéro tunisien invalide (8 chiffres)." });
  return phone ?? "";
});

const cleanText = (min: number, max: number, message: string) => z.string().trim().min(min, message).max(max).transform((value) => value.replace(/\p{Cc}/gu, " ").replace(/\s+/g, " "));

export const orderInputSchema = z.object({
  customerName: cleanText(3, 80, "Nom et prénom requis."),
  phone: phoneField,
  phone2: z.string().trim().optional().transform((value) => (value ? normalizeTunisianPhone(value) : null)),
  email: z.union([z.literal(""), z.string().trim().email("Email invalide.").max(120)]).optional().transform((value) => value || null),
  governorate: z.enum(governorateValues, { message: "Choisissez votre gouvernorat." }),
  city: cleanText(2, 80, "Ville / délégation requise."),
  address: cleanText(8, 250, "Adresse complète requise (rue, numéro, repère)."),
  note: z.string().trim().max(500).optional().transform((value) => value || null),
  items: z.array(z.object({ productId: z.string().min(1).max(64), quantity: z.coerce.number().int().min(1).max(20) })).min(1).max(10),
  source: z.enum(["site", "landing", "admin"]).default("site"),
  landingAngle: z.string().trim().max(60).optional(),
  utm: z.record(z.string(), z.string().max(150)).optional(),
  visitorId: z.string().max(64).optional(),
  fbp: z.string().max(200).optional(),
  fbc: z.string().max(300).optional(),
  pageUrl: z.string().max(500).optional(),
  /** Champ piège invisible: rempli seulement par les robots. */
  website: z.string().max(0, "Requête refusée.").optional()
});

export type OrderInput = z.input<typeof orderInputSchema>;
export type OrderContext = { ip?: string | null; userAgent?: string | null; actor?: string };

export class OrderError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

async function logEvent(tx: Tx | typeof db, orderId: number, type: string, message: string, actor = "system") {
  await tx.insert(orderEvents).values({ orderId, type, message, actor });
}

export function orderLabel(status: OrderStatus) {
  return ({ pending: "Nouvelle", no_answer: "Pas de réponse", confirmed: "Confirmée", cancelled: "Annulée", shipped: "Chez Jetpack", delivered: "Livrée", returned: "Retournée" } as const)[status];
}

export async function createOrder(rawInput: unknown, context: OrderContext = {}) {
  const parsed = orderInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new OrderError(issue?.message ?? "Vérifiez les informations de commande.");
  }
  const input = parsed.data;
  const config = await getSettings();
  if (!config.store.ordersEnabled && input.source !== "admin") throw new OrderError("Les commandes sont momentanément fermées. Contactez-nous par téléphone.", 503);

  if (config.orders.blockBlacklisted && input.source !== "admin") {
    const [blocked] = await db.select().from(blacklist).where(eq(blacklist.phone, input.phone)).limit(1);
    if (blocked) throw new OrderError("Nous ne pouvons pas enregistrer cette commande en ligne. Contactez-nous par téléphone.", 403);
  }

  const quantities = new Map<string, number>();
  for (const item of input.items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);

  const order = await db.transaction(async (tx) => {
    const rows = await tx.select().from(products).where(and(inArray(products.id, [...quantities.keys()]), eq(products.active, true)));
    if (rows.length !== quantities.size) throw new OrderError("Un produit n'est plus disponible. Actualisez la page.", 409);
    for (const product of rows) {
      if (product.stock < (quantities.get(product.id) ?? 0)) throw new OrderError(`${product.name}: stock insuffisant (${product.stock} disponible).`, 409);
    }
    const lines = rows.map((product) => ({ product, quantity: quantities.get(product.id)! }));
    const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0));
    const deliveryFee = deliveryFeeFor(subtotal, config.delivery);
    const total = roundMoney(subtotal + deliveryFee);

    const [created] = await tx.insert(orders).values({
      number: `TMP-${crypto.randomUUID()}`,
      customerName: input.customerName,
      phone: input.phone,
      phone2: input.phone2,
      email: input.email,
      governorate: input.governorate,
      city: input.city,
      address: input.address,
      note: input.note,
      subtotal,
      deliveryFee,
      total,
      carrierCost: config.delivery.carrierCost,
      returnCost: config.delivery.returnCost,
      confirmationCost: config.costs.confirmationCost,
      source: input.source,
      landingAngle: input.landingAngle,
      utm: input.utm,
      visitorId: input.visitorId,
      fbp: input.fbp,
      fbc: input.fbc,
      ip: context.ip,
      userAgent: context.userAgent?.slice(0, 300)
    }).returning();
    const number = `VF-${1000 + created.id}`;
    await tx.update(orders).set({ number }).where(eq(orders.id, created.id));
    await tx.insert(orderItems).values(lines.map(({ product, quantity }) => ({
      orderId: created.id,
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      unitCost: product.costPrice,
      packagingCost: product.packagingCost,
      quantity
    })));
    await logEvent(tx, created.id, "created", input.source === "admin" ? "Commande saisie dans l'admin" : `Commande reçue (${input.landingAngle ? `page ${input.landingAngle}` : "boutique"})`, context.actor ?? "client");
    return { ...created, number, items: lines.map(({ product, quantity }) => ({ productId: product.id, name: product.name, quantity, unitPrice: product.price })) };
  });

  return { order, settings: config, pageUrl: input.pageUrl };
}

/** Travail après réponse: notification push et Purchase serveur Meta. */
export async function afterOrderCreated(order: Awaited<ReturnType<typeof createOrder>>["order"], config: Settings, pageUrl?: string) {
  const tasks: Promise<unknown>[] = [];
  if (config.notifications.newOrder) {
    const quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
    tasks.push(notifyAdmins({ title: `🛒 Nouvelle commande ${order.number}`, body: `${order.customerName} · ${order.governorate} · ${quantity} article(s) · ${order.total} DT`, url: `/admin/orders/${order.id}`, tag: `order-${order.id}` }));
  }
  if (config.meta.purchaseOn === "order" && order.source !== "admin") tasks.push(sendPurchase(order.id, config, pageUrl));
  await Promise.allSettled(tasks);
}

async function sendPurchase(orderId: number, config: Settings, pageUrl?: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || order.metaPurchaseSentAt) return;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const result = await sendCapiPurchase(config.meta, { ...order, items, sourceUrl: pageUrl });
  if (result.ok) await db.update(orders).set({ metaPurchaseSentAt: new Date() }).where(eq(orders.id, orderId));
}

async function adjustStock(tx: Tx, orderId: number, direction: 1 | -1) {
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  for (const item of items) {
    await tx.update(products).set({ stock: sql`${products.stock} + ${direction * item.quantity}` }).where(eq(products.id, item.productId));
  }
}

const manualTargets: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "no_answer", "cancelled"],
  no_answer: ["confirmed", "no_answer", "cancelled", "pending"],
  confirmed: ["pending", "cancelled", "shipped", "delivered"],
  cancelled: ["pending", "confirmed"],
  shipped: ["delivered", "returned", "confirmed"],
  delivered: ["returned"],
  returned: ["delivered"]
};

export function allowedTargets(status: OrderStatus) {
  return manualTargets[status];
}

type Transition = { status: OrderStatus; reason?: string; actor: string; carrierDriven?: boolean };

async function applyTransition(tx: Tx, order: OrderRow, transition: Transition, config: Settings) {
  const { status } = transition;
  const now = new Date();
  const patch: Partial<OrderRow> = { status };
  let reserved = order.stockReserved;

  if (status === "confirmed" || status === "shipped" || status === "delivered") {
    if (!reserved) { await adjustStock(tx, order.id, -1); reserved = true; }
    if (!order.confirmedAt) patch.confirmedAt = now;
  }
  if (status === "cancelled" || status === "pending" || status === "no_answer") {
    if (reserved) { await adjustStock(tx, order.id, 1); reserved = false; }
  }
  if (status === "returned" && reserved && config.orders.restockOnReturn) { await adjustStock(tx, order.id, 1); reserved = false; }
  patch.stockReserved = reserved;
  if (status === "no_answer") patch.callAttempts = order.callAttempts + 1;
  if (status === "cancelled") { patch.cancelledAt = now; patch.cancelReason = transition.reason ?? order.cancelReason; }
  if (status === "shipped" && !order.shippedAt) patch.shippedAt = now;
  if (status === "delivered") patch.deliveredAt = order.deliveredAt ?? now;
  if (status === "returned") patch.returnedAt = order.returnedAt ?? now;
  // Une commande archivée qui reprend vie (annulation retirée) revient dans les listes.
  if (order.archivedAt && status !== "cancelled") patch.archivedAt = null;

  await tx.update(orders).set(patch).where(eq(orders.id, order.id));
  const message = status === "no_answer" ? `Appel sans réponse n°${order.callAttempts + 1}` : `${orderLabel(order.status)} → ${orderLabel(status)}`;
  await logEvent(tx, order.id, "status", `${message}${transition.reason ? ` · ${transition.reason}` : ""}`, transition.actor);
}

export async function changeOrderStatus(ids: number[], target: OrderStatus, actor: string, reason?: string) {
  const config = await getSettings();
  const results: { id: number; ok: boolean; error?: string }[] = [];
  for (const id of ids) {
    try {
      await db.transaction(async (tx) => {
        const [order] = await tx.select().from(orders).where(eq(orders.id, id)).for("update").limit(1);
        if (!order) throw new OrderError("Commande introuvable.", 404);
        if (order.status === target && target !== "no_answer") return;
        if (!manualTargets[order.status].includes(target)) throw new OrderError(`Impossible de passer de « ${orderLabel(order.status)} » à « ${orderLabel(target)} ».`);
        if (order.carrierBarcode && ["pending", "no_answer", "confirmed", "cancelled"].includes(target)) throw new OrderError("Déjà envoyée à Jetpack: annulez d'abord le colis chez Jetpack.");
        await applyTransition(tx, order, { status: target, reason, actor }, config);
      });
      results.push({ id, ok: true });
    } catch (error) {
      results.push({ id, ok: false, error: (error as Error).message });
    }
  }
  if (target === "confirmed" && config.meta.purchaseOn === "confirmed") {
    await Promise.allSettled(results.filter((item) => item.ok).map((item) => sendPurchase(item.id, config)));
  }
  refreshStorefront("products");
  return results;
}

/** Archiver: seulement les commandes annulées. Désarchiver: n'importe laquelle. */
export async function archiveOrders(input: { ids?: number[]; allCancelled?: boolean; archived: boolean }, actor: string) {
  const now = new Date();
  if (input.allCancelled) {
    const rows = await db.update(orders).set({ archivedAt: now }).where(and(eq(orders.status, "cancelled"), isNull(orders.archivedAt))).returning({ id: orders.id });
    if (rows.length) await db.insert(orderEvents).values(rows.map((row) => ({ orderId: row.id, type: "archive", message: "Archivée", actor })));
    return { ok: rows.length, skipped: 0 };
  }
  const ids = input.ids ?? [];
  if (ids.length === 0) return { ok: 0, skipped: 0 };
  const condition = input.archived
    ? and(inArray(orders.id, ids), eq(orders.status, "cancelled"), isNull(orders.archivedAt))
    : and(inArray(orders.id, ids), isNotNull(orders.archivedAt));
  const rows = await db.update(orders).set({ archivedAt: input.archived ? now : null }).where(condition).returning({ id: orders.id });
  if (rows.length) await db.insert(orderEvents).values(rows.map((row) => ({ orderId: row.id, type: "archive", message: input.archived ? "Archivée" : "Désarchivée", actor })));
  return { ok: rows.length, skipped: ids.length - rows.length };
}

export const orderUpdateSchema = z.object({
  customerName: cleanText(3, 80, "Nom requis.").optional(),
  phone: phoneField.optional(),
  phone2: z.string().trim().optional().transform((value) => (value ? normalizeTunisianPhone(value) : null)),
  email: z.union([z.literal(""), z.string().trim().email("Email invalide.")]).optional().transform((value) => value || null),
  governorate: z.enum(governorateValues).optional(),
  city: cleanText(2, 80, "Ville requise.").optional(),
  address: cleanText(8, 250, "Adresse requise.").optional(),
  note: z.string().trim().max(500).optional(),
  internalNote: z.string().trim().max(1000).optional()
});

export async function updateOrderDetails(id: number, raw: unknown, actor: string) {
  const parsed = orderUpdateSchema.safeParse(raw);
  if (!parsed.success) throw new OrderError(parsed.error.issues[0]?.message ?? "Données invalides.");
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) throw new OrderError("Commande introuvable.", 404);
  const data = Object.fromEntries(Object.entries(parsed.data).filter(([, value]) => value !== undefined));
  const customerFields = Object.keys(data).filter((key) => key !== "internalNote");
  if (order.carrierBarcode && customerFields.length) throw new OrderError("Colis déjà chez Jetpack: modifiez l'adresse directement dans votre espace Jetpack.");
  await db.update(orders).set(data).where(eq(orders.id, id));
  if (customerFields.length) await logEvent(db, id, "edit", `Coordonnées modifiées (${customerFields.join(", ")})`, actor);
  return true;
}

/** Envoie les commandes confirmées à Jetpack. Chaque commande reçoit son code à barre de suivi. */
export async function sendOrdersToJetpack(ids: number[], actor: string) {
  const config = await getSettings();
  if (!config.jetpack.addToken) throw new OrderError("Ajoutez le token d'ajout Jetpack dans Réglages → Jetpack.");
  const rows = await db.select().from(orders).where(inArray(orders.id, ids));
  const results: { id: number; number: string; ok: boolean; barcode?: string; error?: string }[] = [];
  for (const order of rows) {
    if (order.carrierBarcode) { results.push({ id: order.id, number: order.number, ok: true, barcode: order.carrierBarcode }); continue; }
    if (order.status !== "confirmed") { results.push({ id: order.id, number: order.number, ok: false, error: "Seules les commandes confirmées peuvent être envoyées." }); continue; }
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
    try {
      const barcode = await addJetpackOrder(config.jetpack.addToken, {
        nom: order.customerName,
        tel: order.phone,
        tel2: order.phone2 ?? "",
        adresse: order.address,
        ville: order.city,
        gouvernerat: order.governorate,
        prix: order.total,
        designation: config.jetpack.designation || "Commande VITAL FORCE",
        article: items.map((item) => `${item.quantity}x ${item.name}`).join(", ").slice(0, 200),
        nb_article: quantity,
        fragile: config.jetpack.fragile,
        ouvrir: config.jetpack.allowOpen,
        msg: [order.number, order.note].filter(Boolean).join(" · ").slice(0, 250)
      });
      await db.transaction(async (tx) => {
        const [fresh] = await tx.select().from(orders).where(eq(orders.id, order.id)).for("update").limit(1);
        await tx.update(orders).set({ carrier: "jetpack", carrierBarcode: barcode, carrierState: "En attente", carrierError: null, carrierSyncedAt: new Date() }).where(eq(orders.id, order.id));
        await applyTransition(tx, { ...fresh, carrierBarcode: barcode }, { status: "shipped", actor }, config);
        await logEvent(tx, order.id, "carrier", `Envoyée à Jetpack · code ${barcode}`, actor);
      });
      results.push({ id: order.id, number: order.number, ok: true, barcode });
    } catch (error) {
      const message = error instanceof JetpackError ? error.message : `Jetpack injoignable: ${(error as Error).message}`;
      await db.update(orders).set({ carrierError: message }).where(eq(orders.id, order.id));
      results.push({ id: order.id, number: order.number, ok: false, error: message });
      if (/token/i.test(message)) break;
    }
  }
  return results;
}

/** Récupère l'état Jetpack des colis en cours (et des colis livrés pas encore payés). */
export async function syncJetpackTracking(options: { maxRequests?: number; actor?: string } = {}) {
  const config = await getSettings();
  if (!config.jetpack.trackToken) throw new OrderError("Ajoutez le token de tracking Jetpack dans Réglages → Jetpack.");
  const candidates = await db.select().from(orders).where(and(
    isNotNull(orders.carrierBarcode),
    or(eq(orders.status, "shipped"), and(eq(orders.status, "delivered"), eq(orders.carrierPaid, false)), and(eq(orders.status, "returned"), ne(orders.carrierState, "Retour paye")))
  )).orderBy(orders.carrierSyncedAt);
  const byCode = new Map(candidates.map((order) => [order.carrierBarcode!, order]));
  const codes = [...byCode.keys()];
  const maxRequests = options.maxRequests ?? 20;
  let changed = 0;
  let checked = 0;
  const notifications: { title: string; body: string; url: string }[] = [];

  for (let start = 0, request = 0; start < codes.length && request < maxRequests; start += 200, request += 1) {
    const results = await trackJetpackOrders(config.jetpack.trackToken, codes.slice(start, start + 200));
    for (const result of results) {
      const order = byCode.get(result.code);
      if (!order) continue;
      checked += 1;
      if (!result.found) { await db.update(orders).set({ carrierSyncedAt: new Date(), carrierError: result.error ?? null }).where(eq(orders.id, order.id)); continue; }
      const nextStatus = statusFromCarrier(result.state);
      const carrierChanged = result.state !== order.carrierState || result.preState !== order.carrierPreState || result.paid !== order.carrierPaid || result.reason !== order.carrierReason;
      await db.transaction(async (tx) => {
        await tx.update(orders).set({
          carrierState: result.state,
          carrierPreState: result.preState,
          carrierReason: result.reason,
          carrierPreReason: result.preReason,
          carrierPaid: result.paid,
          carrierPaidAt: result.paid ? order.carrierPaidAt ?? new Date() : null,
          carrierSyncedAt: new Date(),
          carrierError: null
        }).where(eq(orders.id, order.id));
        if (carrierChanged) await logEvent(tx, order.id, "carrier", `Jetpack: ${result.state}${result.reason ? ` (${result.reason})` : ""}${result.preState ? ` · livreur: ${result.preState}${result.preReason ? ` ${result.preReason}` : ""}` : ""}${result.paid && !order.carrierPaid ? " · payée par Jetpack" : ""}`, "jetpack");
        if (nextStatus && nextStatus !== order.status && nextStatus !== "shipped") {
          await applyTransition(tx, order, { status: nextStatus, actor: "jetpack", carrierDriven: true, reason: result.reason || undefined }, config);
          if (nextStatus === "delivered") notifications.push({ title: `✅ ${order.number} livrée`, body: `${order.customerName} · ${order.total} DT`, url: `/admin/orders/${order.id}` });
          if (nextStatus === "returned") notifications.push({ title: `↩️ ${order.number} retournée`, body: `${order.customerName}${result.reason ? ` · ${result.reason}` : ""}`, url: `/admin/orders/${order.id}` });
        }
      });
      if (carrierChanged) changed += 1;
    }
  }
  if (config.notifications.statusChanges && notifications.length) {
    await notifyAdmins(notifications.length === 1 ? notifications[0] : { title: `📦 ${notifications.length} colis mis à jour`, body: notifications.map((item) => item.title.replace(/^\S+\s/, "")).join(" · ").slice(0, 180), url: "/admin/orders?status=shipped" });
  }
  if (changed) refreshStorefront("products");
  return { checked, changed, remaining: Math.max(0, codes.length - maxRequests * 200) };
}

export async function customerHistory(phones: string[]) {
  if (phones.length === 0) return new Map<string, { total: number; delivered: number; returned: number; cancelled: number }>();
  const rows = await db.select({
    phone: orders.phone,
    total: sql<number>`count(*)::int`,
    delivered: sql<number>`count(*) filter (where ${orders.status} = 'delivered')::int`,
    returned: sql<number>`count(*) filter (where ${orders.status} = 'returned')::int`,
    cancelled: sql<number>`count(*) filter (where ${orders.status} = 'cancelled')::int`
  }).from(orders).where(inArray(orders.phone, [...new Set(phones)])).groupBy(orders.phone);
  return new Map(rows.map((row) => [row.phone, row]));
}

export async function recentDuplicates(order: Pick<OrderRow, "id" | "phone" | "createdAt">, hours: number) {
  if (hours <= 0) return [];
  const since = new Date(order.createdAt.getTime() - hours * 3_600_000);
  return db.select({ id: orders.id, number: orders.number, status: orders.status }).from(orders)
    .where(and(eq(orders.phone, order.phone), ne(orders.id, order.id), gt(orders.createdAt, since), ne(orders.status, "cancelled")));
}
