import "server-only";
import { asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, hasDatabase } from "@/lib/db";
import { products as productsTable, type ProductRow } from "@/lib/db/schema";
import { products as staticProducts, type Product } from "@/lib/product-data";

const vitalForceBase = staticProducts[0];

export function discountPercent(price: number, compareAtPrice?: number | null) {
  if (!compareAtPrice || compareAtPrice <= price) return undefined;
  return Math.round((1 - price / compareAtPrice) * 100);
}

export function toStorefrontProduct(row: ProductRow): Product {
  const rich = staticProducts.find((item) => item.slug === row.slug) ?? (row.template === "vital-force" ? vitalForceBase : undefined);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    price: row.price,
    compareAtPrice: row.compareAtPrice ?? undefined,
    discountPercent: discountPercent(row.price, row.compareAtPrice),
    sku: row.sku,
    stock: row.stock,
    netWeight: row.netWeight,
    flavor: row.flavor,
    image: row.image || rich?.image || "/images/v2/label.png",
    shortDescription: row.description || rich?.shortDescription || row.subtitle,
    highlights: rich?.highlights ?? [],
    usage: rich?.usage ?? [],
    warnings: rich?.warnings ?? [],
    conservation: rich?.conservation ?? "",
    ingredients: rich?.ingredients ?? [],
    template: rich ? "vital-force" : "simple"
  };
}

async function loadCatalog(): Promise<{ products: Product[]; live: boolean }> {
  if (!hasDatabase()) return { products: staticProducts, live: false };
  try {
    const rows = await db.select().from(productsTable).where(eq(productsTable.active, true)).orderBy(asc(productsTable.sortOrder), asc(productsTable.createdAt));
    return { products: rows.map(toStorefrontProduct), live: true };
  } catch (error) {
    console.error("[catalog] base indisponible, catalogue statique utilisé", error);
    return { products: staticProducts, live: false };
  }
}

/** Catalogue de la boutique: produits actifs de la base, invalidé à chaque modification dans l'admin. */
export const getCatalog = unstable_cache(loadCatalog, ["catalog-v1"], { tags: ["products"], revalidate: 600 });

export async function getCatalogProduct(slug: string) {
  const { products, live } = await getCatalog();
  return { product: products.find((item) => item.slug === slug), products, live };
}
