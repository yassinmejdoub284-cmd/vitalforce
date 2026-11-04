import Link from "next/link";
import { Fragment } from "react";
import { asc, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { OrderActions, OrderEditor } from "@/components/admin/order-detail";
import { CustomerFlags } from "@/components/admin/orders-board";
import { PageHeader } from "@/components/admin/shell";
import { StatusBadge } from "@/components/admin/widgets";
import { db } from "@/lib/db";
import { blacklist, orderEvents, orderItems, orders } from "@/lib/db/schema";
import { money, shortDate } from "@/lib/format";
import { allowedTargets, customerHistory, recentDuplicates } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { formatTunisianPhone } from "@/lib/tunisia";

export const metadata = { title: "Commande" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) notFound();
  const config = await getSettings();
  const [items, events, history, duplicates, blocked, previous] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    db.select().from(orderEvents).where(eq(orderEvents.orderId, id)).orderBy(asc(orderEvents.createdAt)),
    customerHistory([order.phone]),
    recentDuplicates(order, config.orders.duplicateHours),
    db.select().from(blacklist).where(eq(blacklist.phone, order.phone)).limit(1),
    db.select({ id: orders.id, number: orders.number, status: orders.status, total: orders.total, createdAt: orders.createdAt }).from(orders).where(eq(orders.phone, order.phone)).orderBy(desc(orders.createdAt)).limit(10)
  ]);
  const productCost = items.reduce((sum, item) => sum + (item.unitCost + item.packagingCost) * item.quantity, 0);
  const margin = order.total - productCost - order.carrierCost - order.confirmationCost;
  const utm = order.utm ? Object.entries(order.utm) : [];

  return <>
    <PageHeader title={`Commande ${order.number}`} subtitle={`Reçue le ${shortDate(order.createdAt)} · ${order.landingAngle ? `page ${order.landingAngle}` : order.source}`} actions={<Link href="/admin/orders" className="adm-btn">← Commandes</Link>} />
    <div className="adm-row" style={{ marginBottom: 12 }}>
      <StatusBadge status={order.status} />
      <CustomerFlags order={{ history: history.get(order.phone) ?? null, blacklisted: blocked.length > 0, duplicate: duplicates.length > 0 }} />
      {order.callAttempts > 0 && <span className="adm-badge adm-badge-no_answer">{order.callAttempts} appel(s) sans réponse</span>}
    </div>

    <OrderActions order={{ id: order.id, number: order.number, status: order.status, phone: order.phone, customerName: order.customerName, total: order.total, carrierBarcode: order.carrierBarcode, blacklisted: blocked.length > 0 }} targets={allowedTargets(order.status)} jetpackReady={Boolean(config.jetpack.addToken)} />

    <div className="adm-grid adm-grid-2 adm-section">
      <section className="adm-card">
        <h2>Client et livraison</h2>
        <dl className="adm-dl">
          <dt>Nom</dt><dd>{order.customerName}</dd>
          <dt>Téléphone</dt><dd><a href={`tel:+216${order.phone}`}>{formatTunisianPhone(order.phone)}</a> · <a href={`https://wa.me/216${order.phone}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></dd>
          {order.phone2 && <><dt>Téléphone 2</dt><dd>{formatTunisianPhone(order.phone2)}</dd></>}
          {order.email && <><dt>Email</dt><dd>{order.email}</dd></>}
          <dt>Gouvernorat</dt><dd>{order.governorate}</dd>
          <dt>Ville</dt><dd>{order.city}</dd>
          <dt>Adresse</dt><dd>{order.address}</dd>
          {order.note && <><dt>Note client</dt><dd>{order.note}</dd></>}
        </dl>
        <OrderEditor order={{ id: order.id, customerName: order.customerName, phone: order.phone, phone2: order.phone2 ?? "", email: order.email ?? "", governorate: order.governorate, city: order.city, address: order.address, note: order.note ?? "", internalNote: order.internalNote ?? "" }} locked={Boolean(order.carrierBarcode)} />
      </section>

      <section className="adm-card">
        <h2>Articles</h2>
        {items.map((item) => <div key={item.id} className="adm-cost-row"><span>{item.quantity} × {item.name}</span><span>{money(item.unitPrice * item.quantity)}</span></div>)}
        <div className="adm-cost-row"><span>Livraison payée par le client</span><span>{order.deliveryFee ? money(order.deliveryFee) : "Offerte"}</span></div>
        <div className="adm-cost-row is-total"><span>À encaisser</span><span>{money(order.total)}</span></div>
        <p className="adm-hint" style={{ marginTop: 10 }}>Marge estimée si livrée: <strong>{money(margin)}</strong> (production + emballage {money(productCost)}, Jetpack {money(order.carrierCost)}, confirmation {money(order.confirmationCost)}, hors publicité). Si retour: −{money(order.returnCost + order.confirmationCost + items.reduce((sum, item) => sum + item.packagingCost * item.quantity, 0))}.</p>

        <h2 style={{ marginTop: 18 }}>Jetpack</h2>
        {order.carrierBarcode ? <dl className="adm-dl">
          <dt>Code à barre</dt><dd className="adm-mono">{order.carrierBarcode}</dd>
          <dt>État officiel</dt><dd>{order.carrierState || "—"}{order.carrierReason && ` · ${order.carrierReason}`}</dd>
          <dt>Livreur (temps réel)</dt><dd>{order.carrierPreState || "—"}{order.carrierPreReason && ` · ${order.carrierPreReason}`}</dd>
          <dt>Paiement</dt><dd>{order.carrierPaid ? <span className="adm-badge adm-badge-paid">Payée par Jetpack{order.carrierPaidAt ? ` le ${shortDate(order.carrierPaidAt)}` : ""}</span> : "Non payée"}</dd>
          <dt>Dernier suivi</dt><dd>{order.carrierSyncedAt ? shortDate(order.carrierSyncedAt) : "—"}</dd>
        </dl> : <p className="adm-muted" style={{ fontSize: 14 }}>{order.carrierError ? <span style={{ color: "var(--adm-red)" }}>⚠ {order.carrierError}</span> : "Pas encore envoyée. Confirmez la commande puis envoyez-la à Jetpack."}</p>}
      </section>

      <section className="adm-card">
        <h2>Historique</h2>
        <ol className="adm-timeline">{events.map((event) => <li key={event.id}><time>{shortDate(event.createdAt)} · {event.actor}</time>{event.message}</li>)}</ol>
      </section>

      <section className="adm-card">
        <h2>Ce client</h2>
        {previous.length > 1 ? previous.map((item) => <div key={item.id} className="adm-cost-row"><Link href={`/admin/orders/${item.id}`}>{item.number}{item.id === order.id ? " (celle-ci)" : ""}</Link><span className="adm-row" style={{ gap: 6 }}><StatusBadge status={item.status} />{money(item.total)}</span></div>) : <p className="adm-muted" style={{ fontSize: 14 }}>Première commande de ce numéro.</p>}
        {utm.length > 0 && <><h3 style={{ marginTop: 14 }}>Campagne</h3><dl className="adm-dl">{utm.map(([key, value]) => <Fragment key={key}><dt>{key}</dt><dd>{value}</dd></Fragment>)}</dl></>}
      </section>
    </div>
  </>;
}
