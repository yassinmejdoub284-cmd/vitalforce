"use client";

import { useEffect, useRef, useState } from "react";
import { normalizeTunisianPhone } from "@/lib/tunisia";
import type { DraftItem } from "@/lib/db/schema";

export function CallbackOption({ items, lang, angle = "" }: { items: DraftItem[]; lang: "fr" | "ar"; angle?: string }) {
  const checkbox = useRef<HTMLInputElement>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const revision = useRef(0);
  const previous = useRef("");
  const [status, setStatus] = useState("");
  const itemsJson = JSON.stringify(items);
  const ar = lang === "ar";

  useEffect(() => {
    const control = checkbox.current;
    const form = control?.form;
    const field = hidden.current;
    if (!form || !control || !field) return;
    let timer: ReturnType<typeof setTimeout>;
    function save() {
      if (!form || !control || !field) return;
      clearTimeout(timer);
      const data = new FormData(form);
      const phone = normalizeTunisianPhone(String(data.get("phone") || ""));
      const details = Object.fromEntries(["customerName", "governorate", "city", "address", "website"].map(name => [name, String(data.get(name) || "")]));
      const consent = control.checked && Boolean(phone);
      if (!consent && !field.value) return;
      const payload = consent ? { consent, phone, ...details, angle, items: JSON.parse(itemsJson) } : { consent };
      const signature = JSON.stringify(payload);
      if (signature === previous.current) return;
      previous.current = signature;
      field.value ||= crypto.randomUUID();
      const id = field.value;
      const version = ++revision.current;
      const body = JSON.stringify({ ...payload, id, revision: version });
      if (!consent) { field.value = ""; previous.current = ""; }
      void fetch("/api/callbacks", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).then(response => {
        if (!response.ok) throw new Error();
        if (version === revision.current) setStatus(consent ? (ar ? "وصلنا طلب المكالمة." : "Demande de rappel enregistrée.") : "");
      }).catch(() => {
        if (version !== revision.current) return;
        previous.current = "";
        if (!consent && !field.value) field.value = id;
        setStatus(ar ? "التسجيل ما تمّش. عاود المحاولة." : "Enregistrement impossible. Réessayez.");
      });
    }
    function schedule(event: Event) {
      clearTimeout(timer);
      if (event.target === control) save();
      else timer = setTimeout(save, 350);
    }
    save();
    form.addEventListener("input", schedule);
    form.addEventListener("focusout", save);
    form.addEventListener("submit", save, true);
    window.addEventListener("pagehide", save);
    return () => {
      clearTimeout(timer);
      form.removeEventListener("input", schedule);
      form.removeEventListener("focusout", save);
      form.removeEventListener("submit", save, true);
      window.removeEventListener("pagehide", save);
    };
  }, [angle, ar, itemsJson]);

  return <div data-wide="true" className="callback-option">
    <input type="hidden" name="draftId" ref={hidden} />
    <label><input ref={checkbox} type="checkbox" /> {ar ? "احفظ رقمي ومعلومات الطلب وكلّمني إذا ما كمّلتش." : "Enregistrer mes coordonnées et me rappeler si je ne termine pas ma commande."}</label>
    <small role="status" aria-live="polite">{status}</small>
  </div>;
}
