"use client";

import { useEffect, useRef, useState } from "react";
import { normalizeTunisianPhone } from "@/lib/tunisia";
import type { DraftItem } from "@/lib/db/schema";

export function CallbackOption({ items, lang, angle = "" }: { items: DraftItem[]; lang: "fr" | "ar"; angle?: string }) {
  const [requested, setRequested] = useState(false);
  const hidden = useRef<HTMLInputElement>(null);
  const revision = useRef(0);
  const previous = useRef("");
  const [status, setStatus] = useState("");
  const itemsJson = JSON.stringify(items);
  const ar = lang === "ar";

  useEffect(() => {
    const field = hidden.current;
    const form = field?.form;
    if (!form || !field) return;
    let timer: ReturnType<typeof setTimeout>;
    function save() {
      if (!form || !field) return;
      clearTimeout(timer);
      const data = new FormData(form);
      const phone = normalizeTunisianPhone(String(data.get("phone") || ""));
      const details = Object.fromEntries(["customerName", "governorate", "city", "address", "website"].map(name => [name, String(data.get(name) || "")]));
      const consent = requested && Boolean(phone);
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
    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(save, 350);
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
  }, [angle, ar, itemsJson, requested]);

  return <div data-wide="true" className="callback-option">
    <input type="hidden" name="draftId" ref={hidden} />
    <button type="button" className="callback-link" onClick={() => {
      if (!requested) {
        const phone = hidden.current?.form?.elements.namedItem("phone");
        if (phone instanceof HTMLInputElement && !normalizeTunisianPhone(phone.value)) {
          setStatus(ar ? "اكتب رقم تليفونك باش نكلّموك." : "Saisissez votre numéro pour être rappelé.");
          phone.focus();
          return;
        }
      }
      setRequested(!requested);
    }}>{requested
      ? (ar ? "إلغاء طلب المكالمة" : "Annuler le rappel")
      : (ar ? "كلّمني باش نكمّل طلبي" : "Être rappelé pour commander")}</button>
    <small role="status" aria-live="polite">{status}</small>
  </div>;
}
