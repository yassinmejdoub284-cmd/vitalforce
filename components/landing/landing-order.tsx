"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Check, MessageCircle, Minus, Plus } from "lucide-react";
import { ProductJar } from "@/components/commerce/product-jar";
import { buildWhatsAppOrder, readCampaign, type CampaignAttribution } from "@/lib/landing-attribution";
import { products } from "@/lib/product-data";

const flavors: Record<string, string> = { Orange: "برتقال", Citron: "ليمون", Menthe: "نعناع" };
const money = (amount: number) => `${new Intl.NumberFormat("ar-TN", { maximumFractionDigits: 3 }).format(amount)} د.ت`;

export function LandingOrder({ angle, angleName }: { angle: string; angleName: string }) {
  const [selected, setSelected] = useState(products[0]);
  const [quantity, setQuantity] = useState(1);
  const [campaign, setCampaign] = useState<CampaignAttribution>({});
  const [opened, setOpened] = useState(false);
  const tracked = useRef(new Set<string>());

  useEffect(() => {
    const current = readCampaign(window.location.search);
    setCampaign(current);
    // Attribution contains campaign tags only, never the customer's contact details.
    function sendViewContent() {
      if (!window.fbq || tracked.current.has(angle)) return;
      window.fbq("track", "ViewContent", { content_name: `landing_${angle}`, content_ids: products.map(product => product.id), content_type: "product", currency: "TND", value: products[0].price, landing_angle: angle });
      tracked.current.add(angle);
    }
    sendViewContent();
    window.addEventListener("vital-meta-ready", sendViewContent);
    return () => window.removeEventListener("vital-meta-ready", sendViewContent);
  }, [angle]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const url = buildWhatsAppOrder({
      angle, flavor: flavors[selected.flavor], quantity, unitPrice: selected.price, campaign,
      name: String(data.get("name") ?? "").slice(0, 80),
      phone: String(data.get("phone") ?? "").slice(0, 24),
      city: String(data.get("city") ?? "").slice(0, 80)
    });
    window.fbq?.("track", "InitiateCheckout", { content_ids: [selected.id], content_type: "product", currency: "TND", value: selected.price * quantity, num_items: quantity, landing_angle: angle });
    window.fbq?.("trackCustom", "WhatsAppOrderIntent", { landing_angle: angle, flavor: selected.flavor, quantity, ...campaign });
    // This is an intent event, never a Purchase: WhatsApp opening is not a confirmed sale.
    setOpened(true);
    window.location.assign(url);
  }

  return <section className="lp-order-section" id="order"><div className="lp-shell lp-order-grid">
    <div className="lp-order-product"><p className="lp-kicker">ابدأ بطعمك المفضّل</p><h2>روتينك.<br /><em>نكهتك. اختيارك.</em></h2><div className="lp-order-jar"><ProductJar flavor={selected.flavor} large /></div><span className="lp-order-weight">٤٠٠ غ / ٧ مكوّنات نباتية</span><details className="lp-label"><summary>شوف الملصق الكامل · {flavors[selected.flavor]}</summary><Image src={selected.image} alt={`ملصق VITAL FORCE ${flavors[selected.flavor]}`} width={1200} height={400} sizes="(max-width: 800px) 100vw, 50vw" /></details></div>
    <form className="lp-order-form" onSubmit={submit}>
      <span className="lp-order-context">{angleName}</span><h3>نحضّرولك طلبك.</h3><p>اختار، افتح الرسالة وأرسلها على واتساب.</p>
      <fieldset><legend>١. اختار النكهة</legend><div className="lp-flavor-buttons">{products.map(product => <button key={product.id} type="button" aria-pressed={product.id === selected.id} onClick={() => { setSelected(product); setOpened(false); }}><span className={`lp-flavor-dot lp-flavor-${product.flavor.toLowerCase()}`} />{flavors[product.flavor]}{product.id === selected.id && <Check size={14} />}</button>)}</div></fieldset>
      <fieldset><legend>٢. حدّد الكمية</legend><div className="lp-quantity-row"><div className="lp-quantity"><button type="button" disabled={quantity <= 1} onClick={() => setQuantity(value => value - 1)} aria-label="نقص الكمية"><Minus size={17} /></button><output aria-live="polite">{quantity}</output><button type="button" disabled={quantity >= 10} onClick={() => setQuantity(value => value + 1)} aria-label="زيد الكمية"><Plus size={17} /></button></div><span>{money(selected.price)} / عبوة</span></div></fieldset>
      <fieldset><legend>٣. معلوماتك <small>(اختيارية لتجهيز الرسالة)</small></legend><div className="lp-fields"><label>الاسم<input name="name" maxLength={80} autoComplete="name" placeholder="اسمك" /></label><label>الهاتف<input name="phone" type="tel" dir="ltr" maxLength={24} autoComplete="tel" placeholder="+216" /></label><label className="lp-field-full">المدينة<input name="city" maxLength={80} autoComplete="address-level2" placeholder="وين تحبّ يوصلك الطلب؟" /></label></div></fieldset>
      <div className="lp-order-total"><span>مجموع المنتجات</span><strong>{money(selected.price * quantity)}</strong></div><p className="lp-delivery-note">مصاريف التوصيل والتوفر يتأكّدوا مع الفريق قبل تثبيت الطلب.</p>
      <button type="submit" className="lp-whatsapp"><MessageCircle size={21} /> نكمّل طلبي على واتساب</button>
      <p className="lp-order-privacy">المعلومات تُضاف إلى رسالة واتساب فقط. لا يتمّ إرسالها قبل أن تضغط «إرسال» داخل واتساب.</p>
      {opened && <p className="lp-order-status" role="status">تمّ تجهيز رسالتك. أرسلها داخل واتساب لتتواصل مع الفريق؛ طلبك لم يُؤكّد بعد.</p>}
    </form>
  </div></section>;
}
