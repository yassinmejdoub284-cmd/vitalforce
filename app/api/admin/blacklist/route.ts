import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { adminRoute, jsonError, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { blacklist } from "@/lib/db/schema";
import { normalizeTunisianPhone } from "@/lib/tunisia";

export const POST = adminRoute(async (request) => {
  const { phone, reason } = await readJson(request);
  const normalized = normalizeTunisianPhone(String(phone ?? ""));
  if (!normalized) return jsonError("Numéro invalide.");
  await db.insert(blacklist).values({ phone: normalized, reason: String(reason ?? "").slice(0, 200) }).onConflictDoUpdate({ target: blacklist.phone, set: { reason: String(reason ?? "").slice(0, 200) } });
  return NextResponse.json({ ok: true });
});

export const DELETE = adminRoute(async (request) => {
  const phone = normalizeTunisianPhone(new URL(request.url).searchParams.get("phone") ?? "");
  if (!phone) return jsonError("Numéro invalide.");
  await db.delete(blacklist).where(eq(blacklist.phone, phone));
  return NextResponse.json({ ok: true });
});
