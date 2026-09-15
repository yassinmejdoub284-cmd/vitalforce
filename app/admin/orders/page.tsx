import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatTnd } from "@/lib/utils";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { getDeliveryLabel } from "@/lib/delivery";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin commandes" };

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } });
  return (
    <section>
      <h1 className="font-display text-5xl font-bold">Commandes</h1>
      <div className="mt-8 grid gap-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-[26px] bg-white p-5 shadow-green">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Link href={`/admin/orders/${order.id}`} className="text-xl font-black hover:underline">{order.number}</Link>
                <p className="text-sm text-forest-900/60">{order.customerName} · {order.phone} · {order.city}</p>
              </div>
              <p className="text-2xl font-black">{formatTnd(order.total)}</p>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-forest-900/58">{order.items.length} ligne(s) · {order.paymentMethod} · {getDeliveryLabel(order.deliveryCompany)}</p>
              <OrderStatusForm orderId={order.id} status={order.status} paymentStatus={order.paymentStatus} />
            </div>
          </article>
        ))}
        {orders.length === 0 && <p className="rounded-3xl bg-white p-8 text-center shadow-green">Aucune commande.</p>}
      </div>
    </section>
  );
}
