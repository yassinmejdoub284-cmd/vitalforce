"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/product-data";
import { trackMetaEvent } from "@/lib/meta";

export function AddToCart({ product, className }: { product: Product; className?: string }) {
  const [done, setDone] = useState(false);
  const addItem = useCart((state) => state.addItem);

  return (
    <Button
      className={className}
      onClick={() => {
        addItem({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.image
        });
        trackMetaEvent("AddToCart", {
          content_ids: [product.id],
          content_name: product.name,
          currency: "TND",
          value: product.price
        });
        setDone(true);
        window.setTimeout(() => setDone(false), 1400);
      }}
    >
      <ShoppingBag size={18} />
      {done ? "Ajouté au panier" : "Ajouter au panier"}
    </Button>
  );
}
