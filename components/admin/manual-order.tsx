"use client";

import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { api } from "./client-api";
import { money } from "@/lib/format";
import { deliveryFeeFor, type DeliveryPricing } from "@/lib/pricing";
import { governorates } from "@/lib/tunisia";

type Item = { id: string; name: string; price: number; stock: number };

export function ManualOrderForm({ products, delivery }: { products: Item[]; delivery: DeliveryPricing }) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>(() => (products[0] ? { [products[0].id]: 1 } : {}));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const subtotal = products.reduce((sum, product) => sum + product.price * (quantities[product.id] ?? 0), 0);
  const fee = deliveryFeeFor(subtotal, delivery);

  const change = (id: string, delta: number) => setQuantities((current) => ({ ...current, [id]: Math.max(0, Math.min(20, (current[id] ?? 0) + delta)) }));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const items = Object.entries(quantities).filter(([, quantity]) => quantity > 0).map(([productId, quantity]) => ({ productId, quantity }));
    if (items.length === 0) { setError("Ajoutez au moins un produit."); return; }
    setSaving(true);
    setError("");
    try {
      const data = Object.fromEntries(new FormData(event.currentTarget).entries());
      const { order } = await api<{ order: { id: number } }>("/api/admin/orders", { body: { ...data, items } });
      router.push(`/admin/orders/${order.id}`);
    } catch (failure) {
      setError((failure as Error).message);
      setSaving(false);
    }
  }

  return <form onSubmit={submit} className="adm-grid adm-grid-2">
    <section className="adm-card">
      <h2>Client</h2>
      <div className="adm-form-grid">
        <label className="adm-field adm-span-2">Nom et prénom<input className="adm-input" name="customerName" required minLength={3} /></label>
        <label className="adm-field">Téléphone<input className="adm-input" name="phone" inputMode="tel" required placeholder="XX XXX XXX" /></label>
        <label className="adm-field">Téléphone 2 <small className="adm-hint">(facultatif)</small><input className="adm-input" name="phone2" inputMode="tel" /></label>
        <label className="adm-field">Gouvernorat<select className="adm-input" name="governorate" required defaultValue=""><option value="" disabled>Choisir…</option>{governorates.map((item) => <option key={item.value}>{item.value}</option>)}</select></label>
        <label className="adm-field">Ville / délégation<input className="adm-input" name="city" required /></label>
        <label className="adm-field adm-span-2">Adresse complète<textarea className="adm-input" name="address" required minLength={8} /></label>
        <label className="adm-field">Email <small className="adm-hint">(facultatif)</small><input className="adm-input" name="email" type="email" /></label>
        <label className="adm-field">Note<input className="adm-input" name="note" /></label>
      </div>
    </section>
    <section className="adm-card">
      <h2>Produits</h2>
      {products.map((product) => <div key={product.id} className="adm-cost-row" style={{ alignItems: "center" }}>
        <span>{product.name}<small className="adm-muted" style={{ display: "block" }}>{money(product.price)} · stock {product.stock}</small></span>
        <span className="adm-row" style={{ flexWrap: "nowrap" }}>
          <button type="button" className="adm-btn adm-btn-sm" onClick={() => change(product.id, -1)} aria-label="Moins"><Minus size={14} /></button>
          <b style={{ minWidth: 22, textAlign: "center" }}>{quantities[product.id] ?? 0}</b>
          <button type="button" className="adm-btn adm-btn-sm" onClick={() => change(product.id, 1)} aria-label="Plus"><Plus size={14} /></button>
        </span>
      </div>)}
      <div className="adm-cost-row"><span>Livraison</span><span>{fee ? money(fee) : "Offerte"}</span></div>
      <div className="adm-cost-row is-total"><span>Total</span><span>{money(subtotal + fee)}</span></div>
      {error && <p className="adm-alert adm-alert-error" style={{ marginTop: 10 }}>{error}</p>}
      <button className="adm-btn adm-btn-primary" style={{ marginTop: 14, width: "100%" }} disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" />}Créer la commande</button>
    </section>
  </form>;
}
