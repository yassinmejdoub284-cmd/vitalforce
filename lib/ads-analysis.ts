import "server-only";
import { and, asc, between, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { metaAdInsights, metaAds, metaObjects, orders, products } from "@/lib/db/schema";
import { deliveryFeeFor } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { getBreakdowns, getDashboardStats, getObservedRates, TZ, type Range } from "@/lib/stats";

type Totals = {
  spend: number; impressions: number; reach: number; clicks: number; linkClicks: number; landingPageViews: number; viewContent: number; addToCart: number;
  initiateCheckout: number; purchases: number; purchaseValue: number; leads: number; videoPlays3s: number; videoP25: number; videoP50: number; videoP75: number; videoP100: number; thruplays: number;
  postEngagement: number; reactions: number; comments: number; shares: number; saves: number; pageLikes: number; messages: number;
};
type Real = { orders: number; confirmed: number; cancelled: number; delivered: number; returned: number; inProgress: number; revenueDelivered: number };

const metricKeys: (keyof Totals)[] = ["spend", "impressions", "reach", "clicks", "linkClicks", "landingPageViews", "viewContent", "addToCart", "initiateCheckout", "purchases", "purchaseValue", "leads", "videoPlays3s", "videoP25", "videoP50", "videoP75", "videoP100", "thruplays", "postEngagement", "reactions", "comments", "shares", "saves", "pageLikes", "messages"];

/** Objectifs de vente: jugés sur les commandes. Les autres (engagement, notoriété, trafic, messages) sur leurs propres indicateurs. */
const salesObjectives = new Set(["OUTCOME_SALES", "CONVERSIONS", "PRODUCT_CATALOG_SALES"]);
export function campaignKind(objective: string | null | undefined) {
  if (!objective) return "inconnu";
  if (salesObjectives.has(objective)) return "ventes";
  if (/ENGAGEMENT|POST_ENGAGEMENT|PAGE_LIKES|VIDEO_VIEWS|EVENT_RESPONSES/.test(objective)) return "engagement";
  if (/AWARENESS|REACH|BRAND/.test(objective)) return "notoriété";
  if (/TRAFFIC|LINK_CLICKS/.test(objective)) return "trafic";
  if (/MESSAGES/.test(objective)) return "messages";
  if (/LEAD/.test(objective)) return "prospects";
  return objective.toLowerCase();
}

function addActions(target: Record<string, number>, source: Record<string, number> | null | undefined) {
  for (const [key, value] of Object.entries(source ?? {})) target[key] = Math.round(((target[key] ?? 0) + Number(value || 0)) * 1000) / 1000;
}
const emptyTotals = (): Totals => Object.fromEntries(metricKeys.map((key) => [key, 0])) as Totals;
const emptyReal = (): Real => ({ orders: 0, confirmed: 0, cancelled: 0, delivered: 0, returned: 0, inProgress: 0, revenueDelivered: 0 });
const ratio = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 10000) / 10000 : null);
const round = (value: number | null, digits = 3) => (value === null ? null : Math.round(value * 10 ** digits) / 10 ** digits);
const norm = (value: string | undefined | null) => (value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

function add(target: Totals, row: Partial<Totals>) {
  for (const key of metricKeys) target[key] += Number(row[key] ?? 0);
}
function addReal(target: Real, row: Real) {
  for (const key of Object.keys(target) as (keyof Real)[]) target[key] += row[key];
}

export type Flag = { level: "good" | "warn" | "bad"; label: string };

/** Indicateurs calculés: CTR, CPC, CPM, taux de la page, coût par commande réelle, ROAS réel... */
function derive(totals: Totals, real: Real, frequency: number | null, breakEvenCpl: number | null, kind = "ventes") {
  const d = {
    engagementRate: ratio(totals.postEngagement, totals.impressions),
    costPerEngagement: round(totals.postEngagement ? totals.spend / totals.postEngagement : null),
    costPerPageLike: round(totals.pageLikes ? totals.spend / totals.pageLikes : null),
    costPerMessage: round(totals.messages ? totals.spend / totals.messages : null),
    costPerThruplay: round(totals.thruplays ? totals.spend / totals.thruplays : null),
    costPer1000Reach: round(totals.reach ? (totals.spend * 1000) / totals.reach : null),
    ctrLink: ratio(totals.linkClicks, totals.impressions),
    ctrAll: ratio(totals.clicks, totals.impressions),
    cpc: round(totals.linkClicks ? totals.spend / totals.linkClicks : null),
    cpm: round(totals.impressions ? (totals.spend * 1000) / totals.impressions : null),
    frequency: round(frequency ?? (totals.reach ? totals.impressions / totals.reach : null), 2),
    landingRate: ratio(totals.landingPageViews, totals.linkClicks),
    checkoutRate: ratio(totals.initiateCheckout, totals.landingPageViews || totals.linkClicks),
    pixelConversionRate: ratio(totals.purchases, totals.landingPageViews || totals.linkClicks),
    pixelCpa: round(totals.purchases ? totals.spend / totals.purchases : null),
    pixelRoas: round(totals.spend ? totals.purchaseValue / totals.spend : null, 2),
    hookRate: ratio(totals.videoPlays3s, totals.impressions),
    holdRate: ratio(totals.thruplays, totals.videoPlays3s),
    videoCompletion: ratio(totals.videoP100, totals.videoPlays3s),
    realCostPerOrder: round(real.orders ? totals.spend / real.orders : null),
    realCostPerConfirmed: round(real.confirmed ? totals.spend / real.confirmed : null),
    realCostPerDelivered: round(real.delivered ? totals.spend / real.delivered : null),
    realConversionRate: ratio(real.orders, totals.landingPageViews || totals.linkClicks),
    confirmationRate: ratio(real.confirmed, real.confirmed + real.cancelled),
    deliveryRate: ratio(real.delivered, real.delivered + real.returned),
    realRoas: round(totals.spend ? real.revenueDelivered / totals.spend : null, 2)
  };
  const flags: Flag[] = [];
  if (totals.spend > 0 && kind !== "ventes" && kind !== "inconnu") {
    // Campagnes pour chauffer la page: on ne les juge pas sur les ventes.
    if (d.frequency !== null && d.frequency > 4) flags.push({ level: "warn", label: "Fatigue: fréquence > 4" });
    if (kind === "engagement" && totals.impressions >= 1000 && d.engagementRate !== null && d.engagementRate < 0.01) flags.push({ level: "warn", label: "Engagement faible (< 1 % des impressions)" });
    if (totals.videoPlays3s > 0 && totals.impressions >= 1000 && d.hookRate !== null && d.hookRate < 0.2) flags.push({ level: "warn", label: "Vidéo: accroche faible (hook < 20 %)" });
    if (real.orders > 0) flags.push({ level: "good", label: `A aussi généré ${real.orders} commande(s)` });
  } else if (totals.spend > 0) {
    if (breakEvenCpl && real.orders >= 5 && d.realCostPerOrder !== null && d.realCostPerOrder <= breakEvenCpl * 0.7) flags.push({ level: "good", label: "Gagnante: coût par commande bien sous le seuil rentable" });
    if (breakEvenCpl && real.orders > 0 && d.realCostPerOrder !== null && d.realCostPerOrder > breakEvenCpl) flags.push({ level: "bad", label: "Au-dessus du coût pub max rentable" });
    if (breakEvenCpl && real.orders === 0 && totals.spend >= breakEvenCpl * 2) flags.push({ level: "bad", label: "Dépense sans commande réelle" });
    if (d.frequency !== null && d.frequency > 3) flags.push({ level: "warn", label: "Fatigue: fréquence > 3" });
    if (totals.impressions >= 1000 && d.ctrLink !== null && d.ctrLink < 0.008) flags.push({ level: "warn", label: "Créa peu cliquée (CTR lien < 0,8 %)" });
    if (totals.linkClicks >= 50 && d.landingRate !== null && d.landingRate < 0.6) flags.push({ level: "warn", label: "Beaucoup de clics perdus avant la page (page lente ?)" });
    if (totals.landingPageViews >= 100 && real.orders / totals.landingPageViews < 0.01) flags.push({ level: "warn", label: "Page vue mais peu de commandes (< 1 %)" });
    if (totals.videoPlays3s > 0 && totals.impressions >= 1000 && d.hookRate !== null && d.hookRate < 0.2) flags.push({ level: "warn", label: "Vidéo: accroche faible (hook < 20 %)" });
    if (real.delivered + real.returned >= 5 && d.deliveryRate !== null && d.deliveryRate < 0.6) flags.push({ level: "bad", label: "Beaucoup de retours (livraison < 60 %)" });
  }
  return { derived: d, flags };
}

type OrderRow = { id: number; status: string; total: number; utm: Record<string, string> | null; confirmedAt: Date | null };

function realOf(list: OrderRow[]): Real {
  const real = emptyReal();
  for (const order of list) {
    real.orders += 1;
    if (order.confirmedAt && order.status !== "cancelled") real.confirmed += 1;
    if (order.status === "cancelled") real.cancelled += 1;
    if (order.status === "delivered") { real.delivered += 1; real.revenueDelivered += order.total; }
    if (order.status === "returned") real.returned += 1;
    if (order.status === "shipped" || order.status === "confirmed") real.inProgress += 1;
  }
  return real;
}

export async function buildAdsAnalysis(range: Range) {
  const config = await getSettings();
  const [insights, stats, breakdowns, observed, [mainProduct]] = await Promise.all([
    db.select().from(metaAdInsights).where(between(metaAdInsights.date, range.from, range.to)).orderBy(asc(metaAdInsights.date)),
    getDashboardStats(range), getBreakdowns(range), getObservedRates(),
    db.select().from(products).where(eq(products.active, true)).orderBy(asc(products.sortOrder)).limit(1)
  ]);
  const adIds = [...new Set(insights.map((row) => row.adId))];
  const adInfo = adIds.length ? await db.select().from(metaAds).where(inArray(metaAds.adId, adIds)) : [];
  const infoById = new Map(adInfo.map((row) => [row.adId, row]));
  const ordersInRange: OrderRow[] = await db.select({ id: orders.id, status: orders.status, total: orders.total, utm: orders.utm, confirmedAt: orders.confirmedAt }).from(orders)
    .where(and(isNotNull(orders.utm), sql`${orders.createdAt} >= ((${range.from}::date)::timestamp at time zone ${TZ}) and ${orders.createdAt} < (((${range.to}::date + 1))::timestamp at time zone ${TZ})`));

  // Seuil rentable: coût pub maximum par commande reçue, avec les taux réels observés.
  const price = mainProduct?.price ?? 0;
  const unitCost = (mainProduct?.costPrice ?? 0) + (mainProduct?.packagingCost ?? 0);
  const fee = deliveryFeeFor(price, config.delivery);
  const confirmationRate = observed.confirmationRate ?? stats.rates.confirmation ?? 0.7;
  const deliveryRate = observed.deliveryRate ?? stats.rates.delivery ?? 0.75;
  const marginPerDelivered = price + fee - unitCost - config.delivery.carrierCost;
  const lossPerReturn = config.delivery.returnCost + (mainProduct?.packagingCost ?? 0);
  const breakEvenCpl = price ? round(confirmationRate * (deliveryRate * marginPerDelivered - (1 - deliveryRate) * lossPerReturn) - config.costs.confirmationCost, 2) : null;

  // Arbre campagne → ensemble de pubs → pub.
  type Daily = { date: string; spend: number; impressions: number; reach: number; linkClicks: number; landingPageViews: number; purchases: number; postEngagement: number; messages: number; thruplays: number };
  type AdNode = { id: string; name: string; totals: Totals; actions: Record<string, number>; actionValues: Record<string, number>; daily: Daily[] };
  type AdsetNode = { id: string; name: string; optimizationGoal: string | null; totals: Totals; actions: Record<string, number>; ads: Map<string, AdNode> };
  const campaignsMap = new Map<string, { id: string; name: string; objective: string | null; totals: Totals; actions: Record<string, number>; adsets: Map<string, AdsetNode> }>();
  for (const row of insights) {
    const campaign = campaignsMap.get(row.campaignId) ?? { id: row.campaignId, name: row.campaignName, objective: row.objective, totals: emptyTotals(), actions: {}, adsets: new Map() };
    campaign.objective ??= row.objective;
    campaignsMap.set(row.campaignId, campaign);
    const adset = campaign.adsets.get(row.adsetId) ?? { id: row.adsetId, name: row.adsetName, optimizationGoal: row.optimizationGoal, totals: emptyTotals(), actions: {}, ads: new Map() };
    adset.optimizationGoal ??= row.optimizationGoal;
    campaign.adsets.set(row.adsetId, adset);
    const ad = adset.ads.get(row.adId) ?? { id: row.adId, name: row.adName, totals: emptyTotals(), actions: {}, actionValues: {}, daily: [] };
    adset.ads.set(row.adId, ad);
    add(campaign.totals, row); add(adset.totals, row); add(ad.totals, row);
    addActions(campaign.actions, row.actions); addActions(adset.actions, row.actions); addActions(ad.actions, row.actions); addActions(ad.actionValues, row.actionValues);
    ad.daily.push({ date: row.date, spend: row.spend, impressions: row.impressions, reach: row.reach, linkClicks: row.linkClicks, landingPageViews: row.landingPageViews, purchases: row.purchases, postEngagement: row.postEngagement, messages: row.messages, thruplays: row.thruplays });
  }
  const objectIds = [...campaignsMap.keys(), ...[...campaignsMap.values()].flatMap((campaign) => [...campaign.adsets.keys()])].filter(Boolean);
  const objectRows = objectIds.length ? await db.select().from(metaObjects).where(inArray(metaObjects.id, objectIds)) : [];
  const objectById = new Map(objectRows.map((row) => [row.id, row.data]));
  const pickFields = (data: Record<string, unknown> | undefined, fields: string[]) => (data ? Object.fromEntries(fields.filter((field) => data[field] !== undefined && data[field] !== null).map((field) => [field, data[field]])) : null);

  // Rattachement des commandes réelles: ad_id, sinon nom de la pub (utm_content), sinon campagne (campaign_id / utm_campaign).
  const adByName = new Map<string, string[]>();
  const campaignByName = new Map<string, string>();
  for (const campaign of campaignsMap.values()) {
    campaignByName.set(norm(campaign.name), campaign.id);
    for (const adset of campaign.adsets.values()) for (const ad of adset.ads.values()) adByName.set(norm(ad.name), [...(adByName.get(norm(ad.name)) ?? []), `${campaign.id}|${adset.id}|${ad.id}`]);
  }
  const adPath = new Map<string, string>();
  for (const campaign of campaignsMap.values()) for (const adset of campaign.adsets.values()) for (const ad of adset.ads.values()) adPath.set(ad.id, `${campaign.id}|${adset.id}|${ad.id}`);
  const byAd = new Map<string, OrderRow[]>();
  const byCampaignOnly = new Map<string, OrderRow[]>();
  const unattributed: OrderRow[] = [];
  for (const order of ordersInRange) {
    const utm = order.utm ?? {};
    const source = norm(utm.utm_source);
    const fromMeta = /^(fb|facebook|meta|ig|instagram)/.test(source) || Boolean(utm.fbclid) || Boolean(utm.ad_id);
    let path = utm.ad_id ? adPath.get(utm.ad_id) : undefined;
    if (!path && utm.utm_content) {
      const candidates = adByName.get(norm(utm.utm_content)) ?? [];
      const campaignId = utm.campaign_id || campaignByName.get(norm(utm.utm_campaign));
      path = candidates.find((candidate) => !campaignId || candidate.startsWith(`${campaignId}|`)) ?? (candidates.length === 1 ? candidates[0] : undefined);
    }
    if (path) { byAd.set(path, [...(byAd.get(path) ?? []), order]); continue; }
    const campaignId = (utm.campaign_id && campaignsMap.has(utm.campaign_id) ? utm.campaign_id : undefined) ?? campaignByName.get(norm(utm.utm_campaign));
    if (campaignId) { byCampaignOnly.set(campaignId, [...(byCampaignOnly.get(campaignId) ?? []), order]); continue; }
    if (fromMeta) unattributed.push(order);
  }

  const campaigns = [...campaignsMap.values()].map((campaign) => {
    const campaignData = objectById.get(campaign.id);
    const objective = campaign.objective ?? (campaignData?.objective ? String(campaignData.objective) : null);
    const kind = campaignKind(objective);
    const campaignReal = realOf(byCampaignOnly.get(campaign.id) ?? []);
    const adsets = [...campaign.adsets.values()].map((adset) => {
      const adsetReal = emptyReal();
      const ads = [...adset.ads.values()].map((ad) => {
        const info = infoById.get(ad.id);
        const real = realOf(byAd.get(`${campaign.id}|${adset.id}|${ad.id}`) ?? []);
        addReal(adsetReal, real);
        const { derived, flags } = derive(ad.totals, real, info?.periodSince === range.from && info?.periodUntil === range.to ? info.periodFrequency ?? null : null, breakEvenCpl, kind);
        return {
          id: ad.id, name: ad.name, status: info?.effectiveStatus ?? null, createdTime: info?.createdTime?.toISOString() ?? null,
          periodReach: info?.periodSince === range.from && info?.periodUntil === range.to ? info.periodReach : null,
          allActions: ad.actions, allActionValues: ad.actionValues,
          creative: info ? { title: info.title, body: info.body, callToAction: info.callToAction, format: info.objectType, link: info.link, thumbnailUrl: info.thumbnailUrl } : null,
          rankings: info?.qualityRanking ? { quality: info.qualityRanking, engagement: info.engagementRanking, conversion: info.conversionRanking } : null,
          metrics: roundTotals(ad.totals), real: roundReal(real), derived, flags, daily: ad.daily
        };
      }).sort((a, b) => b.metrics.spend - a.metrics.spend);
      const { derived, flags } = derive(adset.totals, adsetReal, null, breakEvenCpl, kind);
      const details = pickFields(objectById.get(adset.id), ["status", "effective_status", "optimization_goal", "billing_event", "bid_strategy", "daily_budget", "lifetime_budget", "start_time", "end_time", "destination_type", "promoted_object", "targeting"]);
      return { id: adset.id, name: adset.name, optimizationGoal: adset.optimizationGoal, details, metrics: roundTotals(adset.totals), allActions: adset.actions, real: roundReal(adsetReal), derived, flags, ads };
    }).sort((a, b) => b.metrics.spend - a.metrics.spend);
    const total = emptyReal();
    addReal(total, campaignReal);
    for (const adset of adsets) addReal(total, adset.real);
    const { derived, flags } = derive(campaign.totals, total, null, breakEvenCpl, kind);
    const details = pickFields(campaignData, ["status", "effective_status", "buying_type", "daily_budget", "lifetime_budget", "budget_remaining", "bid_strategy", "special_ad_categories", "start_time", "stop_time", "created_time"]);
    return { id: campaign.id, name: campaign.name, objective, kind, details, allActions: campaign.actions, metrics: roundTotals(campaign.totals), real: roundReal(total), ordersMatchedToCampaignOnly: campaignReal.orders, derived, flags, adsets };
  }).sort((a, b) => b.metrics.spend - a.metrics.spend);

  const allTotals = emptyTotals();
  for (const campaign of campaigns) add(allTotals, campaign.metrics);
  const allReal = emptyReal();
  for (const campaign of campaigns) addReal(allReal, campaign.real);

  return {
    generatedAt: new Date().toISOString(),
    period: { from: range.from, to: range.to, days: stats.days, timezone: TZ, currency: "TND" },
    business: {
      product: mainProduct ? { name: mainProduct.name, price, unitCost, compareAtPrice: mainProduct.compareAtPrice } : null,
      delivery: { feePaidByCustomer: fee, includedInPrice: config.delivery.included, carrierCostPerDelivered: config.delivery.carrierCost, carrierCostPerReturn: config.delivery.returnCost, selfDeliveryCost: config.delivery.selfCost },
      confirmationCostPerOrder: config.costs.confirmationCost,
      observedRates90d: { confirmationRate: round(confirmationRate, 3), deliveryRate: round(deliveryRate, 3), ordersUsed: observed.received },
      breakEvenAdCostPerOrder: breakEvenCpl,
      purchaseEventSentOn: config.meta.purchaseOn
    },
    totals: {
      meta: roundTotals(allTotals), realAttributed: roundReal(allReal), ...derive(allTotals, allReal, null, breakEvenCpl),
      byKind: Object.entries(campaigns.reduce<Record<string, { campaigns: number; spend: number; impressions: number; reach: number; orders: number }>>((acc, campaign) => {
        const item = acc[campaign.kind] ?? { campaigns: 0, spend: 0, impressions: 0, reach: 0, orders: 0 };
        item.campaigns += 1; item.spend += campaign.metrics.spend; item.impressions += campaign.metrics.impressions; item.reach += campaign.metrics.reach; item.orders += campaign.real.orders;
        acc[campaign.kind] = item;
        return acc;
      }, {})).map(([kind, value]) => ({ kind, ...value, spend: Math.round(value.spend * 1000) / 1000 }))
    },
    store: {
      orders: stats.orders, rates: stats.rates, profit: stats.profit, costs: stats.costs, unitCosts: stats.unitCosts,
      siteFunnel: stats.traffic, trafficSources: breakdowns.sources, landingPages: breakdowns.angles, governorates: breakdowns.governorates
    },
    unattributedMetaOrders: roundReal(realOf(unattributed)),
    campaigns,
    definitions: {
      spend: "Dépense Meta (TND)", linkClicks: "Clics sur le lien", landingPageViews: "Vues de la page de destination (pixel chargé)",
      purchases: "Achats comptés par le pixel/API Conversions", purchaseValue: "Valeur des achats pixel",
      videoPlays3s: "Lectures vidéo de 3 s", thruplays: "Lectures de 15 s ou complètes",
      ctrLink: "linkClicks / impressions", cpc: "spend / linkClicks", cpm: "spend × 1000 / impressions", frequency: "impressions / portée (période)",
      landingRate: "landingPageViews / linkClicks", checkoutRate: "initiateCheckout / landingPageViews", pixelConversionRate: "purchases / landingPageViews",
      hookRate: "lectures 3 s / impressions", holdRate: "thruplays / lectures 3 s",
      real: "Commandes réelles enregistrées sur le site, rattachées à la pub par ad_id ou utm_content (nom de la pub), sinon à la campagne par utm_campaign",
      realCostPerOrder: "spend / commandes reçues", realCostPerDelivered: "spend / commandes livrées", realRoas: "CA livré / spend",
      breakEvenAdCostPerOrder: "Coût pub maximum par commande reçue pour un profit nul, avec les taux de confirmation et de livraison observés",
      flags: "Signaux automatiques (règles simples), à confirmer par l'analyse",
      kind: "Type de campagne déduit de l'objectif Meta: ventes (jugée sur les commandes), engagement / notoriété / trafic / messages (pour chauffer la page, jugées sur leurs propres indicateurs)",
      postEngagement: "Interactions avec la publication (réactions, commentaires, partages, clics...)", pageLikes: "Mentions J'aime la Page", messages: "Conversations démarrées en message privé",
      engagementRate: "postEngagement / impressions", costPerEngagement: "spend / postEngagement", costPerMessage: "spend / messages", costPerThruplay: "spend / thruplays",
      allActions: "Toutes les actions brutes renvoyées par Meta (type d'action → nombre) sur la période",
      reach: "Portée: au niveau pub, periodReach = portée réelle sur la période; les sommes de portée aux niveaux supérieurs additionnent des jours et surestiment la portée unique",
      details: "Paramètres Meta: statut, budget (TND), enchère, dates, objectif d'optimisation, ciblage"
    }
  };
}

function roundTotals(totals: Totals) {
  return { ...totals, spend: Math.round(totals.spend * 1000) / 1000, purchaseValue: Math.round(totals.purchaseValue * 1000) / 1000 };
}
function roundReal(real: Real) {
  return { ...real, revenueDelivered: Math.round(real.revenueDelivered * 1000) / 1000 };
}

export type AdsAnalysis = Awaited<ReturnType<typeof buildAdsAnalysis>>;
