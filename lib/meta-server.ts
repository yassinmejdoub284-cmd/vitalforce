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

/* ------------------------------------------------------------------ */
/* Analyse détaillée: statistiques par pub (Marketing API / Insights)  */
/* ------------------------------------------------------------------ */

type Action = { action_type: string; value: string };

function adAccount(meta: Settings["meta"]) {
  if (!meta.adAccountId || !meta.marketingToken) throw new Error("Ajoutez l'ID du compte publicitaire et le token Marketing API dans Réglages → Meta.");
  return meta.adAccountId.startsWith("act_") ? meta.adAccountId : `act_${meta.adAccountId}`;
}

/** Lit toutes les pages d'une réponse Graph API. */
async function graphAll(token: string, firstUrl: string, maxPages = 40) {
  const rows: Record<string, unknown>[] = [];
  let url: string | undefined = firstUrl;
  for (let page = 0; url && page < maxPages; page += 1) {
    const response: Response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(30_000) });
    const data = await response.json() as { data?: Record<string, unknown>[]; paging?: { next?: string }; error?: { message?: string } };
    if (!response.ok || data.error) throw new Error(`Meta Ads: ${data.error?.message ?? `HTTP ${response.status}`}`);
    rows.push(...(data.data ?? []));
    url = data.paging?.next;
  }
  return rows;
}

/** Valeur d'une action: le type « pixel » (offsite_conversion.*) en priorité pour éviter les doublons. */
function pick(actions: Action[] | undefined, pixelType: string, genericType?: string) {
  const sum = (type: string) => (actions ?? []).filter((action) => action.action_type === type).reduce((total, action) => total + Number(action.value || 0), 0);
  return sum(pixelType) || (genericType ? sum(genericType) : 0);
}

const firstValue = (actions: Action[] | undefined) => Number(actions?.[0]?.value ?? 0);

export type AdDailyInsight = {
  date: string; campaignId: string; campaignName: string; adsetId: string; adsetName: string; adId: string; adName: string;
  spend: number; impressions: number; reach: number; clicks: number; linkClicks: number; landingPageViews: number;
  viewContent: number; addToCart: number; initiateCheckout: number; purchases: number; purchaseValue: number; leads: number;
  videoPlays3s: number; videoP25: number; videoP50: number; videoP75: number; videoP100: number; thruplays: number;
  postEngagement: number; reactions: number; comments: number; shares: number; saves: number; pageLikes: number; messages: number;
  objective: string | null; optimizationGoal: string | null; actions: Record<string, number>; actionValues: Record<string, number>;
};

const insightFields = [
  "campaign_id", "campaign_name", "adset_id", "adset_name", "ad_id", "ad_name", "objective", "optimization_goal", "spend", "impressions", "reach", "clicks", "inline_link_clicks",
  "actions", "action_values", "video_p25_watched_actions", "video_p50_watched_actions", "video_p75_watched_actions", "video_p100_watched_actions", "video_thruplay_watched_actions"
].join(",");

const asMap = (list: Action[] | undefined) => Object.fromEntries((list ?? []).map((action) => [action.action_type, Number(action.value || 0)]));

function toInsight(row: Record<string, unknown>): Omit<AdDailyInsight, "date"> {
  const actions = row.actions as Action[] | undefined;
  const values = row.action_values as Action[] | undefined;
  return {
    objective: row.objective ? String(row.objective) : null,
    optimizationGoal: row.optimization_goal ? String(row.optimization_goal) : null,
    actions: asMap(actions),
    actionValues: asMap(values),
    postEngagement: pick(actions, "post_engagement"),
    reactions: pick(actions, "post_reaction"),
    comments: pick(actions, "comment"),
    shares: pick(actions, "post"),
    saves: pick(actions, "onsite_conversion.post_save"),
    pageLikes: pick(actions, "like"),
    messages: pick(actions, "onsite_conversion.messaging_conversation_started_7d"),
    campaignId: String(row.campaign_id ?? ""), campaignName: String(row.campaign_name ?? "Sans nom"),
    adsetId: String(row.adset_id ?? ""), adsetName: String(row.adset_name ?? "Sans nom"),
    adId: String(row.ad_id ?? ""), adName: String(row.ad_name ?? "Sans nom"),
    spend: Number(row.spend ?? 0), impressions: Number(row.impressions ?? 0), reach: Number(row.reach ?? 0),
    clicks: Number(row.clicks ?? 0), linkClicks: Number(row.inline_link_clicks ?? 0),
    landingPageViews: pick(actions, "landing_page_view"),
    viewContent: pick(actions, "offsite_conversion.fb_pixel_view_content", "view_content"),
    addToCart: pick(actions, "offsite_conversion.fb_pixel_add_to_cart", "add_to_cart"),
    initiateCheckout: pick(actions, "offsite_conversion.fb_pixel_initiate_checkout", "initiate_checkout"),
    purchases: pick(actions, "offsite_conversion.fb_pixel_purchase", "purchase"),
    purchaseValue: pick(values, "offsite_conversion.fb_pixel_purchase", "purchase"),
    leads: pick(actions, "offsite_conversion.fb_pixel_lead", "lead"),
    videoPlays3s: pick(actions, "video_view"),
    videoP25: firstValue(row.video_p25_watched_actions as Action[] | undefined),
    videoP50: firstValue(row.video_p50_watched_actions as Action[] | undefined),
    videoP75: firstValue(row.video_p75_watched_actions as Action[] | undefined),
    videoP100: firstValue(row.video_p100_watched_actions as Action[] | undefined),
    thruplays: firstValue(row.video_thruplay_watched_actions as Action[] | undefined)
  };
}

