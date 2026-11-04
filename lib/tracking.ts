import "server-only";
import { and, count, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { events, settings as settingsTable, trackingEventTypes, visitors } from "@/lib/db/schema";
import { notifyAdmins } from "@/lib/push";
import { getSettings } from "@/lib/settings";

export const ONLINE_WINDOW_SECONDS = 60;

export const trackSchema = z.object({
  vid: z.string().regex(/^[a-zA-Z0-9-]{8,64}$/),
  type: z.enum([...trackingEventTypes, "ping"]),
  path: z.string().max(300).optional(),
  angle: z.string().max(60).optional(),
  ref: z.string().max(500).optional(),
  utm: z.record(z.string(), z.string().max(150)).optional(),
  value: z.number().min(0).max(100000).optional()
});

const botPattern = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse|pingdom|monitor/i;

export function isBot(userAgent: string) {
  return !userAgent || botPattern.test(userAgent);
}

function deviceOf(userAgent: string) {
  if (/ipad|tablet/i.test(userAgent)) return "tablette";
  if (/mobi|android|iphone/i.test(userAgent)) return "mobile";
  return "ordinateur";
}

export function sourceOf(utm: Record<string, string> | undefined, referrer: string | undefined) {
  const tagged = utm?.utm_source?.toLowerCase();
  if (tagged) {
    if (/^(fb|facebook|meta)/.test(tagged)) return "facebook";
    if (/^(ig|instagram)/.test(tagged)) return "instagram";
    return tagged.slice(0, 30);
  }
  if (utm?.fbclid) return "facebook";
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (/facebook|fb\.com|messenger/.test(host)) return "facebook";
    if (/instagram/.test(host)) return "instagram";
    if (/tiktok/.test(host)) return "tiktok";
    if (/google/.test(host)) return "google";
    return host.slice(0, 40);
  } catch {
    return "direct";
  }
}

export async function recordTracking(input: z.infer<typeof trackSchema>, request: { userAgent: string; country?: string | null; city?: string | null; host?: string | null }) {
  const now = new Date();
  const path = input.path?.split("?")[0].slice(0, 200) ?? null;
  if (path?.startsWith("/admin")) return;
  let referrer = input.ref;
  try {
    if (referrer && request.host && new URL(referrer).host === request.host) referrer = undefined;
  } catch { referrer = undefined; }
  const source = sourceOf(input.utm, referrer);

  const inserted = await db.insert(visitors).values({
    id: input.vid,
    firstSeen: now,
    lastSeen: now,
    currentPath: path,
    landingPath: path,
    referrer: referrer?.slice(0, 300),
    source,
    utm: input.utm,
    device: deviceOf(request.userAgent),
    country: request.country ?? null,
    city: request.city ? decodeURIComponent(request.city).slice(0, 60) : null,
    pageViews: input.type === "page_view" ? 1 : 0
  }).onConflictDoUpdate({
    target: visitors.id,
    set: {
      lastSeen: now,
      currentPath: path ?? sql`${visitors.currentPath}`,
      pageViews: input.type === "page_view" ? sql`${visitors.pageViews} + 1` : sql`${visitors.pageViews}`
    }
  }).returning({ firstSeen: visitors.firstSeen, source: visitors.source });

  if (input.type !== "ping") {
    await db.insert(events).values({ visitorId: input.vid, type: input.type, path, angle: input.angle, source: inserted[0]?.source ?? source, value: input.value });
  }
  const isNew = inserted[0] && inserted[0].firstSeen.getTime() === now.getTime();
  if (isNew) await maybeNotifyVisitors();
}

export async function onlineVisitorCount() {
  const since = new Date(Date.now() - ONLINE_WINDOW_SECONDS * 1000);
  const [{ online }] = await db.select({ online: count() }).from(visitors).where(gt(visitors.lastSeen, since));
  return online;
}

async function maybeNotifyVisitors() {
  const config = await getSettings();
  if (!config.notifications.visitors) return;
  const [runtime] = await db.select().from(settingsTable).where(eq(settingsTable.key, "runtime")).limit(1);
  const last = Number((runtime?.value as { lastVisitorPushAt?: number } | undefined)?.lastVisitorPushAt ?? 0);
  if (Date.now() - last < config.notifications.visitorIntervalMin * 60_000) return;
  // Verrou optimiste: une seule fonction gagne la mise à jour, donc une seule notification.
  const value = { lastVisitorPushAt: Date.now() };
  const updated = runtime
    ? await db.update(settingsTable).set({ value }).where(and(eq(settingsTable.key, "runtime"), sql`coalesce((${settingsTable.value}->>'lastVisitorPushAt')::bigint, 0) = ${last}`)).returning()
    : await db.insert(settingsTable).values({ key: "runtime", value }).onConflictDoNothing().returning();
  if (updated.length === 0) return;
  const online = await onlineVisitorCount();
  const since = new Date(Date.now() - config.notifications.visitorIntervalMin * 60_000);
  const [{ fresh }] = await db.select({ fresh: count() }).from(visitors).where(gt(visitors.firstSeen, since));
  await notifyAdmins({ title: `👀 ${online} visiteur${online > 1 ? "s" : ""} en ligne`, body: `${fresh} nouveau${fresh > 1 ? "x" : ""} visiteur${fresh > 1 ? "s" : ""} ces ${config.notifications.visitorIntervalMin} dernières minutes`, url: "/admin/live", tag: "visitors" });
}
