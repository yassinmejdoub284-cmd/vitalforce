import "server-only";
import { and, between, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { adSpend } from "@/lib/db/schema";
import { fetchAdInsights } from "@/lib/meta-server";
import { getSettings } from "@/lib/settings";

/** Importe les dépenses Meta Ads par jour/campagne et remplace les lignes déjà importées de la période. */
export async function syncAdInsights(since: string, until: string) {
  const config = await getSettings();
  const insights = await fetchAdInsights(config.meta, since, until);
  await db.transaction(async (tx) => {
    await tx.delete(adSpend).where(and(eq(adSpend.source, "meta-api"), between(adSpend.date, since, until)));
    if (insights.length) {
      await tx.insert(adSpend).values(insights.map((row) => ({
        date: row.date,
        platform: "meta",
        campaign: row.campaign.slice(0, 120),
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
