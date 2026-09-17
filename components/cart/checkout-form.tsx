"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CreditCard, HandCoins, Loader2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { getDeliveryQuotes, type DeliveryCompany, type DeliverySettings } from "@/lib/delivery";
import { trackMetaEvent } from "@/lib/meta";
import { formatTnd } from "@/lib/utils";

export function CheckoutForm({ checkoutAvailable }: { checkoutAvailable: boolean }) {
  const router = useRouter();
  const { items, clear } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "mock_card">("cod");
  const [deliveryCompany, setDeliveryCompany] = useState<DeliveryCompany>("local_courier");
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>({ deliveryFee: 7, freeShippingThreshold: 180 });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const quotes = getDeliveryQuotes(subtotal, deliverySettings);
  const selectedQuote = quotes.find((quote) => quote.company === deliveryCompany) ?? quotes[0];
  const deliveryFee = subtotal === 0 ? 0 : selectedQuote.fee;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    fetch("/api/settings").then((response) => response.json()).then((data) => {
      if (data.settings) setDeliverySettings(data.settings);
    }).catch(() => {});
  }, []);

  async function submit(formData: FormData) {
    if (!checkoutAvailable) return;
    setLoading(true);
    setError("");
    const payload = {
      customerName: String(formData.get("customerName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      address: String(formData.get("address") ?? ""),
      city: String(formData.get("city") ?? ""),
      note: String(formData.get("note") ?? ""),
      paymentMethod,
      deliveryCompany,
      items: items.map(({ productId, name, price, quantity }) => ({ productId, name, price, quantity }))
    };

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Impossible de créer la commande.");
      return;
    }
    trackMetaEvent("Purchase", {
      currency: "TND",
      value: data.order.total,
      content_ids: items.map((item) => item.productId),
      num_items: items.reduce((sum, item) => sum + item.quantity, 0)
    });
    clear();
    router.push(`/confirmation?order=${data.order.number}`);
  }

  return (
    <form action={submit} className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <section className="glass rounded-[28px] p-5 md:p-8">
        <h1 className="font-display text-3xl font-bold">Finaliser la commande</h1>
        {!checkoutAvailable && <p role="status" className="mt-4 border-l-4 border-gold-500 bg-gold-100/40 p-4 text-sm">La commande en ligne est temporairement indisponible. Vos coordonnées ne seront pas envoyées.</p>}
        <p className="mt-2 text-forest-900/65">Cash on delivery disponible en Tunisie. Le paiement carte est simulé pour préparer une future intégration.</p>
        <fieldset disabled={!checkoutAvailable} className="mt-8 grid gap-4 disabled:opacity-55 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">Nom complet<input name="customerName" required className="rounded-2xl border border-forest-900/15 bg-white px-4 py-3" /></label>
          <label className="grid gap-2 text-sm font-semibold">Téléphone<input name="phone" required className="rounded-2xl border border-forest-900/15 bg-white px-4 py-3" placeholder="+216 ..." /></label>
          <label className="grid gap-2 text-sm font-semibold">Email<input name="email" type="email" className="rounded-2xl border border-forest-900/15 bg-white px-4 py-3" /></label>
          <label className="grid gap-2 text-sm font-semibold">Ville<input name="city" required className="rounded-2xl border border-forest-900/15 bg-white px-4 py-3" placeholder="Sfax, Tunis..." /></label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">Adresse<textarea name="address" required className="min-h-24 rounded-2xl border border-forest-900/15 bg-white px-4 py-3" /></label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">Note<textarea name="note" className="min-h-20 rounded-2xl border border-forest-900/15 bg-white px-4 py-3" /></label>
        </fieldset>
        <fieldset disabled={!checkoutAvailable} className="disabled:opacity-55">
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          <button type="button" onClick={() => setPaymentMethod("cod")} className={`focus-ring rounded-2xl border p-4 text-left ${paymentMethod === "cod" ? "border-gold-500 bg-gold-100/40" : "border-forest-900/12 bg-white"}`}>
            <HandCoins size={22} />
            <span className="mt-3 block font-bold">Cash on delivery</span>
            <span className="text-sm text-forest-900/62">Paiement à la livraison.</span>
          </button>
          <button type="button" onClick={() => setPaymentMethod("mock_card")} className={`focus-ring rounded-2xl border p-4 text-left ${paymentMethod === "mock_card" ? "border-gold-500 bg-gold-100/40" : "border-forest-900/12 bg-white"}`}>
            <CreditCard size={22} />
            <span className="mt-3 block font-bold">Carte démo</span>
            <span className="text-sm text-forest-900/62">Adapter prêt pour Stripe.</span>
          </button>
        </div>
        <div className="mt-8">
          <h2 className="text-lg font-bold">Société de livraison</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {quotes.map((quote) => (
              <button type="button" key={quote.company} onClick={() => setDeliveryCompany(quote.company)} className={`focus-ring rounded-2xl border p-4 text-left ${deliveryCompany === quote.company ? "border-gold-500 bg-gold-100/40" : "border-forest-900/12 bg-white"}`}>
                <span className="block font-bold">{quote.label}</span>
                <span className="text-sm text-forest-900/62">{quote.eta} · {quote.fee === 0 ? "Gratuit" : formatTnd(quote.fee)}</span>
              </button>
            ))}
          </div>
        </div>
        </fieldset>
        {error && <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
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
          <div className="flex justify-between"><span>{selectedQuote.label}</span><span>{deliveryFee === 0 ? "Offerte" : formatTnd(deliveryFee)}</span></div>
          <div className="flex justify-between text-xl font-bold"><span>Total</span><span>{formatTnd(total)}</span></div>
        </div>
        <Button disabled={!checkoutAvailable || items.length === 0 || loading} className="mt-6 w-full bg-gold-300 text-forest-950 hover:bg-gold-100">
          {loading && <Loader2 className="animate-spin" size={18} />}
          Confirmer la commande
        </Button>
      </aside>
    </form>
  );
}
