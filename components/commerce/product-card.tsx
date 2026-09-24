import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { AddToCart } from "@/components/cart/add-to-cart";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/product-data";
import { formatTnd } from "@/lib/utils";
import { ProductJar } from "@/components/commerce/product-jar";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="shop-product-card group">
      <Link href={`/products/${product.slug}`} className="product-still block overflow-hidden" aria-label={product.name}>
        <span className="product-card-tag">400 g</span>
        <ProductJar flavor={product.flavor} />
      </Link>
      <div className="product-card-body">
        <div className="flex items-center justify-between gap-3"><Badge>{product.flavor}</Badge><span className="product-stock"><Check size={13}/> En stock</span></div>
        <h2>{product.name}</h2>
        <p>{product.subtitle}</p>
        <div className="product-card-price">
          <div>
            <p>{formatTnd(product.price)}</p>
            {product.compareAtPrice && <p className="text-sm text-forest-900/45 line-through">{formatTnd(product.compareAtPrice)}</p>}
          </div>
          <Link href={`/products/${product.slug}`} className="product-view-link" aria-label={`Voir ${product.name}`}>
            Voir <ArrowRight size={17}/>
          </Link>
        </div>
        <AddToCart product={product} className="mt-5 w-full" />
      </div>
    </article>
  );
}
