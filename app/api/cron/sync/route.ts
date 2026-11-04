import { NextResponse } from "next/server";
import { syncAdInsights } from "@/lib/ads";
import { syncJetpackTracking } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { shiftDay, todayInTunis } from "@/lib/stats";

export const maxDuration = 60;

/** Tâche planifiée (Vercel Cron): suivi Jetpack + dépenses Meta Ads d'hier et d'aujourd'hui. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const config = await getSettings();
  const report: Record<string, unknown> = {};
  if (config.jetpack.trackToken) {
    try { report.jetpack = await syncJetpackTracking({ maxRequests: 25, actor: "cron" }); } catch (error) { report.jetpack = { error: (error as Error).message }; }
  }
  if (config.meta.adAccountId && config.meta.marketingToken) {
    const today = todayInTunis();
    try { report.ads = await syncAdInsights(shiftDay(today, -2), today); } catch (error) { report.ads = { error: (error as Error).message }; }
  }
  return NextResponse.json({ ok: true, ...report });
}
