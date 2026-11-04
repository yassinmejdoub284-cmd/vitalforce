"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { HandCoins, Loader2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { CustomerFields, submitOrder, trackCheckoutStart } from "@/components/commerce/order-fields";
import { useStoreSettings } from "@/components/store-settings";
import { Button } from "@/components/ui/button";
import { deliveryFeeFor } from "@/lib/pricing";
import { formatTnd } from "@/lib/utils";

export function CheckoutForm({ checkoutAvailable }: { checkoutAvailable: boolean }) {
  const router = useRouter();
  const { items, clear } = useCart();
  const { store, delivery } = useStoreSettings();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const started = useRef(false);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = deliveryFeeFor(subtotal, delivery);
  const total = subtotal + deliveryFee;
  const canOrder = checkoutAvailable && store.ordersEnabled;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canOrder || loading) return;
    setLoading(true);
    setError("");
    try {
      const order = await submitOrder(event.currentTarget, items.map(({ productId, quantity }) => ({ productId, quantity })), { lang: "fr" });
      clear();
      router.push(`/confirmation?order=${order.number}&total=${order.total}`);
    } catch (failure) {
      setError((failure as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} onFocusCapture={() => { if (!started.current) { started.current = true; trackCheckoutStart(total, items.map((item) => item.productId)); } }} className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <section className="glass rounded-[28px] p-5 md:p-8">
        <h1 className="font-display text-3xl font-bold">Finaliser la commande</h1>
        {!canOrder && <p role="status" className="mt-4 border-l-4 border-gold-500 bg-gold-100/40 p-4 text-sm">La commande en ligne est temporairement indisponible. Appelez-nous au {store.phone} pour commander.</p>}
        <p className="mt-2 flex items-center gap-2 text-forest-900/65"><HandCoins size={18} /> Paiement à la livraison partout en Tunisie. Nous vous appelons pour confirmer.</p>
        <fieldset disabled={!canOrder} className="mt-8 disabled:opacity-55">
          <CustomerFields lang="fr" showNote className="product-fields grid gap-4 md:grid-cols-2" inputClassName="w-full rounded-2xl border border-forest-900/15 bg-white px-4 py-3" />
        </fieldset>
        {error && <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
      </section>
      <aside className="h-fit rounded-[28px] bg-forest-950 p-5 text-white shadow-green">
        <h2 className="text-lg font-bold">Résumé</h2>
        <div className="mt-5 grid gap-4">
          {items.length === 0 ? <p className="text-sm text-white/65">Votre panier est vide.</p> : items.map((item) => (
            <div key={item.productId} className="flex justify-between gap-4 text-sm">
              <span>{item.quantity} x {item.name}</span>
              <span>{formatTnd(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-2 border-t border-white/12 pt-5 text-sm">
          <div className="flex justify-between"><span>Sous-total</span><span>{formatTnd(subtotal)}</span></div>
          <div className="flex justify-between"><span>Livraison · {delivery.eta}</span><span>{deliveryFee === 0 ? "Offerte" : formatTnd(deliveryFee)}</span></div>
          <div className="flex justify-between text-xl font-bold"><span>Total</span><span>{formatTnd(total)}</span></div>
        </div>
        <Button disabled={!canOrder || items.length === 0 || loading} className="mt-6 w-full bg-gold-300 text-forest-950 hover:bg-gold-100">
          {loading && <Loader2 className="animate-spin" size={18} />}
          Confirmer la commande
        </Button>
      </aside>
    </form>
  );
}
