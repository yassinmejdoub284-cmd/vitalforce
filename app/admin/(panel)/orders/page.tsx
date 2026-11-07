import Link from "next/link";
import { inArray, sql } from "drizzle-orm";
import { Plus } from "lucide-react";
import { OrdersBoard, type BoardOrder } from "@/components/admin/orders-board";
import { PageHeader } from "@/components/admin/shell";
import { db } from "@/lib/db";
import { blacklist, orderStatuses } from "@/lib/db/schema";
import { ArchiveAllCancelled } from "@/components/admin/orders-board";
import { CONFIRMED_ALL, listOrders, statusCounts, type OrderFilters } from "@/lib/order-queries";
import { customerHistory } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { governorates } from "@/lib/tunisia";

export const metadata = { title: "Commandes" };

const tabs: [string, string][] = [["", "Toutes"], ["pending", "À confirmer"], ["no_answer", "Pas de réponse"], [CONFIRMED_ALL, "Confirmées"], ["confirmed", "À expédier"], ["shipped", "En livraison"], ["delivered", "Livrées"], ["returned", "Retours"], ["cancelled", "Annulées"]];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const archivedView = params.archived === "yes";
  const filters: OrderFilters = { status: params.status, q: params.q, from: params.from, to: params.to, governorate: params.governorate, paid: params.paid, returning: params.returning, archived: archivedView ? "yes" : undefined, page: Number(params.page) || 1 };
  const [{ orders, total, page, pages }, counts, config] = await Promise.all([listOrders(filters), statusCounts(filters), getSettings()]);
  const phones = orders.map((order) => order.phone);
  const ids = orders.map((order) => order.id);
  const [history, blocked, duplicates] = await Promise.all([
    customerHistory(phones),
    phones.length ? db.select({ phone: blacklist.phone }).from(blacklist).where(inArray(blacklist.phone, phones)) : Promise.resolve([]),
    ids.length && config.orders.duplicateHours > 0 ? db.execute(sql`
      select o.id from orders o where o.id in (${sql.join(ids.map((id) => sql`${id}`), sql`, `)}) and exists (
        select 1 from orders o2 where o2.phone = o.phone and o2.id <> o.id and o2.status <> 'cancelled'
        and abs(extract(epoch from (o2.created_at - o.created_at))) < ${config.orders.duplicateHours * 3600})`) : Promise.resolve({ rows: [] })
  ]);
  const blockedSet = new Set(blocked.map((row) => row.phone));
  const duplicateSet = new Set((duplicates.rows as { id: number }[]).map((row) => Number(row.id)));
  const all = orderStatuses.reduce((sum, status) => sum + counts[status], 0);

  const boardOrders: BoardOrder[] = orders.map((order) => ({
    id: order.id, number: order.number, status: order.status, customerName: order.customerName, phone: order.phone, governorate: order.governorate, city: order.city,
    total: order.total, createdAt: order.createdAt.toISOString(), items: order.items.map((item) => `${item.quantity}× ${item.name.replace(/^VITAL FORCE /, "")}`).join(", "),
    callAttempts: order.callAttempts, carrier: order.carrier, carrierBarcode: order.carrierBarcode, carrierState: order.carrierState, carrierPreState: order.carrierPreState, carrierPaid: order.carrierPaid, carrierError: order.carrierError,
    source: order.landingAngle ?? order.source, history: history.get(order.phone) ?? null, blacklisted: blockedSet.has(order.phone), duplicate: duplicateSet.has(order.id)
  }));

  const link = (next: Record<string, string | undefined>) => {
    const merged: Record<string, string | undefined> = { ...params, page: undefined, ...next };
    const search = new URLSearchParams(Object.entries(merged).filter((entry): entry is [string, string] => Boolean(entry[1])));
    const query = search.toString();
    return `/admin/orders${query ? `?${query}` : ""}`;
  };

  return <>
    <PageHeader title="Commandes" subtitle={`${total} commande(s) dans cette vue`} actions={<Link href="/admin/orders/new" className="adm-btn adm-btn-primary"><Plus size={16} />Nouvelle commande</Link>} />
    <nav className="adm-tabs" aria-label="Statuts">
      {tabs.map(([status, label]) => <Link key={status || "all"} href={link({ status: status || undefined, archived: undefined })} className="adm-tab" aria-current={!archivedView && (params.status ?? "") === status ? "page" : undefined}>
        {label}<b>{status ? counts[status as keyof typeof counts] : all}</b>
      </Link>)}
      <Link href={link({ status: undefined, archived: "yes" })} className="adm-tab" aria-current={archivedView ? "page" : undefined}>🗄 Archivées<b>{counts.archived}</b></Link>
    </nav>
    {params.status === CONFIRMED_ALL && !archivedView && <p className="adm-hint" style={{ marginBottom: 10 }}>Toutes les commandes confirmées par téléphone: à expédier, chez Jetpack, livrées et retournées.</p>}
    {archivedView && <p className="adm-alert adm-alert-info" style={{ marginBottom: 10 }}>Commandes archivées: masquées des autres onglets, mais toujours comptées dans les statistiques.</p>}
    {params.status === "cancelled" && !archivedView && counts.cancelled > 0 && <div style={{ marginBottom: 10 }}><ArchiveAllCancelled count={counts.cancelled} /></div>}
    <form className="adm-row" style={{ marginBottom: 12 }} action="/admin/orders">
      {params.status && <input type="hidden" name="status" value={params.status} />}
      {archivedView && <input type="hidden" name="archived" value="yes" />}
      <input className="adm-input" name="q" defaultValue={params.q} placeholder="Nom, téléphone, n° commande, code Jetpack…" style={{ flex: "1 1 240px", width: "auto" }} />
      <select className="adm-input" name="governorate" defaultValue={params.governorate ?? ""} style={{ width: "auto" }}>
        <option value="">Tous gouvernorats</option>
        {governorates.map((item) => <option key={item.value} value={item.value}>{item.value}</option>)}
      </select>
      <input className="adm-input" type="date" name="from" defaultValue={params.from} style={{ width: "auto" }} aria-label="Du" />
      <input className="adm-input" type="date" name="to" defaultValue={params.to} style={{ width: "auto" }} aria-label="Au" />
      <button className="adm-btn">Filtrer</button>
      {(params.q || params.governorate || params.from || params.to || params.paid || params.returning) && <Link href={link({ q: undefined, governorate: undefined, from: undefined, to: undefined, paid: undefined, returning: undefined })} className="adm-btn">Effacer</Link>}
    </form>
    {(params.status === "delivered" || params.status === "shipped") && <div className="adm-row" style={{ marginBottom: 12 }}>
      {params.status === "delivered" && <><Link className="adm-tab" aria-current={params.paid === "no" ? "page" : undefined} href={link({ paid: params.paid === "no" ? undefined : "no" })}>Pas encore payées par Jetpack</Link><Link className="adm-tab" aria-current={params.paid === "yes" ? "page" : undefined} href={link({ paid: params.paid === "yes" ? undefined : "yes" })}>Payées</Link></>}
      {params.status === "shipped" && <Link className="adm-tab" aria-current={params.returning === "yes" ? "page" : undefined} href={link({ returning: params.returning === "yes" ? undefined : "yes" })}>Retour en cours</Link>}
    </div>}
    <OrdersBoard orders={boardOrders} exportQuery={new URLSearchParams(Object.entries(params).filter(([key, value]) => value && key !== "page") as [string, string][]).toString()} jetpackReady={Boolean(config.jetpack.addToken)} trackReady={Boolean(config.jetpack.trackToken)} archivedView={archivedView} />
    {pages > 1 && <nav className="adm-pager">
      {page > 1 && <Link className="adm-btn" href={link({ page: String(page - 1) })}>← Précédent</Link>}
      <span className="adm-btn" aria-current="page">{page} / {pages}</span>
      {page < pages && <Link className="adm-btn" href={link({ page: String(page + 1) })}>Suivant →</Link>}
    </nav>}
  </>;
}
