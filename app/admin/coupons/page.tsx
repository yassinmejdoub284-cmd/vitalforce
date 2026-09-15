import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin promos" };

export default async function CouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <section>
      <h1 className="font-display text-5xl font-bold">Promos</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {coupons.map((coupon) => (
          <article key={coupon.id} className="rounded-[26px] bg-white p-6 shadow-green">
            <p className="text-2xl font-black">{coupon.code}</p>
            <p className="mt-2 text-forest-900/62">{coupon.description}</p>
            <p className="mt-4 text-xl font-bold">-{coupon.percentOff}%</p>
            <p className="mt-2 text-sm font-semibold text-forest-700">{coupon.active ? "Actif" : "Inactif"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
