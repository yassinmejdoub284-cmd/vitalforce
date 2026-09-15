"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import { formatTnd } from "@/lib/utils";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, setQuantity, removeItem } = useCart();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Panier">
      <button className="absolute inset-0 bg-forest-950/45 backdrop-blur-sm" onClick={onClose} aria-label="Fermer le panier" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl">
        <div className="flex items-center justify-between border-b border-forest-900/10 p-5">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} />
            <h2 className="text-lg font-bold">Votre panier</h2>
          </div>
          <button className="focus-ring rounded-full p-2" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">
          {items.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <ShoppingBag className="mx-auto text-forest-700/45" size={42} />
                <p className="mt-4 font-semibold">Le panier est vide.</p>
                <Link href="/products" className="mt-2 inline-block text-sm text-forest-700 underline" onClick={onClose}>
                  Voir les produits VITAL FORCE
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {items.map((item) => (
                <div key={item.productId} className="grid grid-cols-[76px_1fr] gap-4 rounded-2xl border border-forest-900/10 bg-white p-3">
                  <Image src={item.image} alt={item.name} width={120} height={80} className="h-20 w-full rounded-xl object-cover" />
                  <div>
                    <div className="flex justify-between gap-3">
                      <p className="font-bold">{item.name}</p>
                      <button onClick={() => removeItem(item.productId)} className="focus-ring rounded-full p-1 text-forest-900/60" aria-label="Supprimer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-forest-900/65">{formatTnd(item.price)}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <button className="focus-ring rounded-full border border-forest-900/15 p-1" onClick={() => setQuantity(item.productId, item.quantity - 1)} aria-label="Diminuer">
                        <Minus size={15} />
                      </button>
                      <span className="min-w-8 text-center font-bold">{item.quantity}</span>
                      <button className="focus-ring rounded-full border border-forest-900/15 p-1" onClick={() => setQuantity(item.productId, item.quantity + 1)} aria-label="Augmenter">
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-forest-900/10 p-5">
          <div className="mb-4 flex items-center justify-between text-lg font-bold">
            <span>Sous-total</span>
            <span>{formatTnd(subtotal)}</span>
          </div>
          <div className="grid gap-2">
            <ButtonLink href="/checkout" onClick={onClose} className="w-full">
              Commander
            </ButtonLink>
            <Button variant="secondary" onClick={onClose} className="w-full">
              Continuer mes achats
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
