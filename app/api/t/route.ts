import { after, NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
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
  after(() => recordTracking(parsed.data, {
    userAgent,
    country: request.headers.get("x-vercel-ip-country"),
    city: request.headers.get("x-vercel-ip-city"),
    host: request.headers.get("host")
  }).catch((error) => console.error("[tracking]", error)));
  return new NextResponse(null, { status: 204 });
}
