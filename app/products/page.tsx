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
    <main className="container-shell py-14">
      <div className="max-w-2xl">
        <p className="font-bold uppercase tracking-[0.16em] text-gold-700">Boutique</p>
        <h1 className="mt-3 font-display text-5xl font-bold">Catalogue VITAL FORCE</h1>
        <p className="mt-4 text-forest-900/68">Orange, citron ou menthe. Chaque pot contient 400 g de notre mélange botanique.</p>
      </div>
      <form className="mt-8">
        <input name="q" defaultValue={query} placeholder="Rechercher un goût..." className="w-full rounded-full border border-forest-900/15 bg-white px-6 py-4 shadow-green md:max-w-xl" />
      </form>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {filtered.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
      {filtered.length === 0 && <p className="mt-10 rounded-3xl bg-white p-8 text-center font-semibold shadow-green">Aucun produit ne correspond à cette recherche.</p>}
    </main>
  );
}
