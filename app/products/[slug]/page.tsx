import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ProductPurchase } from "@/components/commerce/product-purchase";
import { IngredientGrid } from "@/components/commerce/ingredient-grid";
import { UsageGuide } from "@/components/commerce/usage-guide";
import { ProductFaq } from "@/components/commerce/product-faq";
import { ProductViewTracker } from "@/components/commerce/product-view-tracker";
import { getCatalog, getCatalogProduct } from "@/lib/catalog";

export const revalidate = 600;

export async function generateStaticParams() {
  const { products } = await getCatalog();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { product } = await getCatalogProduct(slug);
  return { title: product?.name ?? "Produit", description: product?.shortDescription };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "pack-duo-vital-force-orange" || slug === "starter-vital-force-orange") redirect("/products/vital-force-400g-orange");
  const { product, products, live } = await getCatalogProduct(slug);
  if (!product) notFound();
  const variants = product.template === "vital-force" ? products.filter((item) => item.template === "vital-force") : [product];

  return (
    <main>
      <ProductViewTracker product={product} />
      <ProductPurchase key={product.id} initialProduct={product} variants={variants} checkoutAvailable={live} />
      {product.template === "vital-force" && <>
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
      </>}
    </main>
  );
}
