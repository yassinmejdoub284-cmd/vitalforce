"use client";

import { useState } from "react";
import type { Product } from "@prisma/client";
import { Button } from "@/components/ui/button";

export function StockEditor({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function save(id: string, formData: FormData) {
    setSaving(id);setError("");
    const stock = Number(formData.get("stock"));
    const response = await fetch(`/api/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stock }) });
    const data = await response.json();
    setSaving(null);
    if (!response.ok) { setError(data.error ?? "Stock non enregistré."); return; }
    setProducts((items) => items.map((item) => item.id === id ? data.product : item));
  }

  return <div className="mt-8 divide-y divide-forest-900/10 border-y border-forest-900/10">
    {products.map((product) => <form key={product.id} action={(formData) => save(product.id, formData)} className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_120px_auto] sm:items-end">
      <div><strong>{product.name}</strong><p className="mt-1 text-xs text-forest-900/60">{product.sku} · {product.active ? "Actif" : "Archivé"}</p></div>
      <label className="grid gap-1 text-xs font-semibold">En stock<input name="stock" type="number" min="0" step="1" defaultValue={product.stock} required className="h-11 border border-forest-900/15 bg-white px-3 text-base" /></label>
      <Button disabled={saving === product.id}>{saving === product.id ? "Enregistrement" : "Sauver"}</Button>
    </form>)}
    {error && <p role="alert" className="py-3 text-sm font-semibold text-red-700">{error}</p>}
  </div>;
}
