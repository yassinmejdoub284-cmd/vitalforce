import Link from "next/link";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { PageHeader } from "@/components/admin/shell";
import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { callbackDrafts, products } from "@/lib/db/schema";
import { shortDate } from "@/lib/format";
import { formatTunisianPhone } from "@/lib/tunisia";

async function dismiss(data: FormData) {
  "use server";
  await requireAdminPage();
  await db.update(callbackDrafts).set({ closedAt: new Date(), phone: null, customerName: null, city: null, address: null, governorate: null, items: null, angle: null })
    .where(and(eq(callbackDrafts.id, String(data.get("id"))), isNull(callbackDrafts.closedAt)));
  revalidatePath("/admin/orders/callbacks");
  revalidatePath("/admin/orders");
}

export default async function CallbacksPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const requested = Number((await searchParams).page);
  const page = Number.isSafeInteger(requested) && requested > 0 && requested <= 1000000 ? requested : 1;
  const open = isNull(callbackDrafts.closedAt);
  const [drafts, catalog, [total]] = await Promise.all([
    db.select().from(callbackDrafts).where(open).orderBy(desc(callbackDrafts.updatedAt)).limit(40).offset((page - 1) * 40),
    db.select({ id: products.id, name: products.name }).from(products),
    db.select({ value: count() }).from(callbackDrafts).where(open)
  ]);
  const names = new Map(catalog.map(p => [p.id, p.name]));
  return <><PageHeader title="Demandes de rappel" subtitle={`${total.value} commande(s) incomplète(s) à rappeler`} actions={<Link className="adm-btn" href="/admin/orders">Commandes</Link>} />
    <div className="adm-grid">{!drafts.length && <p className="adm-empty">Aucune demande de rappel sur cette page.</p>}
      {drafts.map(draft => <article key={draft.id} className="adm-card">
        <strong>{draft.customerName || "Client"} · <a dir="ltr" href={`tel:+216${draft.phone}`}>{formatTunisianPhone(draft.phone || "")}</a></strong>
        <p>{draft.items?.map(item => `${item.quantity} × ${names.get(item.productId) ?? item.productId}`).join(", ")}</p>
        <p>{[draft.governorate, draft.city, draft.address].filter(Boolean).join(" · ")}</p>
        <small>{shortDate(draft.updatedAt)} · {draft.angle || "Boutique"}</small>
        <div className="adm-row"><Link className="adm-btn" href={`/admin/orders/new?draft=${draft.id}`}>Compléter la commande</Link>
          <form action={dismiss}><input name="id" type="hidden" value={draft.id} /><button className="adm-btn">Classer sans commande</button></form></div>
      </article>)}
    </div>
    <nav className="adm-pager">{page > 1 && <Link href={`?page=${page-1}`}>Précédent</Link>}{page*40 < total.value && <Link href={`?page=${page+1}`}>Suivant</Link>}</nav>
  </>;
}
