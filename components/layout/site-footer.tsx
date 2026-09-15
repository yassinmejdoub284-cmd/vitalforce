"use client";

import Image from "next/image";
import Link from "next/link";
import { Leaf, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";

export function SiteFooter() {
  const [business, setBusiness] = useState({ phone: "+216 27 200 603", address: "Sfax, Tunisie" });
  useEffect(() => {
    fetch("/api/settings").then((response) => response.json()).then((data) => {
      if (data.settings) setBusiness({ phone: data.settings.phone, address: data.settings.address });
    }).catch(() => {});
  }, []);
  return (
    <footer className="mt-24 border-t border-forest-900/10 bg-forest-950 text-white">
      <div className="container-shell grid gap-10 py-12 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Image src="/images/v2/logo.png" alt="VITAL FORCE" width={240} height={162} className="h-24 w-auto object-contain" />
          <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
            VITAL FORCE réunit sept ingrédients botaniques. Découvrez les goûts orange, citron et menthe, la formule et les précautions d’emploi.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-gold-300">Boutique</h2>
          <nav className="mt-4 grid gap-3 text-sm text-white/74">
            <Link href="/products">Produits</Link>
            <Link href="/#ingredients">Les 7 ingrédients</Link>
            <Link href="/checkout">Commander</Link>
          </nav>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-gold-300">Tunisie</h2>
          <div className="mt-4 grid gap-3 text-sm text-white/74">
            <p className="flex items-center gap-2"><Phone size={16} /> {business.phone}</p>
            <p className="flex items-center gap-2"><MapPin size={16} /> {business.address}</p>
            <p className="flex items-center gap-2"><Leaf size={16} /> Fabriqué par AZI Pharma</p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/55">
        Complément alimentaire. Ne remplace pas une alimentation variée et équilibrée.
      </div>
    </footer>
  );
}
