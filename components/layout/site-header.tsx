"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, ShoppingBag, Truck, X } from "lucide-react";
import { useState } from "react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/products", label: "Boutique" },
  { href: "/#ingredients", label: "Ingrédients" },
  { href: "/#rituel", label: "Mode d’emploi" }
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const itemCount = useCart((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));

  return (
    <>
      <div className="announcement-bar"><Truck size={14} /><span>Livraison partout en Tunisie</span><i aria-hidden="true" /><span>Paiement à la livraison</span></div>
      <header className="site-header sticky top-0 z-50">
        <div className="container-shell flex h-[72px] items-center justify-between gap-4">
          <Link href="/" className="focus-ring flex items-center gap-3">
            <Image src="/images/v2/logo.png" alt="VITAL FORCE" width={110} height={74} className="h-12 w-auto object-contain" priority />
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="site-nav-link focus-ring px-3 py-2 text-sm font-semibold">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/products/vital-force-400g-orange" className="header-buy hidden md:inline-flex">Commander</Link>
            <Button variant="dark" onClick={() => setCartOpen(true)} className="relative px-4" aria-label="Ouvrir le panier">
              <ShoppingBag size={18} />
              {itemCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold-300 px-1 text-xs text-forest-950">{itemCount}</span>}
            </Button>
            <button className="focus-ring rounded-full p-3 md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Menu" aria-expanded={open}>
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        <div inert={!open} className={cn("container-shell grid overflow-hidden transition-all md:hidden", open ? "max-h-64 pb-4" : "max-h-0")}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="border-b border-forest-900/10 px-1 py-4 font-semibold text-forest-900">
              {link.label}
            </Link>
          ))}
          <Link href="/products/vital-force-400g-orange" onClick={() => setOpen(false)} className="shop-primary-action mt-3">Commander maintenant</Link>
        </div>
      </header>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
