"use client";

import Link from "next/link";

export function PrintToolbar({ ids, count, mode }: { ids: number[]; count: number; mode: string }) {
  const link = (next: string) => `/admin/print?ids=${ids.join(",")}&mode=${next}`;
  return <div className="print-toolbar">
    <span>{count} colis</span>
    <Link href={link("both")} className={mode === "both" ? "active" : undefined}>Feuille + bons</Link>
    <Link href={link("sheet")} className={mode === "sheet" ? "active" : undefined}>Feuille de route</Link>
    <Link href={link("labels")} className={mode === "labels" ? "active" : undefined}>Bons seulement</Link>
    <button type="button" className="primary" onClick={() => window.print()}>🖨 Imprimer</button>
    <Link href="/admin/orders">← Commandes</Link>
  </div>;
}
