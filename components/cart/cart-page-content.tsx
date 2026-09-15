"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { ButtonLink } from "@/components/ui/button";
import { formatTnd } from "@/lib/utils";

export function CartPageContent() {
  const { items, setQuantity, removeItem } = useCart();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return <main className="container-shell py-14">
    <h1 className="font-display text-4xl md:text-5xl">Votre panier</h1>
    {items.length === 0 ? (
      <div className="mt-10 grid min-h-72 place-items-center border-y border-forest-900/10 text-center">
        <div><ShoppingBag size={36} className="mx-auto text-gold-700"/><p className="mt-4 font-semibold">Votre panier est vide.</p><ButtonLink href="/products" className="mt-5">Découvrir les goûts</ButtonLink></div>
      </div>
    ) : (
      <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="divide-y divide-forest-900/10 border-y border-forest-900/10">
          {items.map((item) => <article key={item.productId} className="grid grid-cols-[80px_minmax(0,1fr)] gap-4 py-5 sm:grid-cols-[100px_minmax(0,1fr)_auto]">
            <div className="grid h-24 place-items-center bg-forest-50"><Image src={item.image} alt="" width={100} height={100} className="max-h-20 w-auto object-contain"/></div>
            <div className="min-w-0">
              <Link href={`/products/${item.slug}`} className="font-bold hover:underline">{item.name}</Link>
              <p className="mt-2 text-sm text-forest-900/65">{formatTnd(item.price)}</p>
              <div className="mt-4 flex items-center gap-3">
                <button type="button" onClick={() => setQuantity(item.productId, item.quantity - 1)} className="focus-ring grid h-8 w-8 place-items-center border border-forest-900/15" aria-label={`Diminuer ${item.name}`}><Minus size={15}/></button>
                <span className="min-w-5 text-center font-semibold">{item.quantity}</span>
                <button type="button" onClick={() => setQuantity(item.productId, item.quantity + 1)} className="focus-ring grid h-8 w-8 place-items-center border border-forest-900/15" aria-label={`Augmenter ${item.name}`}><Plus size={15}/></button>
                <button type="button" onClick={() => removeItem(item.productId)} className="focus-ring ml-2 grid h-8 w-8 place-items-center text-forest-900/65" aria-label={`Retirer ${item.name}`}><Trash2 size={16}/></button>
              </div>
            </div>
            <strong className="col-span-2 text-right sm:col-span-1">{formatTnd(item.price * item.quantity)}</strong>
          </article>)}
        </div>
        <aside className="h-fit border border-forest-900/10 bg-white p-6">
          <h2 className="text-lg font-bold">Récapitulatif</h2>
          <div className="mt-6 flex justify-between border-b border-forest-900/10 pb-5"><span>Sous-total</span><strong>{formatTnd(subtotal)}</strong></div>
          <p className="mt-4 text-xs text-forest-900/65">Les frais de livraison sont calculés à la commande.</p>
          <ButtonLink href="/checkout" className="mt-6 w-full">Commander</ButtonLink>
          <Link href="/products" className="mt-4 block text-center text-sm font-semibold underline">Continuer mes achats</Link>
        </aside>
      </div>
    )}
  </main>;
}
