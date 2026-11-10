import { asc, inArray } from "drizzle-orm";
import { Fragment } from "react";
import { PrintToolbar } from "@/components/admin/print-toolbar";
import { requireAdminPage } from "@/lib/auth";
import { code128Svg } from "@/lib/code128";
import { db } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";
import { getSettings } from "@/lib/settings";
import { todayInTunis } from "@/lib/stats";
import { formatTunisianPhone } from "@/lib/tunisia";
import "./print.css";

export const metadata = { title: "Bons de livraison" };
export const dynamic = "force-dynamic";

const dt = (value: number) => `${new Intl.NumberFormat("fr-TN", { numberingSystem: "latn", minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(value)} DT`;

/** Feuille de route + bons de livraison (format Jetpack) pour les colis livrés par vous-même. */
export default async function PrintPage({ searchParams }: { searchParams: Promise<{ ids?: string; mode?: string }> }) {
  await requireAdminPage();
  const { ids: rawIds, mode = "both" } = await searchParams;
  const ids = [...new Set((rawIds ?? "").split(",").map(Number).filter((id) => Number.isInteger(id) && id > 0))].slice(0, 300);
  const [config, list] = await Promise.all([getSettings(), ids.length ? db.select().from(orders).where(inArray(orders.id, ids)).orderBy(asc(orders.governorate), asc(orders.city), asc(orders.id)) : Promise.resolve([])]);
  const items = list.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, list.map((order) => order.id))) : [];
  const itemsByOrder = new Map<number, typeof items>();
  for (const item of items) itemsByOrder.set(item.orderId, [...(itemsByOrder.get(item.orderId) ?? []), item]);
  const today = todayInTunis();
  const store = config.store;
  const sender = store.senderName || store.siteName;
  const totalToCollect = list.reduce((sum, order) => sum + order.total, 0);
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const designation = config.jetpack.designation || "Complément alimentaire VITAL FORCE";
  const showSheet = mode !== "labels";
  const showLabels = mode !== "sheet";

  if (list.length === 0) return <div className="print-root"><PrintToolbar ids={ids} count={0} mode={mode} /><p className="print-empty">Aucune commande sélectionnée. Retournez dans Commandes, cochez les colis puis « Imprimer ».</p></div>;

  return <div className="print-root">
    <PrintToolbar ids={ids} count={list.length} mode={mode} />

    {showSheet && <section className="sheet">
      <header className="sheet-head">
        <div><h1>Feuille de route · Livraison</h1><p>{sender} · {store.address}{store.phone ? ` · ${store.phone}` : ""}</p></div>
        <div className="sheet-meta"><p>Date: <b>{today.split("-").reverse().join("/")}</b></p><p>Livreur: ______________________</p></div>
      </header>
      <div className="sheet-summary">
        <span><b>{list.length}</b> colis</span><span><b>{totalUnits}</b> article(s)</span><span>À encaisser: <b>{dt(totalToCollect)}</b></span>
      </div>
      <table className="sheet-table">
        <thead><tr><th>#</th><th>N° commande</th><th>Client</th><th>Téléphone</th><th>Ville / adresse</th><th>Articles</th><th className="num">À payer</th><th>Livré</th><th>Signature / remarque</th></tr></thead>
        <tbody>{list.map((order, index) => <tr key={order.id}>
          <td>{index + 1}</td>
          <td className="mono">{order.number}</td>
          <td><b>{order.customerName}</b></td>
          <td className="mono">{formatTunisianPhone(order.phone)}{order.phone2 ? <><br />{formatTunisianPhone(order.phone2)}</> : null}</td>
          <td><b>{order.city}</b> ({order.governorate})<br /><small>{order.address}</small>{order.note ? <><br /><small>📝 {order.note}</small></> : null}</td>
          <td>{(itemsByOrder.get(order.id) ?? []).map((item) => `${item.quantity}× ${item.name.replace(/^VITAL FORCE\s*/i, "")}`).join(", ")}</td>
          <td className="num"><b>{dt(order.total)}</b></td>
          <td className="check">☐ Oui<br />☐ Retour</td>
          <td className="sign" />
        </tr>)}</tbody>
        <tfoot><tr><td colSpan={6}>Total à encaisser</td><td className="num"><b>{dt(totalToCollect)}</b></td><td colSpan={2}>Encaissé: ____________ DT</td></tr></tfoot>
      </table>
      <p className="sheet-foot">Remis par: __________________ &nbsp;&nbsp; Reçu par le livreur: __________________ &nbsp;&nbsp; Argent remis le: ____ / ____ / ________</p>
    </section>}

    {showLabels && <section className="labels">
      {list.map((order) => {
        const orderItemsList = itemsByOrder.get(order.id) ?? [];
        const quantity = orderItemsList.reduce((sum, item) => sum + item.quantity, 0);
        const barcode = code128Svg(order.number, { height: 46, module: 1.7 });
        return <Fragment key={order.id}>
          <article className="label">
            <table>
              <tbody>
                <tr>
                  <td className="bc"><div dangerouslySetInnerHTML={{ __html: barcode }} /><div className="bc-text">{order.number}</div></td>
                  <td className="from">
                    <p><b>EXPEDITEUR :</b> {sender}</p>
                    <p><b>ADRESSE :</b> {store.address}</p>
                    <p><b>TELEPHONE :</b> {store.phone}</p>
                    {store.taxId && <p><b>M/F :</b> {store.taxId}</p>}
                    <hr />
                    <p><b>Date :</b> &nbsp;{today}</p>
                    <p><b>Déstination :</b> <span className="dest">{order.governorate} ({quantity})</span></p>
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className="to">
                    <p><b>NOM DE DESTINATAIRE :</b> {order.customerName}</p>
                    <p><b>ADRESSE :</b> {order.address} {order.city} {order.governorate}</p>
                    <p><b>TELEPHONE 1 :</b> {order.phone}</p>
                    <p><b>TELEPHONE 2 :</b> {order.phone2 ?? ""}</p>
                    {order.note && <p><b>REMARQUE :</b> {order.note}</p>}
                  </td>
                </tr>
                <tr>
                  <td className="bc"><div dangerouslySetInnerHTML={{ __html: barcode }} /><div className="bc-text">{order.number}</div></td>
                  <td className="split">
                    <p>Désignation : {designation} {order.number}<br /><small>{orderItemsList.map((item) => `${item.quantity}× ${item.name}`).join(" · ")}</small></p>
                    <p>Quantité : {quantity}</p>
                  </td>
                </tr>
                <tr>
                  <td className="bl">BON DE LIVRAISON N° {order.number}</td>
                  <td className="pay">A payer : <b>{dt(order.total)}</b>{order.deliveryFee ? <small> (livraison {dt(order.deliveryFee)} incluse)</small> : null}</td>
                </tr>
                <tr>
                  <td className="sig">Signature du client<br /><span /></td>
                  <td className="ar" dir="rtl">يقرّ الحريف بأنه استلم الطرد في حالة جيدة ودفع المبلغ المذكور أعلاه<br /><small>Livré par {sender} · {store.phone}</small></td>
                </tr>
              </tbody>
            </table>
          </article>
        </Fragment>;
      })}
    </section>}
  </div>;
}
