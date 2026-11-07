import { asc, between, desc, eq } from "drizzle-orm";
import { Suspense } from "react";
import { AdsAnalysisView } from "@/components/admin/ads-analysis";
import { AdSpendManager, CopyText, ProfitCalculator } from "@/components/admin/marketing";
import { buildAdsAnalysis } from "@/lib/ads-analysis";
import { RangePicker } from "@/components/admin/range-picker";
import { PageHeader } from "@/components/admin/shell";
import { Kpi, SimpleTable } from "@/components/admin/widgets";
import { db } from "@/lib/db";
import { adSpend, products } from "@/lib/db/schema";
import { count, money, percent } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { getBreakdowns, getDashboardStats, getObservedRates, rangeFromPreset } from "@/lib/stats";

export const metadata = { title: "Marketing" };

export default async function MarketingPage({ searchParams }: { searchParams: Promise<{ preset?: string; from?: string; to?: string }> }) {
  const params = await searchParams;
  const range = rangeFromPreset(params.preset ?? "30d", params.from, params.to);
  const [stats, breakdowns, observed, config, spendRows, [mainProduct], analysis] = await Promise.all([
    getDashboardStats(range), getBreakdowns(range), getObservedRates(), getSettings(),
    db.select().from(adSpend).where(between(adSpend.date, range.from, range.to)).orderBy(desc(adSpend.date), asc(adSpend.campaign)),
    db.select().from(products).where(eq(products.active, true)).orderBy(asc(products.sortOrder)).limit(1),
    buildAdsAnalysis(range)
  ]);
  const exportQuery = new URLSearchParams({ preset: range.preset, from: range.from, to: range.to }).toString();
  const urlParams = "utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.name}}&campaign_id={{campaign.id}}&adset_id={{adset.id}}&ad_id={{ad.id}}";
  const { ads, orders: o, unitCosts, rates } = stats;
  const metaConnected = Boolean(config.meta.adAccountId && config.meta.marketingToken);
  const campaigns = Object.values(spendRows.reduce<Record<string, { campaign: string; spend: number; clicks: number; lpv: number; purchases: number }>>((acc, row) => {
    const item = acc[row.campaign] ?? { campaign: row.campaign, spend: 0, clicks: 0, lpv: 0, purchases: 0 };
    item.spend += row.amount; item.clicks += row.clicks ?? 0; item.lpv += row.landingPageViews ?? 0; item.purchases += row.pixelPurchases ?? 0;
    acc[row.campaign] = item;
    return acc;
  }, {})).sort((a, b) => b.spend - a.spend);

  return <>
    <PageHeader title="Marketing & rentabilité" subtitle="Meta Ads, pixel, coût réel par commande en tenant compte des retours" />
    <Suspense><RangePicker preset={range.preset} from={range.from} to={range.to} /></Suspense>

    <h2 className="adm-section-title">Selon Meta (pixel)</h2>
    <div className="adm-kpis">
      <Kpi label="Dépenses" value={money(ads.spend)} hint={metaConnected ? "Synchronisé avec Meta Ads" : "Saisie manuelle"} />
      <Kpi label="Impressions" value={count(ads.impressions)} hint={`CPM ${money(ads.cpm)}`} />
      <Kpi label="Clics" value={count(ads.clicks)} hint={`CTR ${percent(ads.ctr)}`} />
      <Kpi label="Vues de la page" value={count(ads.lpv)} />
      <Kpi label="Achats (pixel)" value={count(ads.pixel_purchases)} hint={`${count(ads.pixel_checkouts)} débuts de commande`} />
      <Kpi label="Taux de conversion pixel" value={percent(ads.pixelConversion)} hint="Achats / vues de page" />
      <Kpi label="Coût par achat (Meta)" value={money(ads.pixelCpa)} />
    </div>

    <h2 className="adm-section-title">La réalité (vos commandes)</h2>
    <div className="adm-kpis">
      <Kpi label="Commandes reçues" value={count(o.received)} hint={`Coût pub / commande ${money(unitCosts.cpl)}`} />
      <Kpi label="Confirmées" value={count(o.confirmed)} hint={`Coût pub / confirmée ${money(unitCosts.cpaConfirmed)}`} />
      <Kpi label="Livrées" value={count(o.delivered)} hint={`Coût pub / livrée ${money(o.delivered ? ads.spend / o.delivered : null)}`} />
      <Kpi label="Coût total par livrée" value={money(unitCosts.costPerDelivered)} hint="Pub + produit + Jetpack + retours + appels" />
      <Kpi label="ROAS réel" value={unitCosts.roas ? unitCosts.roas.toFixed(2) : "—"} hint="CA livré / pub" tone={unitCosts.roas !== null && unitCosts.roas < 2 ? "bad" : "good"} />
      <Kpi label="Profit net" value={money(stats.profit.net)} tone={stats.profit.net >= 0 ? "good" : "bad"} />
      <Kpi label="Écart Meta / réel" value={ads.pixel_purchases ? `${o.received - ads.pixel_purchases >= 0 ? "+" : ""}${o.received - ads.pixel_purchases}` : "—"} hint="Commandes réelles − achats pixel" />
    </div>

    <div className="adm-grid adm-grid-2 adm-section">
      <ProfitCalculator defaults={{
        price: mainProduct?.price ?? 163,
        cost: mainProduct?.costPrice ?? 0,
        packaging: mainProduct?.packagingCost ?? 0,
        deliveryFee: config.delivery.included ? 0 : config.delivery.fee,
        carrierCost: config.delivery.carrierCost,
        returnCost: config.delivery.returnCost,
        confirmationCost: config.costs.confirmationCost,
        confirmationRate: observed.confirmationRate ?? rates.confirmation ?? 0.7,
        deliveryRate: observed.deliveryRate ?? rates.delivery ?? 0.75,
        cpl: observed.cpl ?? unitCosts.cpl ?? 8,
        unitsPerOrder: stats.unitsDelivered && o.delivered ? stats.unitsDelivered / o.delivered : 1
      }} observed={observed.received >= 10} />
      <AdSpendManager rows={spendRows.map((row) => ({ id: row.id, date: row.date, campaign: row.campaign, platform: row.platform, amount: row.amount, source: row.source }))} metaConnected={metaConnected} />
    </div>

    <section className="adm-section">
      <div className="adm-spread" style={{ marginBottom: 10 }}>
        <h2 className="adm-section-title" style={{ margin: 0 }}>Analyse par campagne et par pub</h2>
        <a className="adm-btn adm-btn-primary" href={`/api/admin/marketing/export?${exportQuery}`}>⬇ Exporter l&apos;analyse (JSON)</a>
      </div>
      <p className="adm-hint" style={{ marginBottom: 10 }}>
        Cliquez sur une campagne pour voir chaque pub. Les campagnes « Engagement / Notoriété / Messages » (pour chauffer la page) sont jugées sur leurs propres chiffres, pas sur les ventes.
        L&apos;export JSON contient tout: noms et IDs, objectif, budget, ciblage, créas, toutes les actions Meta, chiffres jour par jour et commandes réelles. Envoyez-le à Claude pour une analyse.
      </p>
      <AdsAnalysisView analysis={analysis} />
      {analysis.unattributedMetaOrders.orders > 0 && <p className="adm-alert adm-alert-warn" style={{ marginTop: 10 }}>{analysis.unattributedMetaOrders.orders} commande(s) venues de Facebook/Instagram sans pub identifiée: ajoutez les paramètres d&apos;URL ci-dessous à vos pubs.</p>}
      <div className="adm-card" style={{ marginTop: 10 }}>
        <h3>Paramètres d&apos;URL à coller dans chaque pub (Meta → Pub → Suivi → Paramètres d&apos;URL)</h3>
        <CopyText text={urlParams} />
        <p className="adm-hint" style={{ marginTop: 6 }}>Ainsi chaque commande est reliée à sa campagne, son ensemble et sa pub exacte.</p>
      </div>
    </section>

    <section className="adm-card adm-section">
      <h2>Campagnes (dépenses par jour)</h2>
      <SimpleTable head={["Campagne", "Dépense", "Clics", "Vues page", "Achats pixel", "Coût / achat"]}
        rows={campaigns.map((row) => [row.campaign, money(row.spend), count(row.clicks), count(row.lpv), count(row.purchases), money(row.purchases ? row.spend / row.purchases : null)])}
        empty="Aucune dépense sur la période. Synchronisez Meta Ads ou saisissez vos dépenses." />
    </section>

    <section className="adm-card adm-section">
      <h2>Pages de vente</h2>
      <SimpleTable head={["Page", "Visiteurs", "Commandes", "Conversion", "Livrées"]} rows={breakdowns.angles.map((row) => [row.angle, count(row.visitors), count(row.orders), percent(row.visitors ? row.orders / row.visitors : null), count(row.delivered)])} />
    </section>
  </>;
}
