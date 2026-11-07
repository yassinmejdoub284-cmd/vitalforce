import "server-only";
import { and, between, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { adSpend, metaAdInsights, metaAds, metaObjects } from "@/lib/db/schema";
import { fetchAdDailyInsights, fetchAdPeriodStats, fetchAdsCreatives, fetchCampaignsAndAdsets } from "@/lib/meta-server";
import { getSettings } from "@/lib/settings";

const chunk = <T,>(items: T[], size: number) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));

/**
 * Importe les statistiques Meta Ads jour par jour au niveau de chaque pub, puis:
 * - recalcule les dépenses par campagne (table ad_spend, utilisée par le tableau de bord),
 * - met à jour la fiche des pubs (créa, statut, portée/fréquence, classements).
 */
export async function syncAdInsights(since: string, until: string) {
  const config = await getSettings();
  const insights = await fetchAdDailyInsights(config.meta, since, until);

  // Dépenses par jour et par campagne (deux campagnes au même nom sont additionnées).
  const campaigns = new Map<string, { date: string; campaign: string; amount: number; impressions: number; clicks: number; lpv: number; purchases: number; checkouts: number }>();
  for (const row of insights) {
    const campaign = row.campaignName.trim().slice(0, 120) || "Sans nom";
    const key = `${row.date}|${campaign}`;
    const current = campaigns.get(key) ?? { date: row.date, campaign, amount: 0, impressions: 0, clicks: 0, lpv: 0, purchases: 0, checkouts: 0 };
    current.amount += row.spend; current.impressions += row.impressions; current.clicks += row.clicks;
    current.lpv += row.landingPageViews; current.purchases += row.purchases; current.checkouts += row.initiateCheckout;
    campaigns.set(key, current);
  }

  await db.transaction(async (tx) => {
    await tx.delete(metaAdInsights).where(between(metaAdInsights.date, since, until));
    for (const part of chunk(insights, 400)) {
      await tx.insert(metaAdInsights).values(part.map((row) => ({ ...row, campaignName: row.campaignName.slice(0, 200), adsetName: row.adsetName.slice(0, 200), adName: row.adName.slice(0, 200) })))
        .onConflictDoNothing();
    }
    await tx.delete(adSpend).where(and(eq(adSpend.source, "meta-api"), between(adSpend.date, since, until)));
    const values = [...campaigns.values()];
    for (const part of chunk(values, 400)) {
      await tx.insert(adSpend).values(part.map((row) => ({
        date: row.date, platform: "meta", campaign: row.campaign, amount: Math.round(row.amount * 1000) / 1000,
        impressions: row.impressions, clicks: row.clicks, landingPageViews: row.lpv, pixelPurchases: row.purchases, pixelCheckouts: row.checkouts, source: "meta-api"
      }))).onConflictDoUpdate({
        target: [adSpend.date, adSpend.platform, adSpend.campaign],
        set: { amount: sql`excluded.amount`, impressions: sql`excluded.impressions`, clicks: sql`excluded.clicks`, landingPageViews: sql`excluded.landing_page_views`, pixelPurchases: sql`excluded.pixel_purchases`, pixelCheckouts: sql`excluded.pixel_checkouts`, source: "meta-api" }
      });
    }
  });

  // Fiches des pubs: une erreur ici (permission manquante...) n'empêche pas l'import des chiffres.
  let adsUpdated = 0;
  let warning: string | undefined;
  try {
    const [creatives, period] = await Promise.all([fetchAdsCreatives(config.meta), fetchAdPeriodStats(config.meta, since, until)]);
    const periodById = new Map(period.map((row) => [row.adId, row]));
    const names = new Map(insights.map((row) => [row.adId, row]));
    for (const creative of creatives) {
      const stats = periodById.get(creative.adId);
      const value = {
        name: creative.name || names.get(creative.adId)?.adName || "", status: creative.status, effectiveStatus: creative.effectiveStatus,
        campaignId: creative.campaignId, adsetId: creative.adsetId, createdTime: creative.createdTime ? new Date(creative.createdTime) : null,
        title: creative.title.slice(0, 500), body: creative.body.slice(0, 4000), callToAction: creative.callToAction, objectType: creative.objectType,
        thumbnailUrl: creative.thumbnailUrl.slice(0, 1000), link: creative.link.slice(0, 1000),
        ...(stats ? { periodSince: since, periodUntil: until, periodReach: stats.reach, periodFrequency: stats.frequency, qualityRanking: stats.qualityRanking, engagementRanking: stats.engagementRanking, conversionRanking: stats.conversionRanking } : {})
      };
      await db.insert(metaAds).values({ adId: creative.adId, ...value }).onConflictDoUpdate({ target: metaAds.adId, set: value });
      adsUpdated += 1;
    }
  } catch (error) {
    warning = (error as Error).message;
    console.error("[ads] fiches des pubs", error);
  }
  try {
    const { campaigns: campaignList, adsets } = await fetchCampaignsAndAdsets(config.meta);
    for (const [level, list] of [["campaign", campaignList], ["adset", adsets]] as const) {
      for (const item of list) {
        const value = { level, name: String(item.name ?? "").slice(0, 200), data: item };
        await db.insert(metaObjects).values({ id: String(item.id), ...value }).onConflictDoUpdate({ target: metaObjects.id, set: value });
      }
    }
  } catch (error) {
    warning = warning ?? (error as Error).message;
    console.error("[ads] campagnes / ensembles", error);
  }

  return { rows: insights.length, ads: adsUpdated, spend: insights.reduce((sum, row) => sum + row.spend, 0), warning };
}
