import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { adSpend } from "@/lib/db/schema";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
  amount: z.coerce.number().min(0, "Montant invalide.").max(1_000_000),
  campaign: z.string().trim().max(120).default("Total"),
  platform: z.enum(["meta", "tiktok", "google", "autre"]).default("meta")
});

/** Saisie manuelle des dépenses pub (si l'API Meta n'est pas connectée, ou pour TikTok/Google). */
export const POST = adminRoute(async (request) => {
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dépense invalide." }, { status: 400 });
  const value = parsed.data;
  await db.insert(adSpend).values({ ...value, campaign: value.campaign || "Total", source: "manual" })
    .onConflictDoUpdate({ target: [adSpend.date, adSpend.platform, adSpend.campaign], set: { amount: value.amount, source: "manual" } });
  return NextResponse.json({ ok: true });
});

export const DELETE = adminRoute(async (request) => {
  const id = Number(new URL(request.url).searchParams.get("id"));
  await db.delete(adSpend).where(and(eq(adSpend.id, id), eq(adSpend.source, "manual")));
  return NextResponse.json({ ok: true });
});
