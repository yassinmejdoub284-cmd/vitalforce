"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "./client-api";

type State = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on" | "no-keys";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export async function registerAdminWorker() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/admin-sw.js", { scope: "/", updateViaCache: "none" });
}

export function PushToggle({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    (async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
      if (!publicKey) return setState("no-keys");
      if (ios && !standalone) return setState("ios-install");
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState("unsupported");
      if (Notification.permission === "denied") return setState("denied");
      const registration = await registerAdminWorker();
      const subscription = await registration?.pushManager.getSubscription();
      setState(subscription ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, [publicKey]);

  async function enable() {
    setBusy(true);
    setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState(permission === "denied" ? "denied" : "off"); return; }
      const registration = await registerAdminWorker();
      await navigator.serviceWorker.ready;
      const subscription = await registration!.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey!) });
      await api("/api/admin/push", { body: subscription.toJSON() });
      setState("on");
      setMessage("Notifications activées sur cet appareil.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await api("/api/admin/push", { method: "DELETE", body: { endpoint: subscription.endpoint } });
        await subscription.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  const help: Partial<Record<State, string>> = {
    "ios-install": "Sur iPhone: Partager → « Sur l'écran d'accueil », puis ouvrez l'app depuis l'icône pour activer les notifications.",
    denied: "Notifications bloquées: autorisez-les dans les réglages du navigateur pour ce site.",
    unsupported: "Ce navigateur ne gère pas les notifications push.",
    "no-keys": "Clés VAPID non configurées sur le serveur (voir README)."
  };

  if (state === "loading") return null;
  if (compact) {
    if (state !== "off" && state !== "on") return null;
    return <button type="button" className="adm-nav-link" onClick={state === "on" ? disable : enable} disabled={busy} style={{ border: 0, background: "transparent", width: "100%", cursor: "pointer" }}>
      {busy ? <Loader2 size={17} className="animate-spin" /> : state === "on" ? <Bell size={17} /> : <BellOff size={17} />}
      {state === "on" ? "Notifications actives" : "Activer les notifications"}
    </button>;
  }
  return <div className="adm-grid" style={{ gap: 8 }}>
    {state === "on" || state === "off" ? <div className="adm-row">
      <button type="button" className={`adm-btn ${state === "on" ? "" : "adm-btn-gold"}`} onClick={state === "on" ? disable : enable} disabled={busy}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : state === "on" ? <BellOff size={16} /> : <Bell size={16} />}
        {state === "on" ? "Désactiver sur cet appareil" : "Activer les notifications sur cet appareil"}
      </button>
      {state === "on" && <span className="adm-badge adm-badge-paid">Actives</span>}
    </div> : <p className="adm-alert adm-alert-warn">{help[state]}</p>}
    {message && <p className="adm-hint">{message}</p>}
  </div>;
}
