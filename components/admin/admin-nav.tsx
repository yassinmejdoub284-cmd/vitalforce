import Link from "next/link";
import { BarChart3, Boxes, LayoutDashboard, Package, Settings, TicketPercent } from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Produits", icon: Package },
  { href: "/admin/inventory", label: "Stock", icon: Boxes },
  { href: "/admin/orders", label: "Commandes", icon: BarChart3 },
  { href: "/admin/coupons", label: "Promos", icon: TicketPercent },
  { href: "/admin/settings", label: "Réglages", icon: Settings }
];

export function AdminNav() {
  return (
    <nav className="grid gap-2 rounded-[26px] bg-forest-950 p-3 text-white shadow-green lg:sticky lg:top-28">
      {links.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className="focus-ring flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-white/78 transition hover:bg-white/10 hover:text-white">
          <Icon size={18} className="text-gold-300" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
