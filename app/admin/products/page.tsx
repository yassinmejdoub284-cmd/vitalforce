import { ProductManager } from "@/components/admin/product-manager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin produits" };

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <section>
      <h1 className="font-display text-5xl font-bold">Produits</h1>
      <p className="mt-3 text-forest-900/65">CRUD simple prêt pour sécurisation par authentification.</p>
      <div className="mt-8">
        <ProductManager initialProducts={products} />
      </div>
    </section>
  );
}
