import { ProductViewer } from "@/components/commerce/product-viewer";
import { getCatalog } from "@/lib/catalog";

export const metadata = { title: "Visualisation du pot" };

export default async function ViewerPage({ searchParams }: { searchParams?: Promise<{ slug?: string }> }) {
  const { slug } = (await searchParams) ?? {};
  const { products } = await getCatalog();
  const product = products.find((item) => item.slug === slug) ?? products[0];
  return <ProductViewer product={product} />;
}
