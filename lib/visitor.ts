"use client";

/** Identifiant visiteur anonyme et attribution de campagne, côté navigateur. */
const VISITOR_KEY = "vf_vid";
const UTM_KEY = "vf_utm";
const attributionKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"] as const;
let memoryId: string | null = null;

export function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    memoryId ??= crypto.randomUUID();
    return memoryId;
  }
}

/** Premier contact de la session: les paramètres utm de l'arrivée restent attachés jusqu'à la commande. */
export function getAttribution(): Record<string, string> {
  let stored: Record<string, string> = {};
  try { stored = JSON.parse(sessionStorage.getItem(UTM_KEY) ?? "{}"); } catch { stored = {}; }
  const params = new URLSearchParams(window.location.search);
  const fresh = Object.fromEntries(attributionKeys.flatMap((key) => {
    const value = params.get(key)?.replace(/\p{Cc}/gu, "").trim().slice(0, 150);
    return value ? [[key, value]] : [];
  }));
  if (Object.keys(fresh).length) {
    stored = fresh;
    try { sessionStorage.setItem(UTM_KEY, JSON.stringify(stored)); } catch { /* navigation privée */ }
  }
  return stored;
}

export function readCookie(name: string) {
  const match = document.cookie.split("; ").find((item) => item.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

/** Cookies Meta (_fbp/_fbc) pour améliorer la correspondance des achats envoyés par le serveur. */
export function getMetaCookies() {
  const fbclid = getAttribution().fbclid;
  const fbc = readCookie("_fbc") ?? (fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined);
  return { fbp: readCookie("_fbp"), fbc };
}

export type TrackType = "page_view" | "view_content" | "add_to_cart" | "initiate_checkout" | "purchase" | "ping";

export function track(type: TrackType, extra: { angle?: string; value?: number } = {}) {
  if (typeof window === "undefined" || window.location.pathname.startsWith("/admin")) return;
  const utm = getAttribution();
  const body = JSON.stringify({ vid: getVisitorId(), type, path: window.location.pathname, ref: type === "page_view" ? document.referrer || undefined : undefined, utm: Object.keys(utm).length ? utm : undefined, ...extra });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon("/api/t", new Blob([body], { type: "application/json" }))) return;
  } catch { /* repli fetch */ }
  fetch("/api/t", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
}

/** Données à joindre à une commande: visiteur, campagne et cookies Meta. */
export function orderContext(angle?: string) {
  const utm = getAttribution();
  return { visitorId: getVisitorId(), utm: Object.keys(utm).length ? utm : undefined, landingAngle: angle, pageUrl: window.location.href.slice(0, 500), ...getMetaCookies() };
}
