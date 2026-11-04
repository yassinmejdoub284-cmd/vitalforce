"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Download, Loader2, PhoneCall, PhoneOff, RefreshCw, Send, Truck, X } from "lucide-react";
import { useMemo, useState } from "react";
import { api, shortDate } from "./client-api";
import { StatusBadge } from "./widgets";
import { money } from "@/lib/format";
import { formatTunisianPhone } from "@/lib/tunisia";

export type BoardOrder = {
  id: number; number: string; status: string; customerName: string; phone: string; governorate: string; city: string; total: number; createdAt: string; items: string;
  callAttempts: number; carrierBarcode: string | null; carrierState: string | null; carrierPreState: string | null; carrierPaid: boolean; carrierError: string | null;
  source: string; history: { total: number; delivered: number; returned: number; cancelled: number } | null; blacklisted: boolean; duplicate: boolean;
};

type Result = { ok: number; failed: { id: number; error?: string; number?: string }[] };

export function CustomerFlags({ order }: { order: Pick<BoardOrder, "history" | "blacklisted" | "duplicate"> }) {
  const history = order.history;
  return <span className="adm-row" style={{ gap: 4, marginTop: 4 }}>
    {order.blacklisted && <span className="adm-badge adm-badge-danger">Liste noire</span>}
    {order.duplicate && <span className="adm-badge adm-badge-no_answer">Doublon ?</span>}
    {history && history.total > 1 && <span className={`adm-badge ${history.returned > 0 ? "adm-badge-danger" : "adm-badge-muted"}`} title="Historique de ce numéro">
      {history.total} cmd · {history.delivered} livrée(s){history.returned ? ` · ${history.returned} retour(s)` : ""}
    </span>}
  </span>;
}

function CarrierLine({ order }: { order: BoardOrder }) {
  if (order.carrierError && !order.carrierBarcode) return <small style={{ color: "var(--adm-red)", display: "block" }}>⚠ {order.carrierError}</small>;
  if (!order.carrierBarcode) return null;
  return <small className="adm-muted" style={{ display: "block" }}>
    <span className="adm-mono">{order.carrierBarcode}</span> · {order.carrierState || "—"}
    {order.carrierPreState && order.carrierPreState !== order.carrierState && ` (livreur: ${order.carrierPreState})`}
    {order.carrierPaid && <span className="adm-badge adm-badge-paid" style={{ marginLeft: 6 }}>Payée</span>}
  </small>;
}

