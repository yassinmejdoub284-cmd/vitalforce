import { prisma } from "@/lib/prisma";
import { formatTnd } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminDashboard() {
  const [orders, products] = await Promise.all([
    prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.product.findMany()
  ]);
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const lowStock = products.filter((product) => product.stock < 25).length;

  return (
    <section>
      <p className="font-bold uppercase tracking-[0.16em] text-gold-700">Back office</p>
      <h1 className="mt-3 font-display text-5xl font-bold">Dashboard VITAL FORCE</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          ["Commandes", orders.length],
          ["Chiffre d'affaires", formatTnd(revenue)],
          ["Produits", products.length],
          ["Stock bas", lowStock]
        ].map(([label, value]) => (
          <div key={label} className="rounded-[26px] bg-white p-5 shadow-green">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-forest-900/45">{label}</p>
            <p className="mt-3 text-3xl font-black">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-[28px] bg-white p-6 shadow-green">
        <h2 className="text-2xl font-bold">Dernières commandes</h2>
        <div className="mt-5 grid gap-3">
          {orders.map((order) => (
            <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-forest-50 p-4">
              <div><p className="font-bold">{order.number} - {order.customerName}</p><p className="text-sm text-forest-900/60">{order.city} · {order.status}</p></div>
              <p className="font-black">{formatTnd(order.total)}</p>
            </div>
          ))}
          {orders.length === 0 && <p className="text-forest-900/60">Aucune commande pour le moment.</p>}
        </div>
      </div>
    </section>
  );
}
