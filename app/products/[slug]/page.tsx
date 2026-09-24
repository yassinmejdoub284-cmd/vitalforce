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
      <IngredientGrid />
      <UsageGuide product={product} showPrecautions />
      <section className="container-shell label-section">
        <details className="label-disclosure">
          <summary><span><small>COMPOSITION ET PRÉCAUTIONS</small><strong>Consulter l’étiquette complète · {product.flavor}</strong></span><b aria-hidden="true">+</b></summary>
          <p>Consultez l’étiquette complète du goût {product.flavor.toLowerCase()} pour la composition, le mode d’utilisation et les précautions d’emploi.</p>
          <Image src={product.image} alt={`Étiquette ${product.name}`} width={1200} height={400} className="label-full-image" />
        </details>
      </section>
      <ProductFaq />
    </main>
  );
}