export function OrdersBoard({ orders, exportQuery, jetpackReady, trackReady }: { orders: BoardOrder[]; exportQuery: string; jetpackReady: boolean; trackReady: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState<{ tone: "ok" | "error" | "info"; text: string } | null>(null);
  const selectedOrders = useMemo(() => orders.filter((order) => selected.has(order.id)), [orders, selected]);
  const confirmedSelected = selectedOrders.filter((order) => order.status === "confirmed" && !order.carrierBarcode);

  const toggle = (id: number) => setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const allSelected = orders.length > 0 && orders.every((order) => selected.has(order.id));

  async function run(label: string, action: () => Promise<Result | { checked: number; changed: number }>) {
    setBusy(label);
    setNotice(null);
    try {
      const result = await action();
      if ("checked" in result) setNotice({ tone: "ok", text: `${result.checked} colis vérifié(s) chez Jetpack, ${result.changed} mis à jour.` });
      else if (result.failed.length) setNotice({ tone: "error", text: `${result.ok} réussie(s). Échec: ${result.failed.map((item) => `${item.number ?? `#${item.id}`} (${item.error})`).join(" · ")}` });
      else setNotice({ tone: "ok", text: `${result.ok} commande(s) mise(s) à jour.` });
      setSelected(new Set());
      router.refresh();
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy("");
    }
  }

  const setStatus = (ids: number[], status: string, reason?: string) => run(status, () => api<Result>("/api/admin/orders/status", { body: { ids, status, reason } }));
  const cancel = (ids: number[]) => {
    const reason = window.prompt("Raison de l'annulation (facultatif)", "Client a annulé");
    if (reason === null) return;
    return setStatus(ids, "cancelled", reason || undefined);
  };
  const ship = (ids: number[]) => {
    if (!jetpackReady) { setNotice({ tone: "error", text: "Ajoutez d'abord le token d'ajout Jetpack dans Réglages → Jetpack." }); return; }
    if (!window.confirm(`Envoyer ${ids.length} commande(s) à Jetpack ? Les colis seront créés chez Jetpack.`)) return;
    return run("jetpack", () => api<Result>("/api/admin/orders/jetpack", { body: { ids } }));
  };

  const quickActions = (order: BoardOrder) => {
    if (order.status === "pending" || order.status === "no_answer") return <>
      <a className="adm-btn adm-btn-sm" href={`tel:+216${order.phone}`}><PhoneCall size={14} />Appeler</a>
      <button type="button" className="adm-btn adm-btn-sm adm-btn-green" disabled={!!busy} onClick={() => setStatus([order.id], "confirmed")}><Check size={14} />Confirmer</button>
      <button type="button" className="adm-btn adm-btn-sm" disabled={!!busy} onClick={() => setStatus([order.id], "no_answer")} title="Pas de réponse"><PhoneOff size={14} />{order.callAttempts > 0 ? `×${order.callAttempts}` : ""}</button>
      <button type="button" className="adm-btn adm-btn-sm adm-btn-red" disabled={!!busy} onClick={() => cancel([order.id])} aria-label="Annuler"><X size={14} /></button>
    </>;
    if (order.status === "confirmed" && !order.carrierBarcode) return <button type="button" className="adm-btn adm-btn-sm adm-btn-gold" disabled={!!busy} onClick={() => ship([order.id])}><Truck size={14} />Jetpack</button>;
    return null;
  };

  return <>
    <div className="adm-row" style={{ marginBottom: 10 }}>
      <label className="adm-row" style={{ gap: 6, fontSize: 13, fontWeight: 700 }}>
        <input type="checkbox" className="adm-check" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(orders.map((order) => order.id)))} />Tout sélectionner
      </label>
      <span style={{ flex: 1 }} />
      {trackReady && <button type="button" className="adm-btn adm-btn-sm" disabled={!!busy} onClick={() => run("sync", () => api("/api/admin/orders/sync", { body: {} }) as Promise<{ checked: number; changed: number }>)}>
        {busy === "sync" ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}Suivi Jetpack
      </button>}
      <a className="adm-btn adm-btn-sm" href={`/api/admin/orders/export${exportQuery ? `?${exportQuery}` : ""}`}><Download size={14} />Excel (CSV)</a>
    </div>
    {notice && <p className={`adm-alert adm-alert-${notice.tone}`} style={{ marginBottom: 10 }}>{notice.text}</p>}

    {orders.length === 0 ? <div className="adm-card adm-empty">Aucune commande ici.</div> : <>
      <div className="adm-table-wrap adm-orders-table">
        <table className="adm-table">
          <thead><tr><th style={{ width: 36 }} /><th>Commande</th><th>Client</th><th>Livraison</th><th>Articles</th><th className="num">Total</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>{orders.map((order) => <tr key={order.id} className={selected.has(order.id) ? "is-selected" : undefined}>
            <td><input type="checkbox" className="adm-check" checked={selected.has(order.id)} onChange={() => toggle(order.id)} aria-label={`Sélectionner ${order.number}`} /></td>
            <td><Link href={`/admin/orders/${order.id}`} className="adm-row-link">{order.number}</Link><small className="adm-muted" style={{ display: "block" }}>{shortDate(order.createdAt)} · {order.source}</small></td>
            <td><strong>{order.customerName}</strong><a href={`tel:+216${order.phone}`} className="adm-mono" style={{ display: "block", textDecoration: "none" }}>{formatTunisianPhone(order.phone)}</a><CustomerFlags order={order} /></td>
            <td>{order.governorate}<small className="adm-muted" style={{ display: "block" }}>{order.city}</small><CarrierLine order={order} /></td>
            <td style={{ maxWidth: 220 }}>{order.items}</td>
            <td className="num"><strong>{money(order.total)}</strong></td>
            <td><StatusBadge status={order.status} /></td>
            <td><div className="adm-row" style={{ gap: 5, flexWrap: "nowrap" }}>{quickActions(order)}</div></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="adm-order-cards">
        {orders.map((order) => <article key={order.id} className={`adm-order-card${selected.has(order.id) ? " is-selected" : ""}`}>
          <input type="checkbox" className="adm-check" checked={selected.has(order.id)} onChange={() => toggle(order.id)} aria-label={`Sélectionner ${order.number}`} />
          <div>
            <div className="adm-order-card-top"><Link href={`/admin/orders/${order.id}`}>{order.number} · {order.customerName}</Link><strong>{money(order.total)}</strong></div>
            <p>{order.governorate} · {order.city} · {shortDate(order.createdAt)}</p>
            <p>{order.items}</p>
            <div className="adm-row" style={{ gap: 5, marginTop: 6 }}><StatusBadge status={order.status} /><CustomerFlags order={order} /></div>
            <CarrierLine order={order} />
            <div className="adm-order-card-actions">{quickActions(order)}</div>
          </div>
        </article>)}
      </div>
    </>}

    {selected.size > 0 && <div className="adm-bulkbar">
      <strong>{selected.size} sélectionnée(s)</strong>
      {busy && <Loader2 size={16} className="animate-spin" />}
      <button type="button" className="adm-btn adm-btn-sm adm-btn-green" disabled={!!busy} onClick={() => setStatus([...selected], "confirmed")}><Check size={14} />Confirmer</button>
      <button type="button" className="adm-btn adm-btn-sm" disabled={!!busy} onClick={() => setStatus([...selected], "no_answer")}><PhoneOff size={14} />Pas de réponse</button>
      <button type="button" className="adm-btn adm-btn-sm adm-btn-red" disabled={!!busy} onClick={() => cancel([...selected])}><X size={14} />Annuler</button>
      <button type="button" className="adm-btn adm-btn-sm adm-btn-gold" disabled={!!busy || confirmedSelected.length === 0} onClick={() => ship(confirmedSelected.map((order) => order.id))}>
        <Send size={14} />Envoyer à Jetpack ({confirmedSelected.length})
      </button>
      <button type="button" className="adm-btn adm-btn-sm" onClick={() => setSelected(new Set())}>Fermer</button>
    </div>}
  </>;
}
