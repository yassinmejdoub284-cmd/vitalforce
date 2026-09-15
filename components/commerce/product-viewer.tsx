"use client";

import Link from "next/link";
import { ArrowLeft, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";
import { VitalJarScene } from "@/components/3d/scene-loader";
import { AddToCart } from "@/components/cart/add-to-cart";
import type { Product } from "@/lib/product-data";
import { formatTnd } from "@/lib/utils";

const angles = [
  { label: "Face", value: 0 },
  { label: "Profil", value: Math.PI / 2 },
  { label: "Dos", value: Math.PI }
];

export function ProductViewer({ product }: { product: Product }) {
  const [angle, setAngle] = useState(0);
  const [zoom, setZoom] = useState(6.8);

  return (
    <main className="container-shell py-10">
      <Link href={`/products/${product.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft size={18} /> {product.name}</Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(290px,.6fr)]">
        <section className="min-w-0 border border-forest-900/10 bg-white p-4" aria-label={`Visualisation VITAL FORCE ${product.flavor}`}>
          <div className="h-[480px] md:h-[620px]">
            <VitalJarScene key={zoom} viewer flavor={product.flavor} angle={angles[angle].value} zoom={zoom} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-forest-900/10 pt-4">
            <div className="flex gap-1" role="group" aria-label="Angle du pot">
              {angles.map((item, index) => <button key={item.label} type="button" onClick={() => setAngle(index)} aria-pressed={angle === index} className={`focus-ring min-h-10 px-4 text-sm font-semibold ${angle === index ? "bg-forest-950 text-white" : "bg-forest-50 text-forest-900"}`}>{item.label}</button>)}
            </div>
            <div className="flex gap-1" role="group" aria-label="Zoom">
              <button type="button" onClick={() => setZoom((value) => Math.min(9, +(value + .7).toFixed(1)))} disabled={zoom >= 9} className="focus-ring grid h-10 w-10 place-items-center border border-forest-900/15" aria-label="Dézoomer" title="Dézoomer"><ZoomOut size={19} /></button>
              <button type="button" onClick={() => setZoom((value) => Math.max(4.4, +(value - .7).toFixed(1)))} disabled={zoom <= 4.4} className="focus-ring grid h-10 w-10 place-items-center border border-forest-900/15" aria-label="Zoomer" title="Zoomer"><ZoomIn size={19} /></button>
            </div>
          </div>
        </section>
        <aside className="self-start">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-700">GOÛT {product.flavor.toUpperCase()}</p>
          <h1 className="mt-3 font-display text-4xl">{product.name}</h1>
          <p className="mt-5 text-3xl font-bold">{formatTnd(product.price)}</p>
          <p className="mt-5 text-sm leading-7 text-forest-900/70">{product.shortDescription}</p>
          <AddToCart product={product} className="mt-8 w-full" />
          <p className="mt-5 text-xs leading-5 text-forest-900/60">Complément alimentaire. Respecter les indications et précautions de l’étiquette.</p>
        </aside>
      </div>
    </main>
  );
}
