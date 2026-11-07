/* eslint-disable @next/next/no-img-element -- miniatures des pubs servies par le CDN Meta */
import type { AdsAnalysis } from "@/lib/ads-analysis";
import { count, money, percent } from "@/lib/format";

type Campaign = AdsAnalysis["campaigns"][number];
type Metrics = Campaign["metrics"];
type Derived = Campaign["derived"];
type RealCounts = Campaign["real"];

const kindLabel: Record<string, string> = { ventes: "Ventes", engagement: "Engagement", "notoriété": "Notoriété", trafic: "Trafic", messages: "Messages", prospects: "Prospects", inconnu: "—" };

function Flags({ flags }: { flags: { level: string; label: string }[] }) {
  if (!flags.length) return null;
  return <span className="adm-row" style={{ gap: 4 }}>{flags.map((flag) => <span key={flag.label} className={`adm-badge ${flag.level === "good" ? "adm-badge-paid" : flag.level === "bad" ? "adm-badge-danger" : "adm-badge-no_answer"}`}>{flag.label}</span>)}</span>;
}

/** Colonnes communes: chiffres Meta + commandes réelles, adaptées au type de campagne. */
function cells(metrics: Metrics, derived: Derived, real: RealCounts, kind: string, reach?: number | null) {
  const sales = kind === "ventes" || kind === "inconnu";
  return [
    money(metrics.spend),
    count(metrics.impressions),
    count(reach ?? metrics.reach),
    money(derived.cpm),
    percent(derived.ctrLink),
    sales ? `${count(metrics.landingPageViews)} vues · ${count(metrics.initiateCheckout)} début` : `${count(metrics.postEngagement)} eng. · ${money(derived.costPerEngagement)}`,
    sales ? `${count(metrics.purchases)} · ${money(derived.pixelCpa)}` : `${count(metrics.messages)} msg · ${count(metrics.pageLikes)} j'aime`,
    `${count(real.orders)} · ${money(derived.realCostPerOrder)}`,
    `${count(real.delivered)} · ${money(derived.realCostPerDelivered)}`,
    derived.realRoas ?? "—",
    metrics.videoPlays3s > 0 ? `${percent(derived.hookRate)} / ${percent(derived.holdRate)}` : "—"
  ];
}

const head = ["Dépense", "Impr.", "Portée", "CPM", "CTR lien", "Page / Engagement", "Achats pixel / Messages", "Commandes · coût", "Livrées · coût", "ROAS réel", "Hook / Hold"];

export function AdsAnalysisView({ analysis }: { analysis: AdsAnalysis }) {
  if (analysis.campaigns.length === 0) return <p className="adm-empty">Aucune donnée par pub sur la période. Cliquez sur « Synchroniser Meta Ads » (les statistiques par pub sont importées à partir de maintenant).</p>;
  return <div className="adm-grid" style={{ gap: 10 }}>
    {analysis.campaigns.map((campaign) => {
      const ads = campaign.adsets.flatMap((adset) => adset.ads.map((ad) => ({ ...ad, adsetName: adset.name, optimizationGoal: adset.optimizationGoal })));
      return <details key={campaign.id} className="adm-card" style={{ padding: 0 }}>
        <summary style={{ cursor: "pointer", padding: 14, listStyle: "none" }}>
          <div className="adm-spread">
            <strong>{campaign.name}</strong>
            <span className="adm-row" style={{ gap: 6 }}>
              <span className="adm-badge adm-badge-muted">{kindLabel[campaign.kind] ?? campaign.kind}</span>
              {campaign.details?.effective_status ? <span className="adm-badge adm-badge-muted">{String(campaign.details.effective_status)}</span> : null}
              <span className="adm-badge">{money(campaign.metrics.spend)}</span>
            </span>
          </div>
          <p className="adm-hint" style={{ margin: "6px 0" }}>
            {count(campaign.metrics.impressions)} impressions · CPM {money(campaign.derived.cpm)} · CTR lien {percent(campaign.derived.ctrLink)} ·{" "}
            {campaign.kind === "ventes" || campaign.kind === "inconnu"
              ? <>{count(campaign.real.orders)} commandes réelles ({money(campaign.derived.realCostPerOrder)} / commande) · {count(campaign.real.delivered)} livrées · ROAS réel {campaign.derived.realRoas ?? "—"}</>
              : <>{count(campaign.metrics.postEngagement)} engagements ({money(campaign.derived.costPerEngagement)}) · {count(campaign.metrics.messages)} messages · {count(campaign.metrics.pageLikes)} j&apos;aime page</>}
            {" "}· {ads.length} pub(s)
          </p>
          <Flags flags={campaign.flags} />
        </summary>
        <div className="adm-table-wrap" style={{ borderRadius: 0, borderLeft: 0, borderRight: 0, borderBottom: 0 }}>
          <table className="adm-table" style={{ fontSize: 13 }}>
            <thead><tr><th>Pub</th>{head.map((label) => <th key={label} className="num">{label}</th>)}</tr></thead>
            <tbody>{ads.map((ad) => <tr key={ad.id}>
              <td style={{ minWidth: 260 }}>
                <div className="adm-row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
                  {ad.creative?.thumbnailUrl ? <img src={ad.creative.thumbnailUrl} alt="" className="adm-thumb" referrerPolicy="no-referrer" /> : null}
                  <span>
                    <strong>{ad.name}</strong>
                    <small className="adm-muted" style={{ display: "block" }}>{ad.adsetName}{ad.optimizationGoal ? ` · ${ad.optimizationGoal}` : ""}{ad.status ? ` · ${ad.status}` : ""}</small>
                    {ad.creative?.title ? <small style={{ display: "block" }}>« {ad.creative.title.slice(0, 80)} »</small> : null}
                    {ad.rankings ? <small className="adm-muted" style={{ display: "block" }}>Qualité {ad.rankings.quality} · Engagement {ad.rankings.engagement} · Conversion {ad.rankings.conversion}</small> : null}
                    <Flags flags={ad.flags} />
                  </span>
                </div>
              </td>
              {cells(ad.metrics, ad.derived, ad.real, campaign.kind, ad.periodReach).map((value, index) => <td key={index} className="num">{value}</td>)}
            </tr>)}</tbody>
          </table>
        </div>
      </details>;
    })}
  </div>;
}
