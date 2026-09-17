"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { HandCoins, Loader2, Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductJar } from "@/components/commerce/product-jar";
import { Button } from "@/components/ui/button";
import { getDeliveryQuotes, type DeliveryCompany, type DeliverySettings } from "@/lib/delivery";
import { trackMetaEvent } from "@/lib/meta";
import type { Product } from "@/lib/product-data";
import { formatTnd } from "@/lib/utils";

export function ProductPurchase({ initialProduct, variants, checkoutAvailable }: { initialProduct: Product; variants: Product[]; checkoutAvailable: boolean }) {
  const router = useRouter();
  const [product, setProduct] = useState(initialProduct);
  const [quantity, setQuantity] = useState(1);
  const [deliveryCompany, setDeliveryCompany] = useState<DeliveryCompany>("local_courier");
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>({ deliveryFee: 7, freeShippingThreshold: 180 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const subtotal = product.price * quantity;
  const quotes = getDeliveryQuotes(subtotal, deliverySettings);
  const quote = quotes.find((item) => item.company === deliveryCompany) ?? quotes[0];
  const total = subtotal + quote.fee;

  useEffect(() => {
    fetch("/api/settings").then((response) => response.json()).then((data) => {
      if (data.settings) setDeliverySettings(data.settings);
    }).catch(() => {});
  }, []);

  function selectFlavor(variant: Product) {
    setProduct(variant);
    setQuantity(1);
    router.push(`/products/${variant.slug}`, { scroll: false });
  }

  async function submit(formData: FormData) {
    if (loading || !checkoutAvailable) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: String(formData.get("customerName") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          city: String(formData.get("city") ?? ""),
          address: String(formData.get("address") ?? ""),
          note: String(formData.get("note") ?? ""),
          email: "",
          paymentMethod: "cod",
          deliveryCompany,
          items: [{ productId: product.id, name: product.name, price: product.price, quantity }]
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "La commande n'a pas pu être enregistrée.");
        return;
      }
      trackMetaEvent("Purchase", {
        currency: "TND",
        value: data.order.total,
        content_ids: [product.id],
        num_items: quantity
      });
      router.push(`/confirmation?order=${data.order.number}`);
    } catch {
      setError("Connexion interrompue. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  }

  return <section className="container-shell grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,.9fr)] lg:gap-14 lg:py-12">
    <div className="min-w-0">
      <div className="grid min-h-[370px] place-items-center bg-[#f0f0ef] md:min-h-[590px]">
        <ProductJar flavor={product.flavor} large />
      </div>
      <div className="mt-3 flex items-center justify-between gap-4 text-xs text-forest-900/65">
        <span>{product.flavor === "Citron" ? "Maquette illustrative du goût citron" : "Étiquette du goût " + product.flavor.toLowerCase()}</span>
        <Link href={`/viewer?slug=${product.slug}`} className="inline-flex items-center gap-2 font-semibold text-forest-900"><RotateCcw size={16} /> Vue 3D</Link>
      </div>
    </div>
    <form action={submit} className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-gold-700">VITAL FORCE / 400 g</p>
      <h1 className="mt-3 font-display text-4xl leading-tight">VITAL FORCE <span className="whitespace-nowrap">{product.flavor}</span></h1>
      <p className="mt-3 text-sm text-forest-900/65">Sept ingrédients botaniques · complément alimentaire</p>
      <p className="mt-5 text-3xl font-bold">{formatTnd(product.price)}</p>

      <fieldset className="mt-8">
        <legend className="text-sm font-bold">Goût</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {variants.map((variant) => <button key={variant.id} type="button" onClick={() => selectFlavor(variant)} aria-pressed={product.id === variant.id} className={`focus-ring inline-flex min-h-12 items-center gap-2 border px-4 text-sm font-semibold ${product.id === variant.id ? "border-forest-950 bg-white" : "border-forest-900/15 bg-white/60"}`}>
            <span aria-hidden="true" className={`h-4 w-4 rounded-full border border-black/10 ${variant.flavor === "Menthe" ? "bg-[#91c4a9]" : variant.flavor === "Citron" ? "bg-[#e3cf75]" : "bg-[#e2ae63]"}`} />{variant.flavor}
          </button>)}
        </div>
      </fieldset>

      <fieldset className="mt-7">
        <legend className="text-sm font-bold">Quantité</legend>
        <div className="mt-3 inline-flex h-12 items-center border border-forest-900/15 bg-white">
          <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1} className="focus-ring grid h-12 w-12 place-items-center disabled:opacity-35" aria-label="Diminuer la quantité"><Minus size={17} /></button>
          <output className="min-w-9 text-center font-bold">{quantity}</output>
          <button type="button" onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))} disabled={quantity >= product.stock} className="focus-ring grid h-12 w-12 place-items-center disabled:opacity-35" aria-label="Augmenter la quantité"><Plus size={17} /></button>
        </div>
        {product.stock < 1 && <p className="mt-2 text-sm font-semibold text-red-700">Indisponible pour le moment.</p>}
      </fieldset>

      <fieldset disabled={!checkoutAvailable} className="mt-8 border-t border-forest-900/10 pt-7 disabled:opacity-55">
        <legend className="text-lg font-bold">Vos coordonnées</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold">Nom complet<input name="customerName" required minLength={3} autoComplete="name" className="min-h-11 border border-forest-900/15 bg-white px-3" /></label>
          <label className="grid gap-1.5 text-sm font-semibold">Téléphone<input name="phone" required minLength={8} type="tel" autoComplete="tel" placeholder="+216 ..." className="min-h-11 border border-forest-900/15 bg-white px-3" /></label>
          <label className="grid gap-1.5 text-sm font-semibold">Ville<input name="city" required minLength={2} autoComplete="address-level2" className="min-h-11 border border-forest-900/15 bg-white px-3" /></label>
          <label className="grid gap-1.5 text-sm font-semibold">Adresse<input name="address" required minLength={8} autoComplete="street-address" className="min-h-11 border border-forest-900/15 bg-white px-3" /></label>
        </div>
        <label className="mt-3 grid gap-1.5 text-sm font-semibold">Note <span className="font-normal text-forest-900/55">(facultatif)</span><textarea name="note" rows={2} className="border border-forest-900/15 bg-white px-3 py-2" /></label>
      </fieldset>

      <div className="mt-7 border-t border-forest-900/10 pt-6">
        <label className="grid gap-2 text-sm font-bold">Livraison
          <select disabled={!checkoutAvailable} value={deliveryCompany} onChange={(event) => setDeliveryCompany(event.target.value as DeliveryCompany)} className="min-h-11 border border-forest-900/15 bg-white px-3 text-sm font-normal disabled:opacity-55">
            {quotes.map((item) => <option key={item.company} value={item.company}>{item.label} · {item.fee === 0 ? "Offerte" : formatTnd(item.fee)}</option>)}
          </select>
        </label>
        <p className="mt-2 text-xs text-forest-900/60">{quote.eta}</p>
        <p className="mt-4 flex items-center gap-2 text-sm"><HandCoins size={18} /> Paiement à la livraison</p>
      </div>

      <div className="mt-7 border-t border-forest-900/10 pt-5 text-sm">
        <div className="flex justify-between"><span>{quantity} × {product.flavor}</span><span>{formatTnd(subtotal)}</span></div>
        <div className="mt-2 flex justify-between"><span>Livraison</span><span>{quote.fee === 0 ? "Offerte" : formatTnd(quote.fee)}</span></div>
        <div className="mt-4 flex justify-between text-xl font-bold"><span>Total</span><span>{formatTnd(total)}</span></div>
      </div>
      {!checkoutAvailable && <p role="status" className="mt-5 border-l-4 border-gold-500 bg-gold-100/40 p-4 text-sm leading-6">La commande en ligne est temporairement indisponible. Aucun paiement ni demande n’est enregistré pour le moment.</p>}
      {error && <p role="alert" className="mt-4 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      <Button disabled={!checkoutAvailable || loading || product.stock < 1} className="mt-6 w-full">{loading && <Loader2 size={18} className="animate-spin" />} Confirmer la commande</Button>
      <p className="mt-4 text-xs leading-5 text-forest-900/60">Complément alimentaire. Ne remplace pas une alimentation variée et équilibrée.</p>
    </form>
  </section>;
}
