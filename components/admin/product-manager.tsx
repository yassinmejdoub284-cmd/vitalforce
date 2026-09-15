"use client";

import { useState } from "react";
import type { Product as DbProduct } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { formatTnd, slugify } from "@/lib/utils";

export function ProductManager({ initialProducts }: { initialProducts: DbProduct[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [message, setMessage] = useState("");

  async function save(formData: FormData) {
    setMessage("");
    const name = String(formData.get("name") ?? "");
    const payload = {
      name,
      slug: slugify(String(formData.get("slug") || name)),
      subtitle: String(formData.get("subtitle") ?? ""),
      sku: String(formData.get("sku") ?? ""),
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock")),
      flavor: String(formData.get("flavor") ?? "Orange"),
      netWeight: String(formData.get("netWeight") ?? "400 g"),
      shortDescription: String(formData.get("shortDescription") ?? ""),
      image: "/images/vital-force-label.png"
    };
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Erreur produit");
      return;
    }
    setProducts((items) => [data.product, ...items]);
    setMessage("Produit ajouté.");
  }

  async function toggleActive(product: DbProduct) {
    setMessage("");
    const response = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !product.active })
    });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error ?? "État non modifié."); return; }
    setProducts((items) => items.map((item) => item.id === product.id ? data.product : item));
  }

  return (
    <div className="grid gap-8">
      <form action={save} className="rounded-[28px] bg-white p-6 shadow-green">
        <h2 className="text-2xl font-bold">Ajouter un produit</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            ["name", "Nom"],
            ["slug", "Slug"],
            ["subtitle", "Sous-titre"],
            ["sku", "SKU"],
            ["price", "Prix"],
            ["stock", "Stock"],
            ["flavor", "Goût"],
            ["netWeight", "Poids net"]
          ].map(([name, label]) => (
            <label key={name} className="grid gap-2 text-sm font-semibold">{label}<input name={name} type={name === "price" || name === "stock" ? "number" : "text"} step="0.001" required={name !== "slug"} className="rounded-2xl border border-forest-900/15 px-4 py-3" /></label>
          ))}
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">Description<textarea name="shortDescription" required className="min-h-24 rounded-2xl border border-forest-900/15 px-4 py-3" /></label>
        </div>
        <Button className="mt-5">Créer</Button>
        {message && <p className="mt-3 text-sm font-semibold text-forest-700">{message}</p>}
      </form>
      <div className="overflow-hidden rounded-[28px] bg-white shadow-green">
        <div className="grid grid-cols-[1.2fr_.6fr_.5fr_.5fr] gap-3 border-b border-forest-900/10 p-4 text-xs font-black uppercase tracking-[0.12em] text-forest-900/48">
          <span>Produit</span><span>Prix</span><span>Stock</span><span>État</span>
        </div>
        {products.map((product) => (
          <div key={product.id} className="grid grid-cols-[1.2fr_.6fr_.5fr_.5fr] items-center gap-3 border-b border-forest-900/8 p-4 text-sm">
            <div><p className="font-bold">{product.name}</p><p className="text-forest-900/55">{product.sku}</p></div>
            <span>{formatTnd(product.price)}</span>
            <span className="font-bold">{product.stock}</span>
            <button onClick={() => toggleActive(product)} className="text-left font-bold text-forest-700">{product.active ? "Archiver" : "Réactiver"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
