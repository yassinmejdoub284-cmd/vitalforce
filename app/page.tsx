import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BotanicalHero } from "@/components/commerce/botanical-hero";
import { IngredientGrid } from "@/components/commerce/ingredient-grid";
import { ProductCard } from "@/components/commerce/product-card";
import { StoryGallery } from "@/components/commerce/story-gallery";
import { products } from "@/lib/product-data";
export default function HomePage() {
  const featured=products[0];
  return <main>
    <BotanicalHero/>
    <div className="botanical-strip"><span>7 INGRÉDIENTS BOTANIQUES</span><i>✳</i><span>GOÛT ORANGE</span><i>✳</i><span>FORMAT 400 G</span><i>✳</i><span>VITAL FORCE</span></div>
    <StoryGallery/>
    <IngredientGrid/>
    <section className="container-shell collection-section"><div className="section-heading"><div><p className="eyebrow">LA COLLECTION</p><h2>Trois goûts. Un rituel.</h2></div><Link href="/products" className="editorial-link">Toute la collection <ArrowUpRight size={20}/></Link></div><div className="grid gap-6 md:grid-cols-3">{products.slice(0,3).map(product=><ProductCard key={product.id} product={product}/>)}</div></section>
    <section id="rituel" className="container-shell ritual-section"><div className="ritual-title"><p className="eyebrow">LE GESTE QUOTIDIEN</p><h2>Simple.<br/><em>Naturellement.</em></h2><p>Les indications de préparation et les précautions de votre formule, réunies au même endroit.</p></div><div className="ritual-instructions">{featured.usage.map((text,i)=><div className="ritual-step" key={text}><span>0{i+1}</span><p>{text}</p></div>)}<details className="precautions"><summary>Précautions & conservation</summary>{featured.warnings.map(w=><p key={w}>{w}</p>)}<p>{featured.conservation}</p></details></div></section>
  </main>;
}
