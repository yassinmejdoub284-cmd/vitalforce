"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, Loader2, MessageCircle, Minus, Plus, ShoppingBag } from "lucide-react";
import { ProductJar } from "@/components/commerce/product-jar";
import { CustomerFields, submitOrder, trackCheckoutStart, type PlacedOrder } from "@/components/commerce/order-fields";
import { DiscountBadge } from "@/components/commerce/discount-badge";
import { useStoreSettings, whatsappHref } from "@/components/store-settings";
import { formatOfferPrice } from "@/lib/utils";
import { deliveryFeeFor } from "@/lib/pricing";
import { trackMetaEvent } from "@/lib/meta";
import { track } from "@/lib/visitor";
import type { Product } from "@/lib/product-data";

const flavors: Record<string, string> = { Orange: "برتقال", Citron: "ليمون", Menthe: "نعناع" };
const flavorName = (product: Product) => flavors[product.flavor] || product.flavor || product.name;
const money = (amount: number) => `${new Intl.NumberFormat("fr-TN", { numberingSystem: "latn", maximumFractionDigits: 3 }).format(amount)} د.ت`;

export function LandingOrder({ angle, angleName, products, ordersLive = true }: { angle: string; angleName: string; products: Product[]; ordersLive?: boolean }) {
  const { store, delivery } = useStoreSettings();
  const available = products.filter((product) => product.stock > 0);
  const [selected, setSelected] = useState(available[0] ?? products[0]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const started = useRef(false);
  const viewed = useRef(false);

  useEffect(() => {
    const first = products[0];
    if (!first) return;
    // Vue de la page de vente: pixel (dès qu'il est chargé) + mesure interne, une seule fois par page.
    const send = () => {
      if (!window.fbq || viewed.current) return;
      viewed.current = true;
      trackMetaEvent("ViewContent", { content_name: `landing_${angle}`, content_ids: products.map((product) => product.id), content_type: "product", currency: "TND", value: first.price, landing_angle: angle });
    };
    track("view_content", { angle, value: first.price });
    send();
    window.addEventListener("vital-meta-ready", send);
    return () => window.removeEventListener("vital-meta-ready", send);
  }, [angle, products]);

  if (!selected) return null;
  const subtotal = selected.price * quantity;
  const deliveryFee = deliveryFeeFor(subtotal, delivery);
  const total = subtotal + deliveryFee;
  const maxQuantity = Math.max(1, Math.min(10, selected.stock));

  function start() {
    if (started.current) return;
    started.current = true;
    trackCheckoutStart(total, [selected.id], angle);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    if (!ordersLive) {
      // Base de données pas encore configurée: la commande part sur WhatsApp, comme avant.
      const data = new FormData(event.currentTarget);
      const details = [["الاسم", "customerName"], ["الهاتف", "phone"], ["الولاية", "governorate"], ["المدينة", "city"], ["العنوان", "address"]]
        .map(([label, key]) => `${label}: ${String(data.get(key) ?? "").trim()}`);
      trackMetaEvent("InitiateCheckout", { content_ids: [selected.id], content_type: "product", currency: "TND", value: total, num_items: quantity, landing_angle: angle });
      window.location.assign(whatsappHref(store.whatsapp || "21627200603", `${whatsappText}
المجموع: ${money(total)}
${details.join("\n")}`));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const order = await submitOrder(event.currentTarget, [{ productId: selected.id, quantity }], { angle, lang: "ar" });
      setPlaced(order);
      window.setTimeout(() => document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const whatsappText = `السلام عليكم، نحب نطلب VITAL FORCE\nالنكهة: ${flavorName(selected)}\nالكمية: ${quantity}\nصفحة: ${angle}`;

  if (placed) return <section className="lp-order-section" id="order"><div className="lp-shell">
    <div className="lp-order-form" role="status" style={{ textAlign: "center" }}>
      <CheckCircle2 size={54} style={{ margin: "0 auto", color: "#678747" }} />
      <h3>شكراً! طلبك وصل.</h3>
      <p style={{ fontSize: 15 }}>رقم الطلب: <strong dir="ltr">{placed.number}</strong></p>
      <div className="lp-final-total" style={{ marginTop: 18 }}><span>المبلغ عند الاستلام</span><strong>{money(placed.total)}</strong></div>
      <p className="lp-order-next" style={{ marginTop: 14 }}>فريقنا باش يتّصل بيك على الهاتف باش يأكّد الطلب والعنوان. خلّي تليفونك قريب منك. التوصيل {delivery.etaAr}، والدفع عند الاستلام.</p>
      {store.whatsapp && <a className="lp-whatsapp" style={{ marginTop: 18 }} href={whatsappHref(store.whatsapp, `السلام عليكم، عملت الطلب ${placed.number}`)} target="_blank" rel="noopener noreferrer"><MessageCircle size={20} /> تحب تحكي معانا على واتساب؟</a>}
    </div>
  </div></section>;

  return <section className="lp-order-section" id="order"><div className="lp-shell lp-order-grid">
    <div className="lp-order-product"><p className="lp-kicker">ابدأ بطعمك المفضّل</p><h2>روتينك.<br /><em>نكهتك. اختيارك.</em></h2><div className="lp-order-jar"><ProductJar flavor={selected.flavor} image={selected.image} name={selected.name} large /></div><span className="lp-order-weight">{selected.netWeight || "400 غ"}{selected.template === "vital-force" ? " / 7 مكوّنات نباتية" : ""}</span>{selected.template === "vital-force" && <details className="lp-label"><summary>شوف الملصق الكامل · {flavorName(selected)}</summary><Image src={selected.image} alt={`ملصق VITAL FORCE ${flavorName(selected)}`} width={1200} height={400} sizes="(max-width: 800px) 100vw, 50vw" /></details>}</div>
    <form className="lp-order-form" onSubmit={submit} onFocusCapture={start}>
      <span className="lp-order-context">{angleName}</span><h3>نحضّرولك طلبك.</h3><p>عمّر المعلومات، وفريقنا يتّصل بيك باش يأكّد. الدفع عند الاستلام.</p>
      <p className="lp-order-promotion">{selected.compareAtPrice && <del className="offer-original-price" dir="ltr">{formatOfferPrice(selected.compareAtPrice)}</del>}<DiscountBadge percent={selected.discountPercent} lang="ar" /> <span>{formatOfferPrice(selected.price)}{selected.discountPercent ? " بعد التخفيض" : ""} / عبوة</span></p>
      {products.length > 1 && <fieldset><legend>1. اختار النكهة</legend><div className="lp-flavor-buttons">{products.map(product => <button key={product.id} type="button" disabled={product.stock < 1} aria-pressed={product.id === selected.id} onClick={() => { setSelected(product); setQuantity(1); }}><span className={`lp-flavor-dot lp-flavor-${product.flavor.toLowerCase()}`} />{flavorName(product)}{product.stock < 1 ? " (نفذ)" : ""}{product.id === selected.id && <Check size={14} />}</button>)}</div></fieldset>}
      <fieldset><legend>{products.length > 1 ? "2." : "1."} حدّد الكمية</legend><div className="lp-quantity-row"><div className="lp-quantity"><button type="button" disabled={quantity <= 1} onClick={() => setQuantity(value => value - 1)} aria-label="نقص الكمية"><Minus size={17} /></button><output aria-live="polite">{quantity}</output><button type="button" disabled={quantity >= maxQuantity} onClick={() => setQuantity(value => value + 1)} aria-label="زيد الكمية"><Plus size={17} /></button></div><span>{money(selected.price)} / عبوة</span></div></fieldset>
      <fieldset><legend>{products.length > 1 ? "3." : "2."} معلومات التوصيل</legend>
        <CustomerFields lang="ar" className="lp-fields lp-fields-order" />
      </fieldset>
      <div className="lp-order-total"><span>مجموع المنتجات</span><strong>{money(subtotal)}</strong></div><div className="lp-shipping-row"><span>التوصيل</span><strong>{deliveryFee === 0 ? "مجاني" : money(deliveryFee)}</strong></div>
      <div className="lp-final-total" aria-live="polite"><span>المجموع عند الاستلام</span><strong>{money(total)}</strong></div>
      <p className="lp-delivery-note">{delivery.included ? "التوصيل مجاني لكل تونس." : delivery.freeThreshold > 0 ? `التوصيل ${money(delivery.fee)}، ومجاني من ${money(delivery.freeThreshold)}.` : `التوصيل ${money(delivery.fee)} للطلب.`} {delivery.etaAr}.</p>
      {error && <p className="lp-order-status" role="alert" style={{ background: "#fdecea", borderColor: "#b42318" }}>{error}</p>}
      <button type="submit" className="lp-whatsapp" disabled={loading || !store.ordersEnabled}>{loading ? <Loader2 size={21} className="animate-spin" /> : <ShoppingBag size={21} />} {!store.ordersEnabled ? "الطلبات مسكّرة مؤقتاً" : ordersLive ? "أكّد طلبي" : "نكمّل طلبي على واتساب"}</button>
      <p className="lp-order-next">{ordersLive ? "بعد ما تبعث الطلب، فريقنا يتّصل بيك باش يأكّد. ما تدفع كان كي يوصلك الطلب." : "تفتح رسالة جاهزة على واتساب، تبعثها، وفريقنا يأكّد معاك. الدفع عند الاستلام."}</p>
      {store.whatsapp && <p className="lp-order-privacy">تحب تطلب بالواتساب؟ <a href={whatsappHref(store.whatsapp, whatsappText)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>ابعثلنا رسالة</a></p>}
    </form>
  </div></section>;
}
