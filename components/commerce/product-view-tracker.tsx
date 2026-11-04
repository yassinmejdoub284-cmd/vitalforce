"use client";

import { useEffect } from "react";
import { trackMetaEvent } from "@/lib/meta";
import type { Product } from "@/lib/product-data";
import { track } from "@/lib/visitor";

export function ProductViewTracker({ product }: { product: Pick<Product, "id" | "name" | "price"> }) {
  useEffect(() => {
    const send = () => trackMetaEvent("ViewContent", { content_ids: [product.id], content_name: product.name, content_type: "product", currency: "TND", value: product.price });
    send();
    track("view_content", { value: product.price });
    window.addEventListener("vital-meta-ready", send, { once: true });
    return () => window.removeEventListener("vital-meta-ready", send);
  }, [product.id, product.name, product.price]);
  return null;
}
