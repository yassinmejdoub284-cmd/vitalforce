"use client";

import { trackMetaEvent } from "@/lib/meta";
import { governorates, normalizeTunisianPhone } from "@/lib/tunisia";
import { orderContext, track } from "@/lib/visitor";

type Lang = "fr" | "ar";

const labels = {
  fr: { name: "Nom et prénom", phone: "Téléphone", phoneHint: "8 chiffres, ex: 22 123 456", governorate: "Gouvernorat", choose: "Choisissez…", city: "Ville / délégation", address: "Adresse complète", addressHint: "Rue, numéro, quartier, un repère", email: "Email", optional: "(facultatif)", note: "Remarque", phoneError: "Entrez un numéro tunisien valide (8 chiffres)." },
  ar: { name: "الاسم واللقب", phone: "رقم الهاتف", phoneHint: "8 أرقام، مثال: 22 123 456", governorate: "الولاية", choose: "اختار…", city: "المدينة / المعتمدية", address: "العنوان الكامل", addressHint: "النهج، الرقم، الحي، علامة قريبة", email: "البريد الإلكتروني", optional: "(اختياري)", note: "ملاحظة", phoneError: "اكتب رقم تونسي صحيح (8 أرقام)." }
};

/** Champs client communs aux formulaires de commande (boutique en français, pages de vente en arabe). */
export function CustomerFields({ lang, className, inputClassName, showNote = false }: { lang: Lang; className?: string; inputClassName?: string; showNote?: boolean }) {
  const t = labels[lang];
  const input = inputClassName ?? "";
  return <div className={className}>
    <label>{t.name}<input className={input} name="customerName" required minLength={3} maxLength={80} autoComplete="name" /></label>
    <label>{t.phone}<input className={input} name="phone" required type="tel" inputMode="tel" autoComplete="tel-national" placeholder={t.phoneHint} dir="ltr"
      onInvalid={(event) => event.currentTarget.setCustomValidity(t.phoneError)}
      onInput={(event) => event.currentTarget.setCustomValidity("")}
      onBlur={(event) => { const value = event.currentTarget.value; event.currentTarget.setCustomValidity(value && !normalizeTunisianPhone(value) ? t.phoneError : ""); }} /></label>
    <label>{t.governorate}<select className={input} name="governorate" required defaultValue="">
      <option value="" disabled>{t.choose}</option>
      {governorates.map((item) => <option key={item.value} value={item.value}>{lang === "ar" ? `${item.ar} · ${item.value}` : item.value}</option>)}
    </select></label>
    <label>{t.city}<input className={input} name="city" required minLength={2} maxLength={80} autoComplete="address-level2" /></label>
    <label data-wide="true">{t.address}<input className={input} name="address" required minLength={8} maxLength={250} autoComplete="street-address" placeholder={t.addressHint} /></label>
    <label>{t.email} <small>{t.optional}</small><input className={input} name="email" type="email" autoComplete="email" dir="ltr" /></label>
    {showNote && <label data-wide="true">{t.note} <small>{t.optional}</small><input className={input} name="note" maxLength={500} /></label>}
    <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)", opacity: 0, pointerEvents: "none" }} />
  </div>;
}

export type PlacedOrder = { number: string; total: number; subtotal: number; deliveryFee: number; items: { productId: string; quantity: number; unitPrice: number; name: string }[] };

/** Envoie la commande au serveur et déclenche les événements de mesure (pixel + interne). */
export async function submitOrder(form: HTMLFormElement, items: { productId: string; quantity: number }[], options: { angle?: string; lang: Lang }): Promise<PlacedOrder> {
  const data = new FormData(form);
  const phone = normalizeTunisianPhone(String(data.get("phone") ?? ""));
  if (!phone) throw new Error(labels[options.lang].phoneError);
  const payload = {
    customerName: data.get("customerName"), phone, email: data.get("email") ?? "", governorate: data.get("governorate"), city: data.get("city"), address: data.get("address"),
    note: data.get("note") ?? undefined, website: data.get("website") ?? "", items, source: options.angle ? "landing" : "site", ...orderContext(options.angle)
  };
  let response: Response;
  try {
    response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  } catch {
    throw new Error(options.lang === "ar" ? "الاتصال انقطع. عاود جرّب." : "Connexion interrompue. Réessayez.");
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? (options.lang === "ar" ? "ما نجمناش نسجّلو الطلب." : "La commande n'a pas pu être enregistrée."));
  const order = body.order as PlacedOrder;
  const params = { currency: "TND", value: order.total, content_type: "product", content_ids: order.items.map((item) => item.productId), num_items: order.items.reduce((sum, item) => sum + item.quantity, 0), order_id: order.number };
  // Purchase immédiat seulement si l'admin l'a choisi; sinon le serveur l'envoie à la confirmation.
  if (body.purchaseOn === "order") trackMetaEvent("Purchase", params, body.eventId);
  else trackMetaEvent("Lead", params, `lead-${order.number}`);
  track("purchase", { angle: options.angle, value: order.total });
  return order;
}

/** À appeler une fois quand le visiteur commence à remplir le formulaire. */
export function trackCheckoutStart(value: number, contentIds: string[], angle?: string) {
  trackMetaEvent("InitiateCheckout", { currency: "TND", value, content_ids: contentIds, content_type: "product", landing_angle: angle });
  track("initiate_checkout", { angle, value });
}
