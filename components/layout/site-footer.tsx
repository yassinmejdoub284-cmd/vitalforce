"use client";

import Image from "next/image";
import Link from "next/link";
import { Leaf, MapPin, Phone } from "lucide-react";
import { phoneHref, useStoreSettings, whatsappHref } from "@/components/store-settings";

export function SiteFooter() {
  const { store: business } = useStoreSettings();
  const socials = [["Facebook", business.facebook], ["Instagram", business.instagram], ["TikTok", business.tiktok]].filter(([, url]) => /^https:\/\//.test(url));
  return (
    <footer className="site-footer mt-24 bg-forest-950 text-white">
      <div className="container-shell grid gap-10 py-12 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Image src="/images/v2/logo.png" alt="VITAL FORCE" width={210} height={142} className="h-20 w-auto object-contain" />
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
            {business.phone && <a href={phoneHref(business.phone)} className="flex items-center gap-2"><Phone size={16} className="shrink-0" /><span dir="ltr">{business.phone}</span></a>}
            {business.whatsapp && <a href={whatsappHref(business.whatsapp)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2"><Phone size={16} className="shrink-0" />WhatsApp</a>}
            {business.email && <a href={`mailto:${business.email}`} className="break-all">{business.email}</a>}
            <p className="flex items-start gap-2"><MapPin size={16} className="mt-1 shrink-0" /><span>{business.address}</span></p>
            <p className="flex items-center gap-2"><Leaf size={16} /> Fabriqué par AZI Pharma</p>
            {socials.length > 0 && <p className="flex flex-wrap gap-3">{socials.map(([label, url]) => <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="underline">{label}</a>)}</p>}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/55">
        Complément alimentaire. Ne remplace pas une alimentation variée et équilibrée.
      </div>
    </footer>
  );
}
