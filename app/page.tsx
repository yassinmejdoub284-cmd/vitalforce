import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BotanicalHero } from "@/components/commerce/botanical-hero";
import { IngredientGrid } from "@/components/commerce/ingredient-grid";
import { ProductCard } from "@/components/commerce/product-card";
import { StoryGallery } from "@/components/commerce/story-gallery";
import { CampaignGallery } from "@/components/commerce/campaign-gallery";
import { ProductFaq } from "@/components/commerce/product-faq";
import { products } from "@/lib/product-data";
export default function HomePage() {
  const featured=products[0];
  return <main>
    <BotanicalHero/>
    <CampaignGallery/>
    <section className="container-shell collection-section" id="collection"><div className="section-heading"><div><p className="eyebrow">CHOISISSEZ VOTRE GOÛT</p><h2>Un rituel, trois façons<br/><em>de l’adopter.</em></h2></div><Link href="/products" className="editorial-link">Voir la boutique <ArrowUpRight size={20}/></Link></div><div className="grid gap-5 md:grid-cols-3">{products.slice(0,3).map(product=><ProductCard key={product.id} product={product}/>)}</div></section>
    <StoryGallery/>
    <IngredientGrid/>
    <ProductFaq />
    <Link href={`/products/${featured.slug}`} className="mobile-buy-bar"><span><small>VITAL FORCE 400 g</small><strong>{featured.price} DT</strong></span><b>Commander <ArrowUpRight size={16}/></b></Link>
  </main>;
}