/** Statistiques jour par jour de chaque pub. */
export async function fetchAdDailyInsights(meta: Settings["meta"], since: string, until: string): Promise<AdDailyInsight[]> {
  const params = new URLSearchParams({ level: "ad", time_increment: "1", fields: insightFields, time_range: JSON.stringify({ since, until }), limit: "500" });
  const rows = await graphAll(meta.marketingToken, `${GRAPH}/${adAccount(meta)}/insights?${params}`);
  return rows.map((row) => ({ date: String(row.date_start), ...toInsight(row) })).filter((row) => row.adId);
}

export type AdPeriodStats = { adId: string; reach: number; frequency: number; qualityRanking: string; engagementRanking: string; conversionRanking: string };

/** Portée et fréquence réelles sur toute la période (non additionnables jour par jour) + classements de qualité Meta. */
export async function fetchAdPeriodStats(meta: Settings["meta"], since: string, until: string): Promise<AdPeriodStats[]> {
  const params = new URLSearchParams({ level: "ad", fields: "ad_id,reach,frequency,quality_ranking,engagement_rate_ranking,conversion_rate_ranking", time_range: JSON.stringify({ since, until }), limit: "500" });
  const rows = await graphAll(meta.marketingToken, `${GRAPH}/${adAccount(meta)}/insights?${params}`);
  return rows.map((row) => ({
    adId: String(row.ad_id ?? ""), reach: Number(row.reach ?? 0), frequency: Number(row.frequency ?? 0),
    qualityRanking: String(row.quality_ranking ?? ""), engagementRanking: String(row.engagement_rate_ranking ?? ""), conversionRanking: String(row.conversion_rate_ranking ?? "")
  })).filter((row) => row.adId);
}

export type AdCreativeInfo = {
  adId: string; name: string; status: string; effectiveStatus: string; createdTime: string | null;
  campaignId: string; adsetId: string; title: string; body: string; callToAction: string; objectType: string; thumbnailUrl: string; link: string;
};

/** Infos des pubs: statut et contenu de la créa (titre, texte, bouton, lien). */
export async function fetchAdsCreatives(meta: Settings["meta"]): Promise<AdCreativeInfo[]> {
  const params = new URLSearchParams({
    fields: "id,name,status,effective_status,created_time,campaign_id,adset_id,creative{title,body,call_to_action_type,object_type,thumbnail_url,object_story_spec,asset_feed_spec}",
    limit: "200"
  });
  const rows = await graphAll(meta.marketingToken, `${GRAPH}/${adAccount(meta)}/ads?${params}`, 15);
  return rows.map((row) => {
    const creative = (row.creative ?? {}) as Record<string, unknown>;
    const story = (creative.object_story_spec ?? {}) as Record<string, Record<string, unknown> | undefined>;
    const link = story.link_data ?? {};
    const video = story.video_data ?? {};
    const feed = (creative.asset_feed_spec ?? {}) as { bodies?: { text?: string }[]; titles?: { text?: string }[]; link_urls?: { website_url?: string }[] };
    const cta = (link.call_to_action ?? video.call_to_action) as { type?: string; value?: { link?: string } } | undefined;
    return {
      adId: String(row.id), name: String(row.name ?? ""), status: String(row.status ?? ""), effectiveStatus: String(row.effective_status ?? ""),
      createdTime: row.created_time ? String(row.created_time) : null, campaignId: String(row.campaign_id ?? ""), adsetId: String(row.adset_id ?? ""),
      title: String(creative.title ?? link.name ?? video.title ?? feed.titles?.[0]?.text ?? ""),
      body: String(creative.body ?? link.message ?? video.message ?? feed.bodies?.map((item) => item.text).filter(Boolean).join("\n---\n") ?? ""),
      callToAction: String(creative.call_to_action_type ?? cta?.type ?? ""),
      objectType: String(creative.object_type ?? ""),
      thumbnailUrl: String(creative.thumbnail_url ?? ""),
      link: String(link.link ?? cta?.value?.link ?? feed.link_urls?.[0]?.website_url ?? "")
    };
  });
}

/** Campagnes et ensembles de pubs: objectif, statut, budget, dates, ciblage. */
export async function fetchCampaignsAndAdsets(meta: Settings["meta"]) {
  const account = adAccount(meta);
  const [campaigns, adsets] = await Promise.all([
    graphAll(meta.marketingToken, `${GRAPH}/${account}/campaigns?${new URLSearchParams({ fields: "id,name,objective,status,effective_status,buying_type,daily_budget,lifetime_budget,budget_remaining,bid_strategy,special_ad_categories,start_time,stop_time,created_time", limit: "200" })}`, 10),
    graphAll(meta.marketingToken, `${GRAPH}/${account}/adsets?${new URLSearchParams({ fields: "id,name,campaign_id,status,effective_status,optimization_goal,billing_event,bid_strategy,daily_budget,lifetime_budget,start_time,end_time,destination_type,promoted_object,targeting{age_min,age_max,genders,geo_locations,locales,publisher_platforms,facebook_positions,instagram_positions,device_platforms,flexible_spec,exclusions,custom_audiences,excluded_custom_audiences,targeting_automation}", limit: "200" })}`, 10)
  ]);
  // Les budgets Meta sont en centimes de la devise du compte.
  const money = (value: unknown) => (value === undefined || value === null || value === "" ? null : Number(value) / 100);
  type MetaObject = Record<string, unknown> & { id: string; name?: string };
  return {
    campaigns: campaigns.map((row) => ({ ...row, daily_budget: money(row.daily_budget), lifetime_budget: money(row.lifetime_budget), budget_remaining: money(row.budget_remaining) }) as unknown as MetaObject),
    adsets: adsets.map((row) => ({ ...row, daily_budget: money(row.daily_budget), lifetime_budget: money(row.lifetime_budget) }) as unknown as MetaObject)
  };
}
