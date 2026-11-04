"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const presets = [["today", "Aujourd'hui"], ["yesterday", "Hier"], ["7d", "7 jours"], ["30d", "30 jours"], ["month", "Ce mois"], ["90d", "90 jours"], ["custom", "Dates…"]] as const;

export function RangePicker({ preset, from, to }: { preset: string; from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [custom, setCustom] = useState(preset === "custom");

  function go(next: Record<string, string>) {
    const search = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) search.set(key, value);
    router.push(`${pathname}?${search.toString()}`);
  }

  return <div className="adm-grid" style={{ gap: 8 }}>
    <div className="adm-tabs" style={{ marginBottom: 0 }}>
      {presets.map(([key, label]) => <button key={key} type="button" className="adm-tab" aria-current={(key === "custom" ? custom : preset === key && !custom) ? "page" : undefined}
        onClick={() => { if (key === "custom") setCustom(true); else { setCustom(false); go({ preset: key }); } }}>{label}</button>)}
    </div>
    {custom && <form className="adm-row" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); go({ preset: "custom", from: String(data.get("from")), to: String(data.get("to")) }); }}>
      <input className="adm-input" type="date" name="from" defaultValue={from} style={{ width: "auto" }} required />
      <span className="adm-muted">→</span>
      <input className="adm-input" type="date" name="to" defaultValue={to} style={{ width: "auto" }} required />
      <button className="adm-btn adm-btn-primary">Appliquer</button>
    </form>}
  </div>;
}
