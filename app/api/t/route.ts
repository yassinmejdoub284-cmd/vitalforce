import { after, NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import { clientIp, locateIp } from "@/lib/geoip";
import { isBot, recordTracking, trackSchema } from "@/lib/tracking";

/** Mesure d'audience interne: visiteurs en temps réel, entonnoir et taux de conversion. */
export async function POST(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!hasDatabase() || isBot(userAgent)) return new NextResponse(null, { status: 204 });
  const text = await request.text().catch(() => "");
  if (text.length > 4000) return new NextResponse(null, { status: 413 });
  let body: unknown;
  try { body = JSON.parse(text); } catch { return new NextResponse(null, { status: 400 }); }
  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) return new NextResponse(null, { status: 400 });
  const ip = clientIp(request.headers);
  const headers = request.headers;
  after(async () => {
    try {
      // Ville/gouvernorat: base IP locale (DB-IP), sinon en-têtes Cloudflare/Vercel s'ils existent.
      const geo = await locateIp(ip);
      await recordTracking(parsed.data, {
        userAgent,
        country: geo?.country ?? headers.get("cf-ipcountry") ?? headers.get("x-vercel-ip-country"),
        city: geo?.city ?? headers.get("cf-ipcity") ?? headers.get("x-vercel-ip-city"),
        region: geo?.region ?? null,
        host: headers.get("host")
      });
    } catch (error) {
      console.error("[tracking]", error);
    }
  });
  return new NextResponse(null, { status: 204 });
}
