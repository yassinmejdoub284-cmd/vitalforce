import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, Truck } from "lucide-react";
import { formatTnd } from "@/lib/utils";
import { products } from "@/lib/product-data";

export function BotanicalHero() {
  const product = products[0];

  return <>
    <section className="shop-hero" aria-labelledby="hero-title">
      <Image src="/images/hero-botanical-background.png" alt="" fill priority sizes="100vw" className="shop-hero-image" />
      <div className="shop-hero-shade" aria-hidden="true" />
      <div className="hero-product" role="img" aria-label="Pot VITAL FORCE Orange 400 g">
        <div className="hero-product-lid" aria-hidden="true" />
        <div className="hero-product-body">
          <Image
            src="/images/v2/etiquette-orange-front.png"
            alt="Étiquette VITAL FORCE Orange 400 g"
            width={724}
            height={724}
            priority
            unoptimized
            sizes="(max-width: 700px) 300px, 430px"
            className="hero-product-label"
          />
        </div>
      </div>
      <div className="container-shell shop-hero-inner">
        <div className="shop-hero-copy">
          <p className="shop-kicker">VITAL FORCE · 400 G · 7 INGRÉDIENTS</p>
          <h1 id="hero-title">VITAL FORCE</h1>
          <p className="shop-hero-tagline">La force de la nature.</p>
          <p className="shop-hero-description">Un mélange botanique à intégrer simplement à votre rituel quotidien, disponible en trois goûts.</p>
          <div className="shop-hero-offer"><strong>{formatTnd(product.price)}</strong><span>le pot de 400 g</span></div>
          <div className="shop-hero-actions">
            <Link href={`/products/${product.slug}`} className="shop-primary-action">Commander maintenant <ArrowRight size={18} /></Link>
            <Link href="#ingredients" className="shop-secondary-action">Voir les 7 ingrédients</Link>
          </div>
          <ul className="shop-hero-points" aria-label="Informations essentielles">
            <li><Check size={16} /> Paiement à la livraison</li>
            <li><Check size={16} /> Livraison en Tunisie</li>
          </ul>
        </div>
      </div>
    </section>
    <div className="commerce-proof-bar" aria-label="Les engagements VITAL FORCE">
      <div className="container-shell commerce-proof-grid">
        <div><span className="proof-icon"><ShieldCheck size={21} /></span><p><strong>Formule transparente</strong><small>Composition et précautions accessibles</small></p></div>
        <div><span className="proof-icon proof-number">7</span><p><strong>Ingrédients botaniques</strong><small>Racines, rhizomes et graines</small></p></div>
        <div><span className="proof-icon"><Truck size={21} /></span><p><strong>Livraison locale</strong><small>Choix du transporteur au paiement</small></p></div>
        <div><span className="proof-icon proof-number">3</span><p><strong>Goûts disponibles</strong><small>Orange, Citron et Menthe</small></p></div>
      </div>
    </div>
  </>;
}
