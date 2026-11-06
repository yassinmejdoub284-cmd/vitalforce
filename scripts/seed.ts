import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../lib/db/schema";
import { products } from "../lib/product-data";

// Charge .env (VPS) ou .env.local (poste de dev) si présents.
for (const file of [".env", ".env.local"]) {
  try { process.loadEnvFile(file); } catch { /* fichier absent */ }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquante.");
  const local = /localhost|127\.0\.0\.1/.test(url);
  const pool = new Pool({ connectionString: url, max: 1, ssl: local ? undefined : { rejectUnauthorized: false } });
  const db = drizzle(pool, { schema });

  for (const [index, product] of products.entries()) {
    await db.insert(schema.products).values({
      id: product.id,
      slug: product.slug,
      name: product.name,
      subtitle: product.subtitle,
      description: product.shortDescription,
      sku: product.sku,
      flavor: product.flavor,
      netWeight: product.netWeight,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      stock: product.stock,
      image: product.image,
      template: "vital-force",
      sortOrder: index
    }).onConflictDoNothing();
  }
  await pool.end();
  console.log(`[seed] ${products.length} produits prêts (les produits existants ne sont pas modifiés).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
