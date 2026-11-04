"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLink, Home, LogOut, Megaphone, Menu, Package, Radio, Settings, ShoppingBag } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "./client-api";
import { PushToggle, registerAdminWorker } from "./push-toggle";
import { money } from "@/lib/format";

type Live = { summary: { online: number; pending: number; today_orders: number }; latestOrder: { id: number; number: string; customerName: string; total: number; governorate: string } | null };
type Toast = { id: number; title: string; body: string; href: string };

const nav = [
  { href: "/admin", label: "Tableau de bord", short: "Accueil", icon: Home },
  { href: "/admin/orders", label: "Commandes", short: "Commandes", icon: ShoppingBag, badge: true },
  { href: "/admin/live", label: "Visiteurs live", short: "Live", icon: Radio },
  { href: "/admin/marketing", label: "Marketing & rentabilité", short: "Marketing", icon: Megaphone },
  { href: "/admin/products", label: "Produits & stock", short: "Produits", icon: Package },
  { href: "/admin/settings", label: "Gestion du site", short: "Réglages", icon: Settings }
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

function beep() {
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5);
    oscillator.start(); oscillator.stop(context.currentTime + 0.5);
  } catch { /* son désactivé par le navigateur */ }
}

export function AdminShell({ children, adminName, initialPending }: { children: ReactNode; adminName: string; initialPending: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [live, setLive] = useState<{ online: number; pending: number }>({ online: 0, pending: initialPending });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastOrderId = useRef<number | null>(null);

  const poll = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const data = await api<Live>("/api/admin/live");
      setLive({ online: data.summary.online, pending: data.summary.pending });
      const latest = data.latestOrder;
      if (latest && lastOrderId.current !== null && latest.id > lastOrderId.current) {
        const toast = { id: latest.id, title: `🛒 Nouvelle commande ${latest.number}`, body: `${latest.customerName} · ${latest.governorate} · ${money(latest.total)}`, href: `/admin/orders/${latest.id}` };
        setToasts((current) => [toast, ...current].slice(0, 3));
        beep();
        window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== toast.id)), 9000);
        if (pathname === "/admin" || pathname.startsWith("/admin/orders")) router.refresh();
      }
      if (latest) lastOrderId.current = Math.max(lastOrderId.current ?? 0, latest.id);
      else lastOrderId.current = 0;
    } catch { /* hors ligne: on réessaie au prochain tour */ }
  }, [pathname, router]);

  useEffect(() => {
    registerAdminWorker()?.catch(() => {});
    poll();
    const timer = window.setInterval(poll, 15_000);
    const onVisible = () => document.visibilityState === "visible" && poll();
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [poll]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const livePill = <Link href="/admin/live" className="adm-live-pill"><span className="adm-dot" />{live.online} en ligne</Link>;
  const bottom = [nav[0], nav[1], nav[2], nav[3], { href: "/admin/menu", label: "Plus", short: "Plus", icon: Menu }];

  return <div className="adm-layout">
    <aside className="adm-side">
      <Link href="/admin" className="adm-brand"><Image src="/images/v2/logo.png" alt="" width={46} height={32} /><span><strong>VITAL FORCE</strong><span>ADMIN</span></span></Link>
      {nav.map((item) => <Link key={item.href} href={item.href} className="adm-nav-link" aria-current={isActive(pathname, item.href) ? "page" : undefined}>
        <item.icon size={18} />{item.label}{item.badge && live.pending > 0 && <span className="adm-count">{live.pending}</span>}
      </Link>)}
      <div className="adm-side-foot">
        <PushToggle compact />
        <a href={process.env.NEXT_PUBLIC_SITE_URL || "/"} target="_blank" rel="noopener noreferrer" className="adm-nav-link"><ExternalLink size={17} />Voir le site</a>
        <button type="button" className="adm-nav-link" onClick={logout} style={{ border: 0, background: "transparent", cursor: "pointer", width: "100%" }}><LogOut size={17} />Déconnexion ({adminName})</button>
      </div>
    </aside>
    <div>
      <header className="adm-mobilebar">
        <Link href="/admin" className="adm-brand"><Image src="/images/v2/logo.png" alt="" width={40} height={28} /><span><strong>VITAL FORCE</strong></span></Link>
        {livePill}
      </header>
      <main className="adm-main">
        <div className="adm-desk-only">{livePill}</div>
        {children}
      </main>
    </div>
    <nav className="adm-bottomnav" aria-label="Navigation admin">
      {bottom.map((item) => <Link key={item.href} href={item.href} aria-current={isActive(pathname, item.href) || (item.href === "/admin/menu" && ["/admin/products", "/admin/settings"].some((href) => isActive(pathname, href))) ? "page" : undefined}>
        <item.icon size={21} />{item.short}{"badge" in item && item.badge && live.pending > 0 && <span className="adm-count">{live.pending}</span>}
      </Link>)}
    </nav>
    <div className="adm-toast-stack" aria-live="polite">
      {toasts.map((toast) => <Link key={toast.id} href={toast.href} className="adm-toast" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}><strong>{toast.title}</strong>{toast.body}</Link>)}
    </div>
  </div>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return <div className="adm-topbar"><div><h1 className="adm-title">{title}</h1>{subtitle && <p className="adm-subtitle">{subtitle}</p>}</div>{actions && <div className="adm-row">{actions}</div>}</div>;
}

