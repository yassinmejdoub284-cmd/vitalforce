import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ProductPurchase } from "@/components/commerce/product-purchase";
import { IngredientGrid } from "@/components/commerce/ingredient-grid";
import { UsageGuide } from "@/components/commerce/usage-guide";
import { ProductFaq } from "@/components/commerce/product-faq";
import { getProductBySlug, products } from "@/lib/product-data";
import { getStorefrontCatalog } from "@/lib/storefront-catalog";

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
  const { variants, checkoutAvailable } = await getStorefrontCatalog();
  const product = variants.find((item) => item.slug === slug);
  if (!product) notFound();

  return (
    <main>
      <ProductPurchase key={product.id} initialProduct={product} variants={variants} checkoutAvailable={checkoutAvailable} />
      <UsageGuide product={product} showPrecautions />
      <section className="container-shell border-t border-forest-900/10 py-12">
        <h2 className="font-display text-3xl">Étiquette {product.flavor.toLowerCase()}</h2>
        {product.flavor === "Citron" && <p className="mt-2 text-sm text-forest-900/65">Maquette illustrative du goût citron, à valider avec l’étiquette officielle avant toute impression.</p>}
        <Image src={product.image} alt={`Étiquette ${product.name}`} width={1200} height={400} className="mt-6 w-full border border-forest-900/10" />
      </section>
      <IngredientGrid />
      <ProductFaq />
    </main>
  );
}
