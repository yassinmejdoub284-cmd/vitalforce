import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ProductPurchase } from "@/components/commerce/product-purchase";
import { IngredientGrid } from "@/components/commerce/ingredient-grid";
import { UsageGuide } from "@/components/commerce/usage-guide";
import { getProductBySlug, products } from "@/lib/product-data";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  return { title: product?.name ?? "Produit" };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "pack-duo-vital-force-orange" || slug === "starter-vital-force-orange") redirect("/products/vital-force-400g-orange");
  const currentProducts = await prisma.product.findMany({ where: { id: { in: products.map((item) => item.id) } } });
  const currentById = new Map(currentProducts.map((item) => [item.id, item]));
  const variants = products.filter((item) => currentById.get(item.id)?.active).map((item) => ({
    ...item,
    name: currentById.get(item.id)!.name,
    price: currentById.get(item.id)!.price,
    stock: currentById.get(item.id)!.stock
  }));
  const product = variants.find((item) => item.slug === slug);
  if (!product) notFound();

  return (
    <main>
      <ProductPurchase initialProduct={product} variants={variants} />
      <UsageGuide product={product} showPrecautions />
      {product.flavor === "Orange" && <section className="container-shell border-t border-forest-900/10 py-12">
        <h2 className="font-display text-3xl">Étiquette originale</h2>
        <Image src={product.image} alt={`Étiquette ${product.name}`} width={1200} height={400} className="mt-6 w-full border border-forest-900/10" />
      </section>}
      <IngredientGrid />
    </main>
  );
}
