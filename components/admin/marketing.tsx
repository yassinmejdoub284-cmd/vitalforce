"use client";

import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "./client-api";
import { money, percent } from "@/lib/format";
import { todayLocal } from "./dates";

type Defaults = { price: number; cost: number; packaging: number; deliveryFee: number; carrierCost: number; returnCost: number; confirmationCost: number; confirmationRate: number; deliveryRate: number; cpl: number; unitsPerOrder: number };

/**
 * Rentabilité par commande en tenant compte des annulations et des retours.
 * Pour 100 commandes reçues: on paie la pub et l'appel sur toutes, l'emballage et Jetpack sur les confirmées,
 * le produit seulement sur les livrées (les retours reviennent en stock), et les frais de retour sur les retours.
 */
export function ProfitCalculator({ defaults, observed }: { defaults: Defaults; observed: boolean }) {
  const [v, setV] = useState({ ...defaults, confirmationRate: Math.round(defaults.confirmationRate * 100), deliveryRate: Math.round(defaults.deliveryRate * 100), unitsPerOrder: Math.round(defaults.unitsPerOrder * 10) / 10 });
  const set = (key: keyof typeof v) => (event: React.ChangeEvent<HTMLInputElement>) => setV((current) => ({ ...current, [key]: Number(event.target.value) }));

  const leads = 100;
  const confirmed = leads * (v.confirmationRate / 100);
  const delivered = confirmed * (v.deliveryRate / 100);
  const returned = confirmed - delivered;
  const units = v.unitsPerOrder || 1;
  const revenue = delivered * (v.price * units + v.deliveryFee);
  const costs = {
    ads: leads * v.cpl,
    calls: leads * v.confirmationCost,
    product: delivered * v.cost * units,
    packaging: confirmed * v.packaging * units,
    carrier: delivered * v.carrierCost,
    returns: returned * v.returnCost
  };
  const totalCost = Object.values(costs).reduce((sum, value) => sum + value, 0);
  const profit = revenue - totalCost;
  const perDelivered = delivered ? profit / delivered : 0;
  const costPerDelivered = delivered ? totalCost / delivered : 0;
  const breakEvenCpl = (revenue - (totalCost - costs.ads)) / leads;

  const field = (key: keyof typeof v, label: string, step = "0.001", suffix?: string) => <label className="adm-field">{label}{suffix && <small className="adm-hint"> ({suffix})</small>}<input className="adm-input" type="number" step={step} min={0} value={v[key]} onChange={set(key)} /></label>;

  return <section className="adm-card">
    <h2>Calculateur: combien me coûte vraiment une commande ?</h2>
    <p className="adm-hint" style={{ marginBottom: 12 }}>{observed ? "Pré-rempli avec vos taux réels des 90 derniers jours." : "Pré-rempli avec des valeurs types: ajustez-les."} Modifiez une valeur pour simuler.</p>
    <div className="adm-form-grid">
      {field("price", "Prix d'un pot", "0.001", "DT")}
      {field("unitsPerOrder", "Pots par commande", "0.1")}
      {field("cost", "Coût de production / pot")}
      {field("packaging", "Emballage / pot")}
      {field("deliveryFee", "Livraison payée par le client")}
      {field("carrierCost", "Jetpack / colis livré")}
      {field("returnCost", "Jetpack / colis retourné")}
      {field("confirmationCost", "Coût d'appel / commande")}
      {field("cpl", "Coût pub par commande reçue", "0.1", "DT")}
      {field("confirmationRate", "Taux de confirmation", "1", "%")}
      {field("deliveryRate", "Taux de livraison", "1", "%")}
    </div>
    <div style={{ marginTop: 16 }}>
      <p className="adm-hint" style={{ marginBottom: 6 }}>Sur 100 commandes reçues → {confirmed.toFixed(0)} confirmées → {delivered.toFixed(0)} livrées, {returned.toFixed(0)} retours</p>
      <div className="adm-cost-row"><span>Chiffre d&apos;affaires encaissé</span><span>{money(revenue)}</span></div>
      <div className="adm-cost-row"><span>− Publicité (100 commandes)</span><span>{money(-costs.ads)}</span></div>
      <div className="adm-cost-row"><span>− Appels de confirmation</span><span>{money(-costs.calls)}</span></div>
      <div className="adm-cost-row"><span>− Produit (pots livrés)</span><span>{money(-costs.product)}</span></div>
      <div className="adm-cost-row"><span>− Emballage (colis expédiés)</span><span>{money(-costs.packaging)}</span></div>
      <div className="adm-cost-row"><span>− Jetpack livraisons</span><span>{money(-costs.carrier)}</span></div>
      <div className="adm-cost-row"><span>− Jetpack retours</span><span>{money(-costs.returns)}</span></div>
      <div className="adm-cost-row is-total"><span>Profit pour 100 commandes</span><span style={{ color: profit >= 0 ? "var(--adm-green)" : "var(--adm-red)" }}>{money(profit)}</span></div>
    </div>
    <div className="adm-kpis" style={{ marginTop: 12 }}>
      <div className={`adm-kpi ${perDelivered >= 0 ? "is-good" : "is-bad"}`}><small>Profit par commande livrée</small><strong>{money(perDelivered)}</strong></div>
      <div className="adm-kpi"><small>Coût réel par livrée</small><strong>{money(costPerDelivered)}</strong><span>retours et annulations inclus</span></div>
      <div className="adm-kpi is-dark"><small>Coût pub max rentable</small><strong>{money(breakEvenCpl)}</strong><span>par commande reçue (seuil 0 profit)</span></div>
      <div className="adm-kpi"><small>Marge nette</small><strong>{percent(revenue ? profit / revenue : null)}</strong></div>
    </div>
  </section>;
}

