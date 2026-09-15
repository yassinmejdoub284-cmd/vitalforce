"use client";
import { useState } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { VitalJarScene } from "@/components/3d/scene-loader";
import { IngredientOrbit } from "@/components/commerce/ingredient-orbit";
import { AddToCart } from "@/components/cart/add-to-cart";
import { products, vitalForceIngredients } from "@/lib/product-data";
import { formatTnd } from "@/lib/utils";
export function BotanicalHero() {
  const [selected, setSelected] = useState(1);
  const ingredient = vitalForceIngredients[selected];
  return <section className="botanical-hero" aria-labelledby="hero-title">
    <div className="hero-topline"><span>LA NATURE, DANS VOTRE RITUEL.</span><span>FORMULE 01 / ORANGE</span></div>
    <div className="hero-editorial"><span className="eyebrow">VITAL FORCE • 7 PLANTES</span><h1 id="hero-title">La force <br/><em>de la nature</em></h1><p>Un mélange botanique. <br/>Un goût d’orange. <br/>Votre nouveau rituel.</p><a href="#ingredients" className="hero-text-link">Explorer la formule <ArrowUpRight size={17}/></a></div>
    <div className="hero-stage"><div className="hero-halo" aria-hidden="true"/><span className="hero-giant" aria-hidden="true">VITAL</span><div className="hero-jar"><VitalJarScene /></div>
      <IngredientOrbit selected={selected} onSelect={setSelected}/>
      <div className="hero-ingredient-caption" aria-live="off"><span>ZOOM BOTANIQUE / {String(selected+1).padStart(2,"0")}</span><strong>{ingredient.name}</strong><p>{ingredient.benefit}</p></div>
    </div>
    <div className="hero-buy"><div><span>LE MÉLANGE SIGNATURE</span><h2>VITAL FORCE <small>400 g</small></h2></div><div className="hero-price">{formatTnd(products[0].price)}<span>Goût orange</span></div><AddToCart product={products[0]} className="hero-add"/></div>
    <a href="#ingredients" className="hero-scroll" aria-label="Découvrir les ingrédients"><ArrowDown size={18}/></a>
  </section>;
}
