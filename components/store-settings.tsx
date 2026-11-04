"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PublicSettings } from "@/lib/settings";

const fallback: PublicSettings = {
  store: { siteName: "VITAL FORCE", phone: "+216 27 200 603", whatsapp: "21627200603", email: "", address: "Rue Sidi Mansour km 6, Sfax", addressAr: "طريق سيدي منصور كلم 6، صفاقس", facebook: "", instagram: "", tiktok: "", announcement: "", announcementAr: "", ordersEnabled: true },
  delivery: { fee: 7, included: false, freeThreshold: 0, eta: "24-72 h selon la ville", etaAr: "24-72 ساعة حسب المدينة" },
  pixelId: "",
  purchaseOn: "order"
};

const StoreSettingsContext = createContext<PublicSettings>(fallback);

export function StoreSettingsProvider({ value, children }: { value: PublicSettings; children: ReactNode }) {
  return <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>;
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}

export function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^+0-9]/g, "")}`;
}

export function whatsappHref(number: string, text?: string) {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
