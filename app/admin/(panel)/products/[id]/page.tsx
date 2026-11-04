import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/shell";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Produit" };

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const config = await getSettings();
  const costs = { deliveryFee: config.delivery.included ? 0 : config.delivery.fee, carrierCost: config.delivery.carrierCost, confirmationCost: config.costs.confirmationCost, returnCost: config.delivery.returnCost };
  if (id === "new") return <><PageHeader title="Nouveau produit" /><ProductForm costs={costs} /></>;
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) notFound();
  return <><PageHeader title={product.name} subtitle={`Référence ${product.sku}`} /><ProductForm product={product} costs={costs} /></>;
}
