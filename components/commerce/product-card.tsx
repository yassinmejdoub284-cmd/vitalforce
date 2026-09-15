import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AddToCart } from "@/components/cart/add-to-cart";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/product-data";
import { formatTnd } from "@/lib/utils";
import { ProductJar } from "@/components/commerce/product-jar";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group rounded-[28px] border border-forest-900/10 bg-white p-4 shadow-green transition hover:-translate-y-1">
      <Link href={`/products/${product.slug}`} className="product-still block overflow-hidden rounded-3xl bg-forest-50" aria-label={product.name}>
        <ProductJar flavor={product.flavor} />
      </Link>
      <div className="p-2 pt-5">
        <Badge>{product.flavor}</Badge>
        <h2 className="mt-4 text-2xl font-bold">{product.name}</h2>
        <p className="mt-2 min-h-12 text-sm leading-6 text-forest-900/65">{product.subtitle}</p>
        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-black text-forest-900">{formatTnd(product.price)}</p>
            {product.compareAtPrice && <p className="text-sm text-forest-900/45 line-through">{formatTnd(product.compareAtPrice)}</p>}
          </div>
          <Link href={`/products/${product.slug}`} className="focus-ring rounded-full p-3 text-forest-700 transition hover:bg-forest-50" aria-label={`Voir ${product.name}`}>
            <ArrowRight />
          </Link>
        </div>
        <AddToCart product={product} className="mt-5 w-full" />
      </div>
    </article>
  );
}
