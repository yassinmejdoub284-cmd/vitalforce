import { adminRoute } from "@/lib/api";
import { buildAdsAnalysis } from "@/lib/ads-analysis";
import { rangeFromPreset } from "@/lib/stats";

/** Export JSON complet (campagnes → ensembles → pubs, créas, chiffres Meta et commandes réelles) pour une analyse externe. */
export const GET = adminRoute(async (request) => {
  const url = new URL(request.url);
  const range = rangeFromPreset(url.searchParams.get("preset") ?? "30d", url.searchParams.get("from") ?? undefined, url.searchParams.get("to") ?? undefined);
  const analysis = await buildAdsAnalysis(range);
  return new Response(JSON.stringify(analysis, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="analyse-meta-ads-vitalforce-${range.from}_${range.to}.json"`,
      "Cache-Control": "no-store"
    }
  });
});
