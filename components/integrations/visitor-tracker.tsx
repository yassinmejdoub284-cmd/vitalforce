"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { track } from "@/lib/visitor";

const HEARTBEAT_MS = 25_000;

/** Mesure interne: page vue à chaque navigation + présence (visiteurs en temps réel dans l'admin). */
export function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    track("page_view", { angle: pathname.startsWith("/lp/") ? pathname.slice(4) : undefined });
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const beat = () => document.visibilityState === "visible" && track("ping");
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", beat); };
  }, [pathname]);

  return null;
}
