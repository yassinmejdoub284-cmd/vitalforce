import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BotanicalHero } from "@/components/commerce/botanical-hero";
import { IngredientGrid } from "@/components/commerce/ingredient-grid";
import { ProductCard } from "@/components/commerce/product-card";
import { StoryGallery } from "@/components/commerce/story-gallery";
import { UsageGuide } from "@/components/commerce/usage-guide";
import { products } from "@/lib/product-data";
export default function HomePage() {
  const featured=products[0];
  return <main>
    <BotanicalHero/>
    <div className="botanical-strip"><span>7 INGRÉDIENTS BOTANIQUES</span><i>✳</i><span>GOÛT ORANGE</span><i>✳</i><span>FORMAT 400 G</span><i>✳</i><span>VITAL FORCE</span></div>
    <StoryGallery/>
    <IngredientGrid/>
    <section className="container-shell collection-section"><div className="section-heading"><div><p className="eyebrow">LA COLLECTION</p><h2>Trois goûts. Un rituel.</h2></div><Link href="/products" className="editorial-link">Toute la collection <ArrowUpRight size={20}/></Link></div><div className="grid gap-6 md:grid-cols-3">{products.slice(0,3).map(product=><ProductCard key={product.id} product={product}/>)}</div></section>
    <UsageGuide product={featured} showPrecautions />
  </main>;
}
