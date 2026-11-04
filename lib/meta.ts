export type MetaEventName = "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase" | "Lead";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Événement pixel navigateur. eventId permet à Meta de dédupliquer avec l'envoi serveur (API Conversions). */
export function trackMetaEvent(name: MetaEventName, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === "undefined" || !window.fbq) return;
  if (eventId) window.fbq("track", name, params ?? {}, { eventID: eventId });
  else window.fbq("track", name, params ?? {});
}
