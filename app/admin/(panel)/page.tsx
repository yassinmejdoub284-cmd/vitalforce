import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/shell";
import { RangePicker } from "@/components/admin/range-picker";
import { CostRows, DailyChart, Funnel, Kpi, SimpleTable } from "@/components/admin/widgets";
import { count, money, percent } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { getBreakdowns, getDailySeries, getDashboardStats, getLiveSummary, rangeFromPreset } from "@/lib/stats";

export const metadata = { title: "Tableau de bord" };

type Search = Promise<{ preset?: string; from?: string; to?: string }>;

export default async function DashboardPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const range = rangeFromPreset(params.preset, params.from, params.to);
  const [stats, series, breakdowns, live, config] = await Promise.all([getDashboardStats(range), getDailySeries(range), getBreakdowns(range), getLiveSummary(), getSettings()]);
  const { orders: o, costs, profit, rates, unitCosts, ads, traffic } = stats;
  const setupMissing = [!config.jetpack.addToken && "token Jetpack", !config.meta.pixelId && "pixel Meta", !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && "notifications push"].filter(Boolean);

  return <>
    <PageHeader title="Tableau de bord" subtitle={`Du ${range.from.split("-").reverse().join("/")} au ${range.to.split("-").reverse().join("/")} · heure de Tunis`} />
    <Suspense><RangePicker preset={range.preset} from={range.from} to={range.to} /></Suspense>

    {setupMissing.length > 0 && <p className="adm-alert adm-alert-warn" style={{ marginTop: 12 }}>À configurer: {setupMissing.join(", ")}. <Link href="/admin/settings" style={{ textDecoration: "underline" }}>Ouvrir les réglages</Link></p>}

    <h2 className="adm-section-title">En ce moment</h2>
    <div className="adm-kpis">
      <Link href="/admin/live" style={{ textDecoration: "none" }}><Kpi label="Visiteurs en ligne" value={<><span className="adm-dot" style={{ display: "inline-block", marginRight: 8 }} />{live.online}</>} hint={`${live.last30} ces 30 dernières minutes`} tone="dark" /></Link>
      <Kpi label="Visiteurs aujourd'hui" value={count(live.today_visitors)} />
      <Kpi label="Commandes aujourd'hui" value={count(live.today_orders)} />
      <Link href="/admin/orders?status=pending" style={{ textDecoration: "none" }}><Kpi label="À confirmer" value={count(live.pending)} hint="Appeler les clients →" tone={live.pending > 0 ? "bad" : undefined} /></Link>
    </div>

    <h2 className="adm-section-title">Commandes</h2>
    <div className="adm-kpis">
      <Kpi label="Reçues" value={count(o.received)} hint={`${count(o.pending + o.no_answer)} en attente d'appel`} />
      <Kpi label="Confirmées" value={count(o.confirmed)} hint={`Taux de confirmation ${percent(rates.confirmation)}`} tone={rates.confirmation !== null && rates.confirmation < 0.5 ? "bad" : undefined} />
      <Kpi label="Annulées" value={count(o.cancelled)} hint={percent(rates.cancellation)} />
      <Kpi label="À expédier" value={count(o.to_ship)} hint="Confirmées, pas encore chez Jetpack" />
      <Kpi label="En livraison" value={count(o.in_transit)} hint={money(o.transit_value)} />
      <Kpi label="Livrées" value={count(o.delivered)} hint={`Taux de livraison ${percent(rates.delivery)}`} tone="good" />
      <Kpi label="Retours" value={count(o.returned)} hint={`Taux de retour ${percent(rates.return)}`} tone={rates.return !== null && rates.return > 0.25 ? "bad" : undefined} />
      <Kpi label="Taux de conversion site" value={percent(rates.conversion)} hint={`${count(o.received)} commandes / ${count(traffic.visitors)} visiteurs`} />
    </div>

    <h2 className="adm-section-title">Argent</h2>
    <div className="adm-kpis">
      <Kpi label="Chiffre d'affaires livré" value={money(o.delivered_revenue)} hint={`${count(stats.unitsDelivered)} pots livrés`} />
      <Kpi label="Encaissé (payé par Jetpack)" value={money(o.collected)} tone="good" />
      <Kpi label="Livré, pas encore payé" value={money(o.awaiting_payment)} hint="À réclamer à Jetpack" />
      <Kpi label="Dépenses publicité" value={money(costs.ads)} hint={ads.api_rows ? "Meta Ads synchronisé" : <Link href="/admin/marketing">Saisir / synchroniser →</Link>} />
      <Kpi label="Profit net" value={money(profit.net)} hint={`Marge ${percent(profit.margin)}`} tone={profit.net >= 0 ? "good" : "bad"} />
      <Kpi label="Profit par commande livrée" value={money(profit.perDelivered)} tone={profit.perDelivered !== null && profit.perDelivered < 0 ? "bad" : undefined} />
      <Kpi label="Coût réel par commande livrée" value={money(unitCosts.costPerDelivered)} hint="Tous coûts, retours inclus" />
      <Kpi label="Coût pub par commande" value={money(unitCosts.cpl)} hint={`Par confirmée: ${money(unitCosts.cpaConfirmed)} · ROAS ${unitCosts.roas ? unitCosts.roas.toFixed(1) : "—"}`} />
    </div>

    <div className="adm-grid adm-grid-2 adm-section">
      <section className="adm-card">
        <div className="adm-card-head"><h2>D'où vient le profit</h2><Link href="/admin/marketing" className="adm-btn adm-btn-sm">Calculateur</Link></div>
        <CostRows
          rows={[
            ["Chiffre d'affaires livré", o.delivered_revenue, "livraison client incluse"],
            ["− Coût de production", -costs.cogs, "pots livrés"],
            ["− Emballage", -costs.packaging, "colis expédiés"],
            ["− Frais Jetpack livraisons", -costs.carrier],
            ["− Frais Jetpack retours", -costs.returns, `${o.returned} retour(s)`],
            ["− Confirmation téléphonique", -costs.confirmation],
            ...(costs.lostGoods ? [["− Marchandise perdue (retours)", -costs.lostGoods] as [string, number]] : []),
            ["− Publicité", -costs.ads],
            ...(costs.fixed ? [["− Charges fixes", -costs.fixed, `${stats.days} j`] as [string, number, string]] : [])
          ]}
          total={["Profit net", profit.net]}
        />
        <p className="adm-hint" style={{ marginTop: 10 }}>Les commandes encore en livraison ne sont pas comptées dans le chiffre d&apos;affaires tant qu&apos;elles ne sont pas livrées.</p>
      </section>
      <section className="adm-card">
        <h2>Entonnoir de conversion</h2>
        <Funnel steps={[
          { label: "Visiteurs", value: traffic.visitors },
          { label: "Ont vu le produit", value: traffic.view_content },
          { label: "Ont ouvert le formulaire", value: traffic.initiate_checkout },
          { label: "Commandes", value: o.received },
          { label: "Confirmées", value: o.confirmed },
          { label: "Livrées", value: o.delivered }
        ]} />
        {ads.impressions > 0 && <p className="adm-hint" style={{ marginTop: 12 }}>Meta: {count(ads.impressions)} impressions · CTR {percent(ads.ctr)} · conversion pixel {percent(ads.pixelConversion)} · coût par achat pixel {money(ads.pixelCpa)}</p>}
      </section>
    </div>

    <section className="adm-card adm-section">
      <h2>Jour par jour</h2>
      <DailyChart data={series} />
    </section>

    <div className="adm-grid adm-grid-2 adm-section">
      <section className="adm-card"><h2>Pages de vente</h2>
        <SimpleTable head={["Page", "Visiteurs", "Commandes", "Conversion", "Livrées"]} rows={breakdowns.angles.map((row) => [row.angle, count(row.visitors), count(row.orders), percent(row.visitors ? row.orders / row.visitors : null), count(row.delivered)])} />
      </section>
      <section className="adm-card"><h2>Sources de trafic</h2>
        <SimpleTable head={["Source", "Visiteurs", "Commandes"]} rows={breakdowns.sources.map((row) => [row.source, count(row.visitors), count(row.orders)])} />
      </section>
      <section className="adm-card"><h2>Gouvernorats</h2>
        <SimpleTable head={["Gouvernorat", "Visiteurs", "Commandes", "Livrées", "Retours"]} rows={breakdowns.governorates.map((row) => [row.governorate, row.visitors ? count(row.visitors) : "—", count(row.orders), count(row.delivered), count(row.returned)])} />
      </section>
      <section className="adm-card"><h2>Villes des visiteurs</h2>
        <SimpleTable head={["Ville", "Gouvernorat", "Visiteurs"]} rows={breakdowns.cities.map((row) => [row.city, row.region ?? "—", count(row.visitors)])} empty="Pas encore de localisation (base IP à installer sur le serveur)." />
        <p className="adm-hint" style={{ marginTop: 8 }}>Localisation par adresse IP (DB-IP): précise pour l&apos;ADSL/fibre, les connexions 4G apparaissent souvent à Tunis.</p>
      </section>
      <section className="adm-card"><h2>Produits</h2>
        <SimpleTable head={["Produit", "Commandés", "Livrés", "CA livré"]} rows={breakdowns.productsSold.map((row) => [row.name, count(row.ordered), count(row.delivered), money(row.revenue)])} />
      </section>
    </div>
  </>;
}
