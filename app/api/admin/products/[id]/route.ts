import { count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { adminRoute, isUniqueViolation, jsonError, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { orderItems, products } from "@/lib/db/schema";
import { productInputSchema } from "@/lib/product-admin";
import { refreshStorefront } from "@/lib/settings";

type Context = { params: Promise<{ id: string }> };

export const PATCH = adminRoute<Context>(async (request, { params }) => {
  const { id } = await params;
  const body = await readJson(request);
  const [current] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!current) return jsonError("Produit introuvable.", 404);
  // Mise à jour partielle (ex: stock seul) en complétant avec les valeurs actuelles.
  const parsed = productInputSchema.safeParse({ ...current, compareAtPrice: current.compareAtPrice ?? "", ...body });
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Produit invalide.");
  try {
    const [product] = await db.update(products).set(parsed.data).where(eq(products.id, id)).returning();
    refreshStorefront("products");
    return NextResponse.json({ product });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("Ce lien (slug) ou cette référence SKU existe déjà.", 409);
    throw error;
  }
});

export const DELETE = adminRoute<Context>(async (_request, { params }) => {
  const { id } = await params;
  const [{ used }] = await db.select({ used: count() }).from(orderItems).where(eq(orderItems.productId, id));
  // Un produit déjà commandé est archivé (masqué de la boutique) pour garder l'historique.
  if (used > 0) await db.update(products).set({ active: false }).where(eq(products.id, id));
  else await db.delete(products).where(eq(products.id, id));
  refreshStorefront("products");
  return NextResponse.json({ ok: true, archived: used > 0 });
});
