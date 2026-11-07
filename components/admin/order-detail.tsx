"use client";

import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Ban, Bike, Check, Loader2, PackageCheck, PhoneCall, PhoneOff, RotateCcw, Truck, Undo2, X } from "lucide-react";
import { useState } from "react";
import { api } from "./client-api";
import { governorates } from "@/lib/tunisia";

type Order = { id: number; number: string; status: string; phone: string; customerName: string; total: number; carrierBarcode: string | null; blacklisted: boolean; archived: boolean };

const targetButtons: Record<string, { label: string; icon: typeof Check; className: string }> = {
  confirmed: { label: "Confirmer", icon: Check, className: "adm-btn-green" },
  no_answer: { label: "Pas de réponse", icon: PhoneOff, className: "" },
  cancelled: { label: "Annuler", icon: X, className: "adm-btn-red" },
  pending: { label: "Remettre à confirmer", icon: RotateCcw, className: "" },
  delivered: { label: "Livrée (par moi) · encaissée", icon: PackageCheck, className: "adm-btn-green" },
  returned: { label: "Marquer retournée", icon: Undo2, className: "adm-btn-red" },
  shipped: { label: "Je livre moi-même", icon: Bike, className: "" }
};

export function OrderActions({ order, targets, jetpackReady }: { order: Order; targets: string[]; jetpackReady: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function run(key: string, action: () => Promise<unknown>, success: string) {
    setBusy(key);
    setMessage(null);
    try {
      const result = await action() as { failed?: { error?: string }[] };
      if (result?.failed?.length) throw new Error(result.failed[0].error ?? "Échec.");
      setMessage({ tone: "ok", text: success });
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy("");
    }
  }

  function changeStatus(status: string) {
    let reason: string | undefined;
    if (status === "cancelled") {
      const answer = window.prompt("Raison de l'annulation", "Client a annulé");
      if (answer === null) return;
      reason = answer || undefined;
    }
    if (status === "shipped" && !window.confirm("Vous livrez cette commande vous-même (sans Jetpack) ?")) return;
    if (status === "delivered" && !order.carrierBarcode && !window.confirm("Commande livrée par vous et argent encaissé ?")) return;
    run(status, () => api("/api/admin/orders/status", { body: { ids: [order.id], status, reason } }), "Statut mis à jour.");
  }

  return <section className="adm-card">
    <div className="adm-row">
      <a className="adm-btn" href={`tel:+216${order.phone}`}><PhoneCall size={16} />Appeler</a>
      {targets.filter((target) => !(order.carrierBarcode && ["pending", "confirmed", "cancelled", "no_answer"].includes(target))).map((target) => {
        const button = targetButtons[target];
        if (!button) return null;
        return <button key={target} type="button" className={`adm-btn ${button.className}`} disabled={!!busy} onClick={() => changeStatus(target)}>
          {busy === target ? <Loader2 size={16} className="animate-spin" /> : <button.icon size={16} />}{button.label}
        </button>;
      })}
      {order.status === "confirmed" && !order.carrierBarcode && <button type="button" className="adm-btn adm-btn-gold" disabled={!!busy || !jetpackReady} title={jetpackReady ? undefined : "Token Jetpack manquant"}
        onClick={() => window.confirm("Créer le colis chez Jetpack ?") && run("jetpack", () => api("/api/admin/orders/jetpack", { body: { ids: [order.id] } }), "Colis créé chez Jetpack.")}>
        {busy === "jetpack" ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}Envoyer à Jetpack
      </button>}
      <button type="button" className="adm-btn" disabled={!!busy} onClick={() => {
        if (order.blacklisted) return run("blacklist", () => api(`/api/admin/blacklist?phone=${order.phone}`, { method: "DELETE" }), "Numéro retiré de la liste noire.");
        const reason = window.prompt("Pourquoi bloquer ce numéro ? (faux numéro, refus répétés…)", "Refus de colis");
        if (reason !== null) run("blacklist", () => api("/api/admin/blacklist", { body: { phone: order.phone, reason } }), "Numéro ajouté à la liste noire.");
      }}><Ban size={16} />{order.blacklisted ? "Débloquer le numéro" : "Liste noire"}</button>
      {(order.archived || order.status === "cancelled") && <button type="button" className="adm-btn" disabled={!!busy}
        onClick={() => run("archive", () => api("/api/admin/orders/archive", { body: { ids: [order.id], archived: !order.archived } }), order.archived ? "Commande désarchivée." : "Commande archivée.")}>
        {order.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}{order.archived ? "Désarchiver" : "Archiver"}
      </button>}
    </div>
    {message && <p className={`adm-alert adm-alert-${message.tone}`} style={{ marginTop: 10 }}>{message.text}</p>}
  </section>;
}

type Editable = { id: number; customerName: string; phone: string; phone2: string; email: string; governorate: string; city: string; address: string; note: string; internalNote: string };

export function OrderEditor({ order, locked }: { order: Editable; locked: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await api(`/api/admin/orders/${order.id}`, { method: "PATCH", body: locked ? { internalNote: data.internalNote } : data });
      setOpen(false);
      router.refresh();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return <div style={{ marginTop: 14 }}>
    {order.internalNote && !open && <p className="adm-alert adm-alert-info" style={{ marginBottom: 10 }}>📝 {order.internalNote}</p>}
    {!open ? <button type="button" className="adm-btn adm-btn-sm" onClick={() => setOpen(true)}>{locked ? "Note interne" : "Modifier les coordonnées"}</button> :
      <form onSubmit={save} className="adm-form-grid">
        {!locked && <>
          <label className="adm-field">Nom<input className="adm-input" name="customerName" defaultValue={order.customerName} required /></label>
          <label className="adm-field">Téléphone<input className="adm-input" name="phone" defaultValue={order.phone} inputMode="tel" required /></label>
          <label className="adm-field">Téléphone 2<input className="adm-input" name="phone2" defaultValue={order.phone2} inputMode="tel" /></label>
          <label className="adm-field">Email<input className="adm-input" name="email" defaultValue={order.email} type="email" /></label>
          <label className="adm-field">Gouvernorat<select className="adm-input" name="governorate" defaultValue={order.governorate}>{governorates.map((item) => <option key={item.value}>{item.value}</option>)}</select></label>
          <label className="adm-field">Ville / délégation<input className="adm-input" name="city" defaultValue={order.city} required /></label>
          <label className="adm-field adm-span-2">Adresse<textarea className="adm-input" name="address" defaultValue={order.address} required /></label>
          <label className="adm-field adm-span-2">Note du client<textarea className="adm-input" name="note" defaultValue={order.note} /></label>
        </>}
        <label className="adm-field adm-span-2">Note interne <small className="adm-hint">(visible seulement dans l&apos;admin)</small><textarea className="adm-input" name="internalNote" defaultValue={order.internalNote} /></label>
        {error && <p className="adm-alert adm-alert-error adm-span-2">{error}</p>}
        <div className="adm-row adm-span-2"><button className="adm-btn adm-btn-primary" disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" />}Enregistrer</button><button type="button" className="adm-btn" onClick={() => setOpen(false)}>Annuler</button></div>
      </form>}
  </div>;
}
