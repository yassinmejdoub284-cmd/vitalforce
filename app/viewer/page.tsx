import { ProductViewer } from "@/components/commerce/product-viewer";
import { getProductBySlug, products } from "@/lib/product-data";

export const metadata = { title: "Visualisation du pot" };

export default async function ViewerPage({ searchParams }: { searchParams?: Promise<{ slug?: string }> }) {
  const { slug } = (await searchParams) ?? {};
  const product = (slug && getProductBySlug(slug)) || products[0];
  return <ProductViewer product={product} />;
}
