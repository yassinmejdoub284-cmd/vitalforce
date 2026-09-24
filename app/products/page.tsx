import { ProductCard } from "@/components/commerce/product-card";
import { products } from "@/lib/product-data";

export const metadata = {
  title: "Catalogue"
};

export default async function ProductsPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const query = (await searchParams)?.q?.toLowerCase() ?? "";
  const filtered = products.filter((product) =>
    [product.name, product.subtitle, product.flavor, product.shortDescription].join(" ").toLowerCase().includes(query)
  );

  return (
    <main className="container-shell catalog-page">
      <div className="catalog-heading">
        <p className="shop-kicker">LA COLLECTION</p>
        <h1>Choisissez votre goût.</h1>
        <p>Une même formule botanique, trois saveurs et un format de 400 g.</p>
      </div>
      <form className="catalog-search">
        <label htmlFor="product-search">Rechercher dans la collection</label>
        <input id="product-search" name="q" defaultValue={query} placeholder="Orange, citron, menthe..." />
      </form>
      <div className="catalog-grid">
        {filtered.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
      {filtered.length === 0 && <p className="catalog-empty">Aucun produit ne correspond à cette recherche.</p>}
    </main>
  );
}
