import { prisma } from "@/lib/prisma";
import { StockEditor } from "@/components/admin/stock-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin stock" };

export default async function InventoryPage() {
  const products = await prisma.product.findMany({ orderBy: { stock: "asc" } });
  return (
    <section>
      <h1 className="font-display text-5xl font-bold">Stock</h1>
      <StockEditor initialProducts={products} />
    </section>
  );
}
