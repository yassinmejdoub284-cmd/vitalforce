"use client";
/* eslint-disable @next/next/no-img-element -- aperçu admin d'une image importée */

import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "./client-api";
import { money, percent } from "@/lib/format";
import type { ProductRow } from "@/lib/db/schema";

type Costs = { deliveryFee: number; carrierCost: number; confirmationCost: number; returnCost: number };

export function ProductForm({ product, costs }: { product?: ProductRow; costs: Costs }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [image, setImage] = useState(product?.image ?? "");
  const [price, setPrice] = useState(product?.price ?? 0);
  const [cost, setCost] = useState(product?.costPrice ?? 0);
  const [packaging, setPackaging] = useState(product?.packagingCost ?? 0);
  const margin = price + costs.deliveryFee - cost - packaging - costs.carrierCost - costs.confirmationCost;

  async function upload(file: File) {
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const { url } = await api<{ url: string }>("/api/admin/media", { body });
      setImage(url);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const values = { ...Object.fromEntries(form.entries()), image, active: form.get("active") === "on" };
    try {
      if (product) await api(`/api/admin/products/${product.id}`, { method: "PATCH", body: values });
      else await api("/api/admin/products", { body: values });
      router.push("/admin/products");
      router.refresh();
    } catch (failure) {
      setError((failure as Error).message);
      setSaving(false);
    }
  }

  async function remove() {
    if (!product || !window.confirm("Supprimer ce produit ? S'il a déjà été commandé, il sera seulement masqué du site.")) return;
    const result = await api<{ archived: boolean }>(`/api/admin/products/${product.id}`, { method: "DELETE" });
    window.alert(result.archived ? "Produit masqué (il a des commandes)." : "Produit supprimé.");
    router.push("/admin/products");
    router.refresh();
  }

  return <form onSubmit={submit} className="adm-grid adm-grid-2">
    <section className="adm-card">
      <h2>Informations</h2>
      <div className="adm-form-grid">
        <label className="adm-field adm-span-2">Nom du produit<input className="adm-input" name="name" defaultValue={product?.name} required /></label>
        <label className="adm-field">Nom en arabe <small className="adm-hint">(facultatif)</small><input className="adm-input" name="nameAr" dir="rtl" defaultValue={product?.nameAr ?? ""} /></label>
        <label className="adm-field">Référence (SKU)<input className="adm-input" name="sku" defaultValue={product?.sku} required /></label>
        <label className="adm-field">Goût / variante<input className="adm-input" name="flavor" defaultValue={product?.flavor} placeholder="Orange, Citron…" /></label>
        <label className="adm-field">Poids / format<input className="adm-input" name="netWeight" defaultValue={product?.netWeight} placeholder="400 g" /></label>
        <label className="adm-field adm-span-2">Sous-titre<input className="adm-input" name="subtitle" defaultValue={product?.subtitle} /></label>
        <label className="adm-field adm-span-2">Description<textarea className="adm-input" name="description" defaultValue={product?.description} /></label>
        <label className="adm-field">Lien sur le site<input className="adm-input" name="slug" defaultValue={product?.slug} placeholder="auto depuis le nom" /></label>
        <label className="adm-field">Page produit<select className="adm-input" name="template" defaultValue={product?.template ?? "simple"}><option value="vital-force">Formule VITAL FORCE (ingrédients, mode d&apos;emploi)</option><option value="simple">Page simple</option></select></label>
        <label className="adm-field">Ordre d&apos;affichage<input className="adm-input" name="sortOrder" type="number" min={0} defaultValue={product?.sortOrder ?? 0} /></label>
        <label className="adm-toggle" style={{ alignSelf: "end" }}><input type="checkbox" name="active" defaultChecked={product?.active ?? true} /><span>Visible sur le site</span></label>
      </div>
      <h3 style={{ marginTop: 16 }}>Image</h3>
      <div className="adm-row">
        {image && <img src={image} alt="" className="adm-thumb" style={{ width: 84, height: 84 }} />}
        <label className="adm-btn">{uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}Importer une image
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} />
        </label>
        <input className="adm-input" value={image} onChange={(event) => setImage(event.target.value)} placeholder="ou lien https://…" style={{ flex: "1 1 200px", width: "auto" }} />
      </div>
    </section>

    <section className="adm-card">
      <h2>Prix, coûts et stock</h2>
      <div className="adm-form-grid">
        <label className="adm-field">Prix de vente (DT)<input className="adm-input" name="price" type="number" step="0.001" min={0} value={price || ""} onChange={(event) => setPrice(Number(event.target.value))} required /></label>
        <label className="adm-field">Prix barré <small className="adm-hint">(promo, facultatif)</small><input className="adm-input" name="compareAtPrice" type="number" step="0.001" min={0} defaultValue={product?.compareAtPrice ?? ""} /></label>
        <label className="adm-field">Coût de production / unité<input className="adm-input" name="costPrice" type="number" step="0.001" min={0} value={cost || ""} onChange={(event) => setCost(Number(event.target.value))} /></label>
        <label className="adm-field">Emballage / unité<input className="adm-input" name="packagingCost" type="number" step="0.001" min={0} value={packaging || ""} onChange={(event) => setPackaging(Number(event.target.value))} /></label>
        <label className="adm-field">Stock disponible<input className="adm-input" name="stock" type="number" min={0} defaultValue={product?.stock ?? 0} /></label>
        <label className="adm-field">Alerte stock bas à<input className="adm-input" name="lowStockThreshold" type="number" min={0} defaultValue={product?.lowStockThreshold ?? 20} /></label>
      </div>
      <div style={{ marginTop: 16 }}>
        <div className="adm-cost-row"><span>Prix + livraison payée par le client</span><span>{money(price + costs.deliveryFee)}</span></div>
        <div className="adm-cost-row"><span>− Production + emballage</span><span>{money(-(cost + packaging))}</span></div>
        <div className="adm-cost-row"><span>− Jetpack (livraison)</span><span>{money(-costs.carrierCost)}</span></div>
        <div className="adm-cost-row"><span>− Confirmation</span><span>{money(-costs.confirmationCost)}</span></div>
        <div className="adm-cost-row is-total"><span>Marge par pot livré (avant pub)</span><span style={{ color: margin > 0 ? "var(--adm-green)" : "var(--adm-red)" }}>{money(margin)} · {percent(price ? margin / price : null)}</span></div>
        <p className="adm-hint" style={{ marginTop: 8 }}>Chaque retour coûte environ {money(costs.returnCost + packaging + costs.confirmationCost)}. Le calculateur complet (pub + retours) est dans Marketing.</p>
      </div>
      {error && <p className="adm-alert adm-alert-error" style={{ marginTop: 12 }}>{error}</p>}
      <div className="adm-row" style={{ marginTop: 14 }}>
        <button className="adm-btn adm-btn-primary" disabled={saving || uploading}>{saving && <Loader2 size={16} className="animate-spin" />}{product ? "Enregistrer" : "Créer le produit"}</button>
        {product && <button type="button" className="adm-btn adm-btn-red" onClick={remove}><Trash2 size={16} />Supprimer</button>}
      </div>
    </section>
  </form>;
}

export function StockInput({ id, stock, low }: { id: string; stock: number; low: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(stock);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  async function save() {
    if (value === stock) return;
    setState("saving");
    try {
      await api(`/api/admin/products/${id}`, { method: "PATCH", body: { stock: value } });
      setState("saved");
      router.refresh();
    } catch {
      setState("error");
    }
  }
  return <div className="adm-row" style={{ flexWrap: "nowrap" }}>
    <input className="adm-input" type="number" min={0} value={value} onChange={(event) => setValue(Number(event.target.value))} onBlur={save} onKeyDown={(event) => event.key === "Enter" && save()} style={{ width: 90, borderColor: low ? "var(--adm-red)" : undefined }} aria-label="Stock" />
    {state === "saving" && <Loader2 size={14} className="animate-spin" />}
    {state === "saved" && <span className="adm-badge adm-badge-paid">OK</span>}
    {state === "error" && <span className="adm-badge adm-badge-danger">Erreur</span>}
    {low && state === "idle" && <span className="adm-badge adm-badge-danger">Bas</span>}
  </div>;
}
