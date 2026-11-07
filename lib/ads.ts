import "server-only";
import { and, between, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { adSpend } from "@/lib/db/schema";
import { fetchAdInsights } from "@/lib/meta-server";
import { getSettings } from "@/lib/settings";

/** Importe les dépenses Meta Ads par jour/campagne et remplace les lignes déjà importées de la période. */
export async function syncAdInsights(since: string, until: string) {
  const config = await getSettings();
  const raw = await fetchAdInsights(config.meta, since, until);
  // Deux campagnes peuvent porter le même nom le même jour: on les additionne (sinon conflit à l'insertion).
  const merged = new Map<string, (typeof raw)[number]>();
  for (const row of raw) {
    const campaign = row.campaign.trim().slice(0, 120) || "Sans nom";
    const key = `${row.date}|${campaign}`;
    const current = merged.get(key);
    merged.set(key, current ? {
      ...current,
      spend: current.spend + row.spend,
      impressions: current.impressions + row.impressions,
      clicks: current.clicks + row.clicks,
      landingPageViews: current.landingPageViews + row.landingPageViews,
      purchases: current.purchases + row.purchases,
      checkouts: current.checkouts + row.checkouts
    } : { ...row, campaign });
  }
  const insights = [...merged.values()];
  await db.transaction(async (tx) => {
    await tx.delete(adSpend).where(and(eq(adSpend.source, "meta-api"), between(adSpend.date, since, until)));
    if (insights.length) {
      await tx.insert(adSpend).values(insights.map((row) => ({
        date: row.date,
        platform: "meta",
        campaign: row.campaign,
        amount: row.spend,
        impressions: row.impressions,
        clicks: row.clicks,
        landingPageViews: row.landingPageViews,
        pixelPurchases: Math.round(row.purchases),
        pixelCheckouts: Math.round(row.checkouts),
        source: "meta-api"
      }))).onConflictDoUpdate({
        target: [adSpend.date, adSpend.platform, adSpend.campaign],
        set: { amount: sql`excluded.amount`, impressions: sql`excluded.impressions`, clicks: sql`excluded.clicks`, landingPageViews: sql`excluded.landing_page_views`, pixelPurchases: sql`excluded.pixel_purchases`, pixelCheckouts: sql`excluded.pixel_checkouts`, source: "meta-api" }
      });
    }
  });
  return { rows: insights.length, spend: insights.reduce((sum, row) => sum + row.spend, 0) };
}
