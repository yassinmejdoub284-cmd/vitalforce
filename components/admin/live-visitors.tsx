"use client";

import { useEffect, useState } from "react";
import { api } from "./client-api";
import { Kpi } from "./widgets";

type Visitor = { id: string; current_path: string | null; source: string | null; device: string | null; city: string | null; country: string | null; page_views: number; first_seen: string; last_seen: string };
type Live = { summary: { online: number; last30: number; today_visitors: number; today_orders: number; pending: number }; visitors: Visitor[] };

const pageName = (path: string | null) => {
  if (!path) return "—";
  if (path === "/") return "Accueil";
  if (path.startsWith("/lp/")) return `Page ${path.slice(4)}`;
  if (path.startsWith("/products/")) return `Produit ${path.slice(10).replace("vital-force-400g-", "")}`;
  return path;
};

const since = (iso: string) => {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min`;
};

export function LiveVisitors() {
  const [data, setData] = useState<Live | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = () => document.visibilityState === "visible" && api<Live>("/api/admin/live?visitors=1").then((value) => { if (active) { setData(value); setError(""); } }).catch((failure) => setError((failure as Error).message));
    load();
    const timer = window.setInterval(load, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  if (!data) return <p className="adm-empty">{error || "Chargement…"}</p>;
  const pages = Object.entries(data.visitors.reduce<Record<string, number>>((acc, visitor) => { const key = pageName(visitor.current_path); acc[key] = (acc[key] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]);
  const sources = Object.entries(data.visitors.reduce<Record<string, number>>((acc, visitor) => { const key = visitor.source ?? "direct"; acc[key] = (acc[key] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]);

  return <>
    <div className="adm-kpis">
      <Kpi label="En ligne maintenant" value={<><span className="adm-dot" style={{ display: "inline-block", marginRight: 8 }} />{data.summary.online}</>} tone="dark" />
      <Kpi label="30 dernières minutes" value={data.summary.last30} />
      <Kpi label="Visiteurs aujourd'hui" value={data.summary.today_visitors} />
      <Kpi label="Commandes aujourd'hui" value={data.summary.today_orders} hint={data.summary.today_visitors ? `Conversion ${((data.summary.today_orders / data.summary.today_visitors) * 100).toFixed(1)} %` : undefined} />
    </div>
    <div className="adm-grid adm-grid-2 adm-section">
      <section className="adm-card"><h2>Pages consultées maintenant</h2>{pages.length ? pages.map(([page, value]) => <div key={page} className="adm-cost-row"><span>{page}</span><b>{value}</b></div>) : <p className="adm-empty">Personne en ce moment.</p>}</section>
      <section className="adm-card"><h2>Sources</h2>{sources.length ? sources.map(([source, value]) => <div key={source} className="adm-cost-row"><span>{source}</span><b>{value}</b></div>) : <p className="adm-empty">—</p>}</section>
    </div>
    <section className="adm-card adm-section">
      <h2>Visiteurs actifs</h2>
      {data.visitors.length === 0 ? <p className="adm-empty">Aucun visiteur actif.</p> : <div className="adm-table-wrap"><table className="adm-table">
        <thead><tr><th>Page actuelle</th><th>Source</th><th>Appareil</th><th>Ville</th><th className="num">Pages vues</th><th className="num">Sur le site depuis</th></tr></thead>
        <tbody>{data.visitors.map((visitor) => <tr key={visitor.id}>
          <td><strong>{pageName(visitor.current_path)}</strong></td><td>{visitor.source ?? "direct"}</td><td>{visitor.device ?? "—"}</td>
          <td>{[visitor.city, visitor.country].filter(Boolean).join(", ") || "—"}</td><td className="num">{visitor.page_views}</td><td className="num">{since(visitor.first_seen)}</td>
        </tr>)}</tbody>
      </table></div>}
    </section>
  </>;
}
