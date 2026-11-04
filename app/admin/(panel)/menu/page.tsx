import Link from "next/link";
import { ExternalLink, Megaphone, Package, Radio, Settings, ShoppingBag } from "lucide-react";
import { LogoutButton } from "@/components/admin/logout-button";
import { PushToggle } from "@/components/admin/push-toggle";
import { PageHeader } from "@/components/admin/shell";

export const metadata = { title: "Menu" };

const links = [
  { href: "/admin/products", label: "Produits & stock", icon: Package },
  { href: "/admin/settings", label: "Gestion du site (prix livraison, contact, pixel, Jetpack…)", icon: Settings },
  { href: "/admin/marketing", label: "Marketing & rentabilité", icon: Megaphone },
  { href: "/admin/orders/new", label: "Saisir une commande", icon: ShoppingBag },
  { href: "/admin/live", label: "Visiteurs en direct", icon: Radio }
];

export default function MenuPage() {
  return <>
    <PageHeader title="Menu" />
    <div className="adm-grid">
      {links.map((item) => <Link key={item.href} href={item.href} className="adm-card adm-row" style={{ textDecoration: "none", fontWeight: 700 }}><item.icon size={20} />{item.label}</Link>)}
      <section className="adm-card"><h2>Notifications sur ce téléphone</h2><PushToggle /></section>
      <a href={process.env.NEXT_PUBLIC_SITE_URL || "/"} target="_blank" rel="noopener noreferrer" className="adm-card adm-row" style={{ textDecoration: "none", fontWeight: 700 }}><ExternalLink size={20} />Voir le site</a>
      <LogoutButton />
    </div>
  </>;
}
