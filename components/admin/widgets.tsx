import type { ReactNode } from "react";
import { count as fmtCount, money, percent } from "@/lib/format";

export function Kpi({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "good" | "bad" | "dark" }) {
  return <div className={`adm-kpi${tone ? ` is-${tone}` : ""}`}><small>{label}</small><strong>{value}</strong>{hint && <span>{hint}</span>}</div>;
}

export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = { pending: "Nouvelle", no_answer: "Pas de réponse", confirmed: "Confirmée", cancelled: "Annulée", shipped: "Chez Jetpack", delivered: "Livrée", returned: "Retournée" };
  return <span className={`adm-badge adm-badge-${status}`}>{labels[status] ?? status}</span>;
}

export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const max = Math.max(1, ...steps.map((step) => step.value));
  return <div className="adm-funnel">
    {steps.map((step, index) => {
      const previous = index > 0 ? steps[index - 1].value : null;
      return <div key={step.label} className="adm-funnel-row">
        <span>{step.label}</span>
        <div className="adm-funnel-bar"><i style={{ width: `${(step.value / max) * 100}%` }} /></div>
        <b>{fmtCount(step.value)}{previous ? <small className="adm-muted" style={{ display: "block", fontWeight: 600, fontSize: 11 }}>{percent(step.value / previous)}</small> : null}</b>
      </div>;
    })}
  </div>;
}

type Day = { day: string; orders: number; delivered: number; visitors: number; spend: number; revenue: number };

/** Graphique jour par jour: commandes (barres), livrées (barres foncées), visiteurs (ligne). */
export function DailyChart({ data }: { data: Day[] }) {
  const width = 720, height = 220, padX = 34, padY = 18, bottom = 26;
  const plotW = width - padX * 2, plotH = height - padY - bottom;
  const maxOrders = Math.max(1, ...data.map((d) => d.orders));
  const maxVisitors = Math.max(1, ...data.map((d) => d.visitors));
  const step = plotW / Math.max(1, data.length);
  const barW = Math.max(2, Math.min(22, step * 0.62));
  const x = (index: number) => padX + step * index + step / 2;
  const yOrders = (value: number) => padY + plotH - (value / maxOrders) * plotH;
  const yVisitors = (value: number) => padY + plotH - (value / maxVisitors) * plotH;
  const line = data.map((d, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${yVisitors(d.visitors).toFixed(1)}`).join(" ");
  const labelEvery = Math.ceil(data.length / 8);
  return <figure style={{ margin: 0 }}>
    <svg viewBox={`0 0 ${width} ${height}`} className="adm-chart" role="img" aria-label="Commandes, livraisons et visiteurs par jour">
      {[0, 0.5, 1].map((t) => <g key={t}>
        <line x1={padX} x2={width - padX} y1={padY + plotH * (1 - t)} y2={padY + plotH * (1 - t)} stroke="#ececE8" />
        <text x={padX - 6} y={padY + plotH * (1 - t) + 4} fontSize="10" textAnchor="end" fill="#888">{Math.round(maxOrders * t)}</text>
        <text x={width - padX + 6} y={padY + plotH * (1 - t) + 4} fontSize="10" fill="#c9a227">{Math.round(maxVisitors * t)}</text>
      </g>)}
      {data.map((d, index) => <g key={d.day}>
        <rect x={x(index) - barW / 2} y={yOrders(d.orders)} width={barW} height={Math.max(0, padY + plotH - yOrders(d.orders))} rx="3" fill="#cfcfca"><title>{`${d.day}: ${d.orders} commandes, ${d.delivered} livrées, ${d.visitors} visiteurs`}</title></rect>
        <rect x={x(index) - barW / 2} y={yOrders(d.delivered)} width={barW} height={Math.max(0, padY + plotH - yOrders(d.delivered))} rx="3" fill="#111" />
        {index % labelEvery === 0 && <text x={x(index)} y={height - 8} fontSize="10" textAnchor="middle" fill="#888">{d.day.slice(8, 10)}/{d.day.slice(5, 7)}</text>}
      </g>)}
      <path d={line} fill="none" stroke="#c9a227" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
    <figcaption className="adm-legend"><span><i style={{ background: "#cfcfca" }} />Commandes reçues</span><span><i style={{ background: "#111" }} />Livrées</span><span><i style={{ background: "#c9a227" }} />Visiteurs (axe droit)</span></figcaption>
  </figure>;
}

export function CostRows({ rows, total }: { rows: [string, number, string?][]; total: [string, number] }) {
  return <div>
    {rows.map(([label, value, hint]) => <div key={label} className="adm-cost-row"><span>{label}{hint && <small className="adm-muted"> · {hint}</small>}</span><span>{money(value)}</span></div>)}
    <div className="adm-cost-row is-total"><span>{total[0]}</span><span style={{ color: total[1] >= 0 ? "var(--adm-green)" : "var(--adm-red)" }}>{money(total[1])}</span></div>
  </div>;
}

export function SimpleTable({ head, rows, empty = "Aucune donnée sur la période." }: { head: string[]; rows: ReactNode[][]; empty?: string }) {
  if (rows.length === 0) return <p className="adm-empty">{empty}</p>;
  return <div className="adm-table-wrap"><table className="adm-table">
    <thead><tr>{head.map((cell, index) => <th key={cell} className={index > 0 ? "num" : undefined}>{cell}</th>)}</tr></thead>
    <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className={cellIndex > 0 ? "num" : undefined}>{cell}</td>)}</tr>)}</tbody>
  </table></div>;
}
