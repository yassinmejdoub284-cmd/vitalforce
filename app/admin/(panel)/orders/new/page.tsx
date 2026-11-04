import { asc, eq } from "drizzle-orm";
import { ManualOrderForm } from "@/components/admin/manual-order";
import { PageHeader } from "@/components/admin/shell";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Nouvelle commande" };

export default async function NewOrderPage() {
  const [rows, config] = await Promise.all([db.select().from(products).where(eq(products.active, true)).orderBy(asc(products.sortOrder)), getSettings()]);
  return <>
    <PageHeader title="Nouvelle commande" subtitle="Commande prise par téléphone, Messenger ou en boutique" />
    <ManualOrderForm products={rows.map((row) => ({ id: row.id, name: row.name, price: row.price, stock: row.stock }))} delivery={{ fee: config.delivery.fee, included: config.delivery.included, freeThreshold: config.delivery.freeThreshold }} />
  </>;
}
