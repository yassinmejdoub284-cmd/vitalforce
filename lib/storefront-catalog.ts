import { prisma } from "@/lib/prisma";
import { products, type Product } from "@/lib/product-data";

export async function getStorefrontCatalog(): Promise<{ variants: Product[]; checkoutAvailable: boolean }> {
  // The local SQLite file is not persistent or shared between Vercel functions.
  if (process.env.VERCEL) return { variants: products, checkoutAvailable: false };

  try {
    const records = await prisma.product.findMany({ where: { id: { in: products.map((product) => product.id) } } });
    const byId = new Map(records.map((record) => [record.id, record]));
    const variants = products.filter((product) => byId.get(product.id)?.active).map((product) => ({
      ...product,
      name: byId.get(product.id)!.name,
      price: byId.get(product.id)!.price,
      stock: byId.get(product.id)!.stock
    }));
    return { variants, checkoutAvailable: true };
  } catch {
    return { variants: products, checkoutAvailable: false };
  }
}
