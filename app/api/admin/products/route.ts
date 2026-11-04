import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { adminRoute, isUniqueViolation, jsonError, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { productInputSchema } from "@/lib/product-admin";
import { refreshStorefront } from "@/lib/settings";

export const GET = adminRoute(async () => NextResponse.json({ products: await db.select().from(products).orderBy(asc(products.sortOrder)) }));

export const POST = adminRoute(async (request) => {
  const parsed = productInputSchema.safeParse(await readJson(request));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Produit invalide.");
  try {
    const [product] = await db.insert(products).values({ id: `p-${crypto.randomUUID().slice(0, 8)}`, ...parsed.data }).returning();
    refreshStorefront("products");
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("Ce lien (slug) ou cette référence SKU existe déjà.", 409);
    throw error;
  }
});
