import { notFound } from "next/navigation";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { prisma } from "@/lib/prisma";
import { formatTnd } from "@/lib/utils";
import { getDeliveryLabel } from "@/lib/delivery";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  return (
    <section>
      <h1 className="font-display text-5xl font-bold">{order.number}</h1>
      <p className="mt-3 text-forest-900/65">{order.customerName} · {order.phone}</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[28px] bg-white p-6 shadow-green">
          <h2 className="text-2xl font-bold">Articles</h2>
          <div className="mt-5 grid gap-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between rounded-2xl bg-forest-50 p-4">
                <span>{item.quantity} x {item.name}</span>
                <strong>{formatTnd(item.price * item.quantity)}</strong>
              </div>
            ))}
          </div>
        </div>
        <aside className="rounded-[28px] bg-forest-950 p-6 text-white shadow-green">
          <h2 className="text-2xl font-bold">Workflow</h2>
          <div className="mt-5 rounded-2xl bg-white/8 p-4">
            <OrderStatusForm orderId={order.id} status={order.status} paymentStatus={order.paymentStatus} />
          </div>
          <p className="mt-5 text-sm text-white/70">{order.address}, {order.city}</p>
          <p className="mt-3 text-sm text-white/70">Livraison: {getDeliveryLabel(order.deliveryCompany)}</p>
          <p className="mt-1 text-sm text-white/70">Tracking: {order.trackingNumber ?? "Retrait / non généré"}</p>
          <p className="mt-5 text-3xl font-black">{formatTnd(order.total)}</p>
        </aside>
      </div>
    </section>
  );
}
