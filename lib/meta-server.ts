import "server-only";
import { createHash } from "node:crypto";
import type { Settings } from "@/lib/settings";

const GRAPH = "https://graph.facebook.com/v23.0";
const sha256 = (value: string) => createHash("sha256").update(value.trim().toLowerCase()).digest("hex");

export type CapiOrder = {
  number: string;
  total: number;
  phone: string;
  customerName: string;
  city: string;
  governorate: string;
  email?: string | null;
  visitorId?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: Date;
  items: { productId: string; quantity: number; unitPrice: number }[];
  sourceUrl?: string;
};

/** event_id identique au pixel navigateur pour que Meta déduplique les deux envois. */
export const purchaseEventId = (orderNumber: string) => `purchase-${orderNumber}`;

export async function sendCapiPurchase(meta: Settings["meta"], order: CapiOrder) {
  if (!meta.pixelId || !meta.capiToken) return { ok: false, skipped: true as const };
  const [firstName, ...rest] = order.customerName.trim().split(/\s+/);
  const userData: Record<string, unknown> = {
    ph: [sha256(`216${order.phone}`)],
    fn: firstName ? [sha256(firstName)] : undefined,
    ln: rest.length ? [sha256(rest.join(" "))] : undefined,
    ct: [sha256(order.city.replace(/\s+/g, ""))],
    st: [sha256(order.governorate.replace(/\s+/g, ""))],
    country: [sha256("tn")],
    em: order.email ? [sha256(order.email)] : undefined,
    external_id: order.visitorId ? [sha256(order.visitorId)] : undefined,
    fbp: order.fbp || undefined,
    fbc: order.fbc || undefined,
    client_ip_address: order.ip && order.ip !== "local" ? order.ip : undefined,
    client_user_agent: order.userAgent || undefined
  };
  const body = {
    data: [{
      event_name: "Purchase",
      event_time: Math.floor(order.createdAt.getTime() / 1000),
      event_id: purchaseEventId(order.number),
      action_source: "website",
      event_source_url: order.sourceUrl,
      user_data: Object.fromEntries(Object.entries(userData).filter(([, value]) => value !== undefined)),
      custom_data: {
        currency: "TND",
        value: order.total,
        order_id: order.number,
        content_type: "product",
        content_ids: order.items.map((item) => item.productId),
        contents: order.items.map((item) => ({ id: item.productId, quantity: item.quantity, item_price: item.unitPrice })),
        num_items: order.items.reduce((sum, item) => sum + item.quantity, 0)
      }
    }],
    test_event_code: meta.testEventCode || undefined
  };
  const response = await fetch(`${GRAPH}/${meta.pixelId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${meta.capiToken}` },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) console.error("[meta capi]", response.status, await response.text().catch(() => ""));
  return { ok: response.ok, skipped: false as const };
}

export type AdInsightDay = {
  date: string;
  campaign: string;
  spend: number;
  impressions: number;
  clicks: number;
  landingPageViews: number;
  purchases: number;
  checkouts: number;
};

const actionCount = (actions: { action_type: string; value: string }[] | undefined, types: string[]) =>
  (actions ?? []).filter((action) => types.includes(action.action_type)).reduce((sum, action) => sum + Number(action.value || 0), 0);

/** Dépenses Meta Ads par jour et par campagne (Marketing API / Insights). */
export async function fetchAdInsights(meta: Settings["meta"], since: string, until: string): Promise<AdInsightDay[]> {
  if (!meta.adAccountId || !meta.marketingToken) throw new Error("Ajoutez l'ID du compte publicitaire et le token Marketing API dans Réglages → Meta.");
  const account = meta.adAccountId.startsWith("act_") ? meta.adAccountId : `act_${meta.adAccountId}`;
  const params = new URLSearchParams({
    level: "campaign",
    time_increment: "1",
    fields: "campaign_name,spend,impressions,clicks,actions",
    time_range: JSON.stringify({ since, until }),
    limit: "500"
  });
  const results: AdInsightDay[] = [];
  let url: string | undefined = `${GRAPH}/${account}/insights?${params}`;
  for (let page = 0; url && page < 20; page += 1) {
    const response: Response = await fetch(url, { headers: { Authorization: `Bearer ${meta.marketingToken}` }, cache: "no-store", signal: AbortSignal.timeout(20_000) });
    const data = await response.json() as { data?: Record<string, unknown>[]; paging?: { next?: string }; error?: { message?: string } };
    if (!response.ok || data.error) throw new Error(`Meta Ads: ${data.error?.message ?? `HTTP ${response.status}`}`);
    for (const row of data.data ?? []) {
      const actions = row.actions as { action_type: string; value: string }[] | undefined;
      results.push({
        date: String(row.date_start),
        campaign: String(row.campaign_name ?? "Total"),
        spend: Number(row.spend ?? 0),
        impressions: Number(row.impressions ?? 0),
        clicks: Number(row.clicks ?? 0),
        landingPageViews: actionCount(actions, ["landing_page_view"]),
        // Meta renvoie parfois "purchase" et "offsite_conversion.fb_pixel_purchase" pour les mêmes achats: on n'en garde qu'un.
        purchases: actionCount(actions, ["offsite_conversion.fb_pixel_purchase"]) || actionCount(actions, ["purchase"]),
        checkouts: actionCount(actions, ["offsite_conversion.fb_pixel_initiate_checkout"])
      });
    }
    url = data.paging?.next;
  }
  return results;
}
