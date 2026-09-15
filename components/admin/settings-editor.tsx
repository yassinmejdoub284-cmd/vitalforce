"use client";

import { useState } from "react";
import type { SiteSetting } from "@prisma/client";
import { Button } from "@/components/ui/button";

export function SettingsEditor({ initialSettings }: { initialSettings: SiteSetting }) {
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function save(formData: FormData) {
    setLoading(true);setMessage("");
    const payload = {
      siteName: String(formData.get("siteName")),
      phone: String(formData.get("phone")),
      address: String(formData.get("address")),
      deliveryFee: Number(formData.get("deliveryFee")),
      freeShippingThreshold: Number(formData.get("freeShippingThreshold"))
    };
    const response = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) { setMessage(data.error ?? "Réglages non enregistrés."); return; }
    setSettings(data.settings);setMessage("Réglages enregistrés.");
  }

  return <form action={save} className="mt-8 grid gap-5 border-t border-forest-900/10 pt-7 md:grid-cols-2">
    <label className="grid gap-2 text-sm font-semibold">Nom du site<input name="siteName" defaultValue={settings.siteName} required className="h-11 border border-forest-900/15 bg-white px-3" /></label>
    <label className="grid gap-2 text-sm font-semibold">Téléphone<input name="phone" defaultValue={settings.phone} required className="h-11 border border-forest-900/15 bg-white px-3" /></label>
    <label className="grid gap-2 text-sm font-semibold md:col-span-2">Adresse<input name="address" defaultValue={settings.address} required className="h-11 border border-forest-900/15 bg-white px-3" /></label>
    <label className="grid gap-2 text-sm font-semibold">Livraison locale (TND)<input name="deliveryFee" type="number" min="0" step="0.001" defaultValue={settings.deliveryFee} required className="h-11 border border-forest-900/15 bg-white px-3" /></label>
    <label className="grid gap-2 text-sm font-semibold">Livraison offerte dès (TND)<input name="freeShippingThreshold" type="number" min="0" step="0.001" defaultValue={settings.freeShippingThreshold} required className="h-11 border border-forest-900/15 bg-white px-3" /></label>
    <div className="flex items-center gap-4 md:col-span-2"><Button disabled={loading}>{loading ? "Enregistrement" : "Sauver les réglages"}</Button>{message && <p role="status" className="text-sm font-semibold">{message}</p>}</div>
  </form>;
}
