"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, HandCoins, Loader2, MessageCircle, Minus, Plus, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { useRef, useState } from "react";
import { ProductJar } from "@/components/commerce/product-jar";
import { CustomerFields, submitOrder, trackCheckoutStart } from "@/components/commerce/order-fields";
import { useStoreSettings, whatsappHref } from "@/components/store-settings";
import { Button } from "@/components/ui/button";
import { deliveryFeeFor } from "@/lib/pricing";
import type { Product } from "@/lib/product-data";
import { formatOfferPrice, formatTnd } from "@/lib/utils";
import { DiscountBadge } from "@/components/commerce/discount-badge";

export function ProductPurchase({ initialProduct, variants, checkoutAvailable }: { initialProduct: Product; variants: Product[]; checkoutAvailable: boolean }) {
  const router = useRouter();
  const [product, setProduct] = useState(initialProduct);
  const [quantity, setQuantity] = useState(1);
  const { store, delivery } = useStoreSettings();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(false);
  const subtotal = product.price * quantity;
  const fee = deliveryFeeFor(subtotal, delivery);
  const total = subtotal + fee;
  const whatsAppMessage = `Bonjour VITAL FORCE, je souhaite commander ${quantity} × ${product.name} à ${product.price} DT.`;
  const canOrder = checkoutAvailable && store.ordersEnabled;

  function selectFlavor(variant: Product) {
    setProduct(variant);
    setQuantity(1);
    router.push(`/products/${variant.slug}`, { scroll: false });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || !canOrder) return;
    setLoading(true);
    setError("");
    try {
      const order = await submitOrder(event.currentTarget, [{ productId: product.id, quantity }], { lang: "fr" });
      router.push(`/confirmation?order=${order.number}&total=${order.total}`);
    } catch (failure) {
      setError((failure as Error).message);
      setLoading(false);
    }
  }

  function start() {
    if (started.current) return;
    started.current = true;
    trackCheckoutStart(total, [product.id]);
  }

  return <section className="container-shell product-commerce-shell">
    <div className="product-visual-column">
      <div className="product-main-visual">
        <ProductJar flavor={product.flavor} image={product.image} name={product.name} large />
        <span className="product-visual-badge">400 g</span>
      </div>
      <div className="product-viewer-link">
        {product.template === "vital-force" && <><span>Étiquette du goût {product.flavor.toLowerCase()}</span>
        <Link href={`/viewer?slug=${product.slug}`} className="inline-flex items-center gap-2 font-semibold text-forest-900"><RotateCcw size={16} /> Vue 3D</Link></>}
      </div>
      <div className="product-assurance-row">
        <div><Truck size={20}/><span><strong>{fee === 0 ? "Livraison offerte" : "Livraison Tunisie"}</strong><small>{delivery.eta}</small></span></div>
        <div><HandCoins size={20}/><span><strong>Paiement à la livraison</strong><small>Simple et pratique</small></span></div>
      </div>
    </div>
    <form onSubmit={submit} onFocusCapture={start} className="product-buy-panel">
      {product.template === "vital-force" ? <>
        <p className="shop-kicker">VITAL FORCE / 400 G</p>
        <h1>VITAL FORCE <span>{product.flavor}</span></h1>
        <p className="product-lead">Mélange botanique aux sept ingrédients de la formule.</p>
      </> : <>
        <p className="shop-kicker">{product.netWeight || "VITAL FORCE"}</p>
        <h1>{product.name}</h1>
        <p className="product-lead">{product.shortDescription}</p>
      </>}
      <div className="product-rating-line"><span><Check size={14}/> {product.stock > 0 ? "Disponible" : "Rupture de stock"}</span><i/> <span>Livraison en Tunisie</span></div>
      <div className="product-price-line">{product.compareAtPrice && <del dir="ltr">{formatOfferPrice(product.compareAtPrice)}</del>}<strong dir="ltr">{formatOfferPrice(product.price)}</strong><DiscountBadge percent={product.discountPercent} /><small>{product.discountPercent ? "Prix après réduction" : "Prix"}{product.netWeight ? ` · ${product.netWeight}` : ""}</small></div>

      {variants.length > 1 && <fieldset className="product-option-group">
        <legend className="text-sm font-bold">{product.template === "vital-force" ? "Goût" : "Produit"}</legend>
        <div className="product-flavors">
          {variants.map((variant) => <button key={variant.id} type="button" onClick={() => selectFlavor(variant)} aria-pressed={product.id === variant.id} className="focus-ring">
            <span aria-hidden="true" className={`h-4 w-4 rounded-full border border-black/10 ${variant.flavor === "Menthe" ? "bg-[#91c4a9]" : variant.flavor === "Citron" ? "bg-[#e3cf75]" : "bg-[#e2ae63]"}`} />{variant.flavor || variant.name}
          </button>)}
        </div>
      </fieldset>}

      <fieldset className="product-option-group">
        <legend className="text-sm font-bold">Quantité</legend>
        <div className="mt-3 inline-flex h-12 items-center border border-forest-900/15 bg-white">
          <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1} className="focus-ring grid h-12 w-12 place-items-center disabled:opacity-35" aria-label="Diminuer la quantité"><Minus size={17} /></button>
          <output className="min-w-9 text-center font-bold">{quantity}</output>
          <button type="button" onClick={() => setQuantity((value) => Math.min(product.stock, 20, value + 1))} disabled={quantity >= Math.min(product.stock, 20)} className="focus-ring grid h-12 w-12 place-items-center disabled:opacity-35" aria-label="Augmenter la quantité"><Plus size={17} /></button>
        </div>
        {product.stock < 1 && <p className="mt-2 text-sm font-semibold text-red-700">Indisponible pour le moment.</p>}
      </fieldset>

      <fieldset disabled={!canOrder} className={`product-customer-fields ${canOrder ? "" : "hidden"}`}>
        <legend className="text-lg font-bold">Vos coordonnées</legend>
        <CustomerFields lang="fr" showNote className="product-fields mt-4 grid gap-3 sm:grid-cols-2" inputClassName="min-h-11 w-full border border-forest-900/15 bg-white px-3" />
        <p className="mt-4 flex items-center gap-2 text-sm"><HandCoins size={18} /> Paiement à la livraison · nous vous appelons pour confirmer</p>
      </fieldset>

      <div className="product-order-summary">
        <div className="flex justify-between"><span>{quantity} × {product.flavor}</span><span>{formatTnd(subtotal)}</span></div>
        <div className="mt-2 flex justify-between"><span>Livraison</span><span>{fee === 0 ? "Offerte" : formatTnd(fee)}</span></div>
        <div className="mt-4 flex justify-between text-xl font-bold"><span>Total</span><span>{formatTnd(total)}</span></div>
      </div>
      {!canOrder && store.whatsapp && <div className="whatsapp-order-box" role="status"><MessageCircle size={22}/><div><strong>Commandez directement sur WhatsApp</strong><p>Votre produit et votre quantité sont ajoutés automatiquement au message.</p></div><a href={whatsappHref(store.whatsapp, whatsAppMessage)} target="_blank" rel="noopener noreferrer">Continuer sur WhatsApp</a></div>}
      {error && <p role="alert" className="mt-4 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      {canOrder && <Button disabled={loading || product.stock < 1} className="product-submit">{loading && <Loader2 size={18} className="animate-spin" />} Confirmer la commande</Button>}
      <div className="product-secure-note"><ShieldCheck size={17}/><span>Vos informations servent uniquement au traitement de votre commande.</span></div>
      <p className="product-disclaimer">Complément alimentaire. Ne remplace pas une alimentation variée et équilibrée.</p>
    </form>
  </section>;
}
