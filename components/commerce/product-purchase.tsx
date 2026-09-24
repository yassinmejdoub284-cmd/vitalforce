"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, HandCoins, Loader2, MessageCircle, Minus, Plus, RotateCcw, ShieldCheck, Truck } from "lucide-react";
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
  const whatsAppMessage = encodeURIComponent(`Bonjour VITAL FORCE, je souhaite commander ${quantity} pot(s) goût ${product.flavor} à ${product.price} DT.`);

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

  return <section className="container-shell product-commerce-shell">
    <div className="product-visual-column">
      <div className="product-main-visual">
        <ProductJar flavor={product.flavor} large />
        <span className="product-visual-badge">400 g</span>
      </div>
      <div className="product-viewer-link">
        <span>Étiquette du goût {product.flavor.toLowerCase()}</span>
        <Link href={`/viewer?slug=${product.slug}`} className="inline-flex items-center gap-2 font-semibold text-forest-900"><RotateCcw size={16} /> Vue 3D</Link>
      </div>
      <div className="product-assurance-row">
        <div><Truck size={20}/><span><strong>Livraison Tunisie</strong><small>24–72 h selon la ville</small></span></div>
        <div><HandCoins size={20}/><span><strong>Paiement à la livraison</strong><small>Simple et pratique</small></span></div>
      </div>
    </div>
    <form action={submit} className="product-buy-panel">
      <p className="shop-kicker">VITAL FORCE / 400 G</p>
      <h1>VITAL FORCE <span>{product.flavor}</span></h1>
      <p className="product-lead">Mélange botanique aux sept ingrédients de la formule.</p>
      <div className="product-rating-line"><span><Check size={14}/> Disponible</span><i/> <span>Livraison en Tunisie</span></div>
      <div className="product-price-line"><strong>{formatTnd(product.price)}</strong>{product.compareAtPrice && <del>{formatTnd(product.compareAtPrice)}</del>}<small>Prix du pot · 400 g</small></div>

      <fieldset className="product-option-group">
        <legend className="text-sm font-bold">Goût</legend>
        <div className="product-flavors">
          {variants.map((variant) => <button key={variant.id} type="button" onClick={() => selectFlavor(variant)} aria-pressed={product.id === variant.id} className="focus-ring">
            <span aria-hidden="true" className={`h-4 w-4 rounded-full border border-black/10 ${variant.flavor === "Menthe" ? "bg-[#91c4a9]" : variant.flavor === "Citron" ? "bg-[#e3cf75]" : "bg-[#e2ae63]"}`} />{variant.flavor}
          </button>)}
        </div>
      </fieldset>

      <fieldset className="product-option-group">
        <legend className="text-sm font-bold">Quantité</legend>
        <div className="mt-3 inline-flex h-12 items-center border border-forest-900/15 bg-white">
          <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1} className="focus-ring grid h-12 w-12 place-items-center disabled:opacity-35" aria-label="Diminuer la quantité"><Minus size={17} /></button>
          <output className="min-w-9 text-center font-bold">{quantity}</output>
          <button type="button" onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))} disabled={quantity >= product.stock} className="focus-ring grid h-12 w-12 place-items-center disabled:opacity-35" aria-label="Augmenter la quantité"><Plus size={17} /></button>
        </div>
        {product.stock < 1 && <p className="mt-2 text-sm font-semibold text-red-700">Indisponible pour le moment.</p>}
      </fieldset>

      <fieldset disabled={!checkoutAvailable} className={`product-customer-fields ${checkoutAvailable ? "" : "hidden"}`}>
        <legend className="text-lg font-bold">Vos coordonnées</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold">Nom complet<input name="customerName" required minLength={3} autoComplete="name" className="min-h-11 border border-forest-900/15 bg-white px-3" /></label>
          <label className="grid gap-1.5 text-sm font-semibold">Téléphone<input name="phone" required minLength={8} type="tel" autoComplete="tel" placeholder="+216 ..." className="min-h-11 border border-forest-900/15 bg-white px-3" /></label>
          <label className="grid gap-1.5 text-sm font-semibold">Ville<input name="city" required minLength={2} autoComplete="address-level2" className="min-h-11 border border-forest-900/15 bg-white px-3" /></label>
          <label className="grid gap-1.5 text-sm font-semibold">Adresse<input name="address" required minLength={8} autoComplete="street-address" className="min-h-11 border border-forest-900/15 bg-white px-3" /></label>
        </div>
        <label className="mt-3 grid gap-1.5 text-sm font-semibold">Note <span className="font-normal text-forest-900/55">(facultatif)</span><textarea name="note" rows={2} className="border border-forest-900/15 bg-white px-3 py-2" /></label>
      </fieldset>

      <div className={`product-delivery-controls ${checkoutAvailable ? "" : "hidden"}`}>
        <label className="grid gap-2 text-sm font-bold">Livraison
          <select disabled={!checkoutAvailable} value={deliveryCompany} onChange={(event) => setDeliveryCompany(event.target.value as DeliveryCompany)} className="min-h-11 border border-forest-900/15 bg-white px-3 text-sm font-normal disabled:opacity-55">
            {quotes.map((item) => <option key={item.company} value={item.company}>{item.label} · {item.fee === 0 ? "Offerte" : formatTnd(item.fee)}</option>)}
          </select>
        </label>
        <p className="mt-2 text-xs text-forest-900/60">{quote.eta}</p>
        <p className="mt-4 flex items-center gap-2 text-sm"><HandCoins size={18} /> Paiement à la livraison</p>
      </div>

      <div className="product-order-summary">
        <div className="flex justify-between"><span>{quantity} × {product.flavor}</span><span>{formatTnd(subtotal)}</span></div>
        <div className="mt-2 flex justify-between"><span>Livraison</span><span>{quote.fee === 0 ? "Offerte" : formatTnd(quote.fee)}</span></div>
        <div className="mt-4 flex justify-between text-xl font-bold"><span>Total</span><span>{formatTnd(total)}</span></div>
      </div>
      {!checkoutAvailable && <div className="whatsapp-order-box" role="status"><MessageCircle size={22}/><div><strong>Commandez directement sur WhatsApp</strong><p>Votre goût et votre quantité sont ajoutés automatiquement au message.</p></div><a href={`https://wa.me/21627200603?text=${whatsAppMessage}`} target="_blank" rel="noopener noreferrer">Continuer sur WhatsApp</a></div>}
      {error && <p role="alert" className="mt-4 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      {checkoutAvailable && <Button disabled={loading || product.stock < 1} className="product-submit">{loading && <Loader2 size={18} className="animate-spin" />} Confirmer la commande</Button>}
      <div className="product-secure-note"><ShieldCheck size={17}/><span>Vos informations servent uniquement au traitement de votre commande.</span></div>
      <p className="product-disclaimer">Complément alimentaire. Ne remplace pas une alimentation variée et équilibrée.</p>
    </form>
  </section>;
}