type SpendRow = { id: number; date: string; campaign: string; platform: string; amount: number; source: string };

export function AdSpendManager({ rows, metaConnected }: { rows: SpendRow[]; metaConnected: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function run(key: string, action: () => Promise<unknown>, success: (result: never) => string) {
    setBusy(key);
    setMessage(null);
    try {
      const result = await action();
      setMessage({ tone: "ok", text: success(result as never) });
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy("");
    }
  }

  return <section className="adm-card">
    <div className="adm-card-head"><h2>Dépenses publicitaires</h2>
      {metaConnected && <button type="button" className="adm-btn adm-btn-sm adm-btn-gold" disabled={!!busy} onClick={() => run("sync", () => api("/api/admin/ads/sync", { body: { days: 30 } }), (result: { rows: number; spend: number }) => `Meta Ads: ${result.rows} ligne(s) importée(s), ${money(result.spend)} sur 30 jours.`)}>
        {busy === "sync" ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}Synchroniser Meta Ads
      </button>}
    </div>
    {!metaConnected && <p className="adm-alert adm-alert-info" style={{ marginBottom: 12 }}>Connectez votre compte publicitaire (Réglages → Meta) pour importer les dépenses automatiquement chaque jour. En attendant, saisissez-les ici.</p>}
    <form className="adm-form-grid" onSubmit={(event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = Object.fromEntries(new FormData(form).entries());
      run("add", () => api("/api/admin/ads", { body: data }), () => { form.reset(); return "Dépense enregistrée."; });
    }}>
      <label className="adm-field">Date<input className="adm-input" type="date" name="date" defaultValue={todayLocal()} required /></label>
      <label className="adm-field">Montant (DT)<input className="adm-input" type="number" step="0.001" min={0} name="amount" required /></label>
      <label className="adm-field">Plateforme<select className="adm-input" name="platform" defaultValue="meta"><option value="meta">Meta (Facebook/Instagram)</option><option value="tiktok">TikTok</option><option value="google">Google</option><option value="autre">Autre</option></select></label>
      <label className="adm-field">Campagne<input className="adm-input" name="campaign" placeholder="Total" /></label>
      <button className="adm-btn adm-btn-primary adm-span-2" disabled={!!busy}>{busy === "add" && <Loader2 size={16} className="animate-spin" />}Ajouter la dépense</button>
    </form>
    {message && <p className={`adm-alert adm-alert-${message.tone}`} style={{ marginTop: 10 }}>{message.text}</p>}
    <div style={{ marginTop: 14, maxHeight: 320, overflow: "auto" }}>
      {rows.length === 0 ? <p className="adm-empty">Aucune dépense sur la période.</p> : rows.map((row) => <div key={row.id} className="adm-cost-row">
        <span>{row.date.split("-").reverse().join("/")} · {row.campaign}<small className="adm-muted"> · {row.platform}{row.source === "meta-api" ? " (API)" : ""}</small></span>
        <span className="adm-row" style={{ gap: 6, flexWrap: "nowrap" }}>{money(row.amount)}{row.source === "manual" && <button type="button" className="adm-btn adm-btn-sm" aria-label="Supprimer" onClick={() => window.confirm("Supprimer cette dépense ?") && run(`del-${row.id}`, () => api(`/api/admin/ads?id=${row.id}`, { method: "DELETE" }), () => "Supprimée.")}><Trash2 size={13} /></button>}</span>
      </div>)}
    </div>
  </section>;
}
