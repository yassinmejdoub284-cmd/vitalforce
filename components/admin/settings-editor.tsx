"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, PlugZap, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { api } from "./client-api";
import { PushToggle } from "./push-toggle";
import { SoundPicker } from "./sound-picker";
import type { Settings } from "@/lib/settings";
import { formatTunisianPhone } from "@/lib/tunisia";

type Group = keyof Settings;
type Env = { push: boolean; cron: boolean; siteUrl: string };
type Blocked = { phone: string; reason: string; createdAt: string };

const tabs: [string, string][] = [["store", "Boutique & contact"], ["delivery", "Livraison & coûts"], ["meta", "Meta & pixel"], ["jetpack", "Jetpack"], ["notifications", "Notifications & app"], ["orders", "Commandes & liste noire"], ["security", "Sécurité"]];

function Section({ title, children, hint }: { title: string; children: ReactNode; hint?: ReactNode }) {
  return <section className="adm-card"><h2>{title}</h2>{hint && <p className="adm-hint" style={{ margin: "-6px 0 12px" }}>{hint}</p>}{children}</section>;
}

function Text({ name, label, value, hint, type = "text", dir, placeholder, span }: { name: string; label: string; value: string | number; hint?: string; type?: string; dir?: "rtl"; placeholder?: string; span?: boolean }) {
  return <label className={`adm-field${span ? " adm-span-2" : ""}`}>{label}{hint && <span className="adm-hint">{hint}</span>}
    <input className="adm-input" name={name} type={type} defaultValue={value} dir={dir} placeholder={placeholder} step={type === "number" ? "0.001" : undefined} min={type === "number" ? 0 : undefined} />
  </label>;
}

function Toggle({ name, label, checked, hint }: { name: string; label: string; checked: boolean; hint?: string }) {
  return <label className="adm-toggle adm-span-2"><input type="checkbox" name={name} defaultChecked={checked} /><span>{label}{hint && <small>{hint}</small>}</span></label>;
}

function Secret({ name, label, value, hint }: { name: string; label: string; value: string; hint?: string }) {
  return <label className="adm-field adm-span-2">{label}{hint && <span className="adm-hint">{hint}</span>}
    <input className="adm-input adm-mono" name={name} type="password" autoComplete="off" placeholder={value ? `Enregistré ${value} — collez un nouveau token pour le remplacer` : "Collez le token ici"} />
    {value && <span className="adm-hint"><CheckCircle2 size={12} style={{ display: "inline", color: "var(--adm-green)" }} /> Token enregistré ({value})</span>}
  </label>;
}

export function SettingsEditor({ initial, initialTab, blacklist, env }: { initial: Settings; initialTab?: string; blacklist: Blocked[]; env: Env }) {
  const router = useRouter();
  const [tab, setTab] = useState(tabs.some(([key]) => key === initialTab) ? initialTab! : "store");
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error" | "info"; text: string } | null>(null);

  function collect(form: HTMLFormElement, group: Group) {
    const data = new FormData(form);
    const current = settings[group] as Record<string, unknown>;
    const values: Record<string, unknown> = {};
    for (const [key, sample] of Object.entries(current)) {
      if (typeof sample === "boolean") values[key] = data.get(key) === "on";
      else if (data.has(key)) values[key] = typeof sample === "number" ? Number(data.get(key)) : String(data.get(key));
    }
    return values;
  }

  async function save(group: Group, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(group);
    setMessage(null);
    try {
      const result = await api<{ settings: Settings }>("/api/admin/settings", { method: "PATCH", body: { group, values: collect(form, group) } });
      setSettings(result.settings);
      form.querySelectorAll<HTMLInputElement>("input[type=password]").forEach((input) => { input.value = ""; });
      setMessage({ tone: "ok", text: "Enregistré. Le site est mis à jour." });
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: (error as Error).message });
    } finally {
      setSaving("");
    }
  }

  async function test(target: string) {
    setSaving(`test-${target}`);
    setMessage(null);
    try {
      const result = await api<{ message: string; ok: boolean }>("/api/admin/settings/test", { body: { target } });
      setMessage({ tone: result.ok ? "ok" : "info", text: result.message });
    } catch (error) {
      setMessage({ tone: "error", text: (error as Error).message });
    } finally {
      setSaving("");
    }
  }

  const SaveBar = ({ group }: { group: Group }) => <div className="adm-row adm-span-2" style={{ marginTop: 4 }}>
    <button className="adm-btn adm-btn-primary" disabled={!!saving}>{saving === group && <Loader2 size={16} className="animate-spin" />}Enregistrer</button>
  </div>;
  const TestButton = ({ target, label }: { target: string; label: string }) => <button type="button" className="adm-btn" disabled={!!saving} onClick={() => test(target)}>
    {saving === `test-${target}` ? <Loader2 size={16} className="animate-spin" /> : <PlugZap size={16} />}{label}
  </button>;

  const s = settings;
  return <>
    <nav className="adm-tabs">{tabs.map(([key, label]) => <button key={key} type="button" className="adm-tab" aria-current={tab === key ? "page" : undefined} onClick={() => { setTab(key); setMessage(null); window.history.replaceState(null, "", `?tab=${key}`); }}>{label}</button>)}</nav>
    {message && <p className={`adm-alert adm-alert-${message.tone}`} style={{ marginBottom: 12 }}>{message.text}</p>}

    {tab === "store" && <form key="store" onSubmit={(event) => save("store", event)}><Section title="Boutique et contact" hint="Ces informations apparaissent dans le pied de page, les pages de vente et le bouton WhatsApp.">
      <div className="adm-form-grid">
        <Text name="siteName" label="Nom de la boutique" value={s.store.siteName} />
        <Text name="phone" label="Téléphone affiché" value={s.store.phone} placeholder="+216 27 200 603" />
        <Text name="whatsapp" label="Numéro WhatsApp" value={s.store.whatsapp} hint="Format international sans + : 216XXXXXXXX" />
        <Text name="email" label="Email de contact" value={s.store.email} type="email" />
        <Text name="address" label="Adresse (français)" value={s.store.address} span />
        <Text name="addressAr" label="Adresse (arabe)" value={s.store.addressAr} dir="rtl" span />
        <Text name="facebook" label="Page Facebook" value={s.store.facebook} placeholder="https://facebook.com/…" />
        <Text name="instagram" label="Instagram" value={s.store.instagram} placeholder="https://instagram.com/…" />
        <Text name="tiktok" label="TikTok" value={s.store.tiktok} placeholder="https://tiktok.com/@…" />
        <span />
        <Text name="announcement" label="Bandeau d'annonce (français)" value={s.store.announcement} placeholder="Livraison gratuite ce week-end !" span />
        <Text name="announcementAr" label="Bandeau d'annonce (arabe, pages de vente)" value={s.store.announcementAr} dir="rtl" span />
        <Toggle name="ordersEnabled" label="Commandes en ligne ouvertes" checked={s.store.ordersEnabled} hint="Décochez pour fermer temporairement les commandes (rupture, congés)." />
        <SaveBar group="store" />
      </div>
    </Section></form>}

    {tab === "delivery" && <div className="adm-grid">
      <form key="delivery" onSubmit={(event) => save("delivery", event)}><Section title="Prix de livraison" hint="Ce que le client paie. Le prix des produits se change dans Produits.">
        <div className="adm-form-grid">
          <Toggle name="included" label="Livraison incluse dans le prix (gratuite pour le client)" checked={s.delivery.included} hint="Si coché, aucun frais de livraison n'est ajouté et le site affiche « Livraison gratuite »." />
          <Text name="fee" label="Frais de livraison client (DT)" value={s.delivery.fee} type="number" />
          <Text name="freeThreshold" label="Livraison offerte à partir de (DT)" value={s.delivery.freeThreshold} type="number" hint="0 = désactivé" />
          <Text name="eta" label="Délai affiché (français)" value={s.delivery.eta} />
          <Text name="etaAr" label="Délai affiché (arabe)" value={s.delivery.etaAr} dir="rtl" />
          <h3 className="adm-span-2" style={{ margin: "8px 0 0" }}>Ce que Jetpack vous facture</h3>
          <Text name="carrierCost" label="Par colis livré (DT)" value={s.delivery.carrierCost} type="number" />
          <Text name="returnCost" label="Par colis retourné (DT)" value={s.delivery.returnCost} type="number" />
          <Text name="selfCost" label="Livraison faite par vous-même (DT / commande)" value={s.delivery.selfCost} type="number" hint="Ex: Sfax livré par vous. Carburant, livreur… 0 si rien." span />
          <SaveBar group="delivery" />
        </div>
      </Section></form>
      <form key="costs" onSubmit={(event) => save("costs", event)}><Section title="Autres coûts" hint="Utilisés pour calculer le profit réel. Le coût de production se règle par produit.">
        <div className="adm-form-grid">
          <Text name="confirmationCost" label="Coût de confirmation par commande (DT)" value={s.costs.confirmationCost} type="number" hint="Crédit téléphone, salaire de l'agent ramené à la commande…" />
          <Text name="monthlyFixed" label="Charges fixes mensuelles (DT)" value={s.costs.monthlyFixed} type="number" hint="Local, salaires, abonnements. Réparties par jour dans le profit net." />
          <SaveBar group="costs" />
        </div>
      </Section></form>
    </div>}

    {tab === "meta" && <form key="meta" onSubmit={(event) => save("meta", event)}><div className="adm-grid">
      <Section title="Pixel Meta" hint="Le pixel suit les visites, les débuts de commande et les achats sur toutes les pages du site.">
        <div className="adm-form-grid">
          <Text name="pixelId" label="ID du pixel (jeu de données)" value={s.meta.pixelId} placeholder="123456789012345" hint="Gestionnaire d'événements → Sources de données" />
          <label className="adm-field">Envoyer l&apos;achat (Purchase)
            <select className="adm-input" name="purchaseOn" defaultValue={s.meta.purchaseOn}>
              <option value="order">Dès que le client commande</option>
              <option value="confirmed">Seulement après confirmation par téléphone</option>
            </select>
            <span className="adm-hint">« Après confirmation » apprend à Meta à trouver des clients qui confirment vraiment.</span>
          </label>
          <Secret name="capiToken" label="Token API Conversions (serveur)" value={s.meta.capiToken} hint="Gestionnaire d'événements → Paramètres → API Conversions → Générer un token. Les achats sont envoyés aussi par le serveur (plus fiable avec les bloqueurs de pub)." />
          <Text name="testEventCode" label="Code d'événement test (facultatif)" value={s.meta.testEventCode} placeholder="TEST12345" hint="À vider après vos tests." />
        </div>
      </Section>
      <Section title="Compte publicitaire (dépenses et coût par commande)" hint="Pour importer automatiquement vos dépenses Meta Ads chaque jour.">
        <div className="adm-form-grid">
          <Text name="adAccountId" label="ID du compte publicitaire" value={s.meta.adAccountId} placeholder="act_1234567890" hint="Gestionnaire de publicités → en haut à gauche" />
          <span />
          <Secret name="marketingToken" label="Token Marketing API (lecture des stats)" value={s.meta.marketingToken} hint="Business Manager → Utilisateurs système → Générer un token avec la permission ads_read." />
          <div className="adm-row adm-span-2">
            <button className="adm-btn adm-btn-primary" disabled={!!saving}>{saving === "meta" && <Loader2 size={16} className="animate-spin" />}Enregistrer</button>
            <TestButton target="meta-ads" label="Tester le compte pub" />
          </div>
        </div>
      </Section>
    </div></form>}

    {tab === "jetpack" && <form key="jetpack" onSubmit={(event) => save("jetpack", event)}><Section title="Jetpack (livraison)" hint={<>Tokens disponibles dans votre espace expéditeur: Paramètres → API (jetpack.tn/expediteur/api.php).</>}>
      <div className="adm-form-grid">
        <Secret name="addToken" label="Token d'ajout (créer les colis)" value={s.jetpack.addToken} />
        <Secret name="trackToken" label="Token de tracking (suivi des colis)" value={s.jetpack.trackToken} />
        <Text name="designation" label="Désignation du colis" value={s.jetpack.designation} span />
        <Toggle name="allowOpen" label="Autoriser le client à ouvrir le colis" checked={s.jetpack.allowOpen} />
        <Toggle name="fragile" label="Colis fragile" checked={s.jetpack.fragile} />
        <div className="adm-row adm-span-2">
          <button className="adm-btn adm-btn-primary" disabled={!!saving}>{saving === "jetpack" && <Loader2 size={16} className="animate-spin" />}Enregistrer</button>
          <TestButton target="jetpack" label="Tester la connexion" />
        </div>
        <p className="adm-hint adm-span-2">Le suivi des colis se met à jour automatiquement {env.cron ? "chaque jour" : "(tâche planifiée non configurée: ajoutez CRON_SECRET)"} et à chaque clic sur « Suivi Jetpack » dans Commandes. Jetpack limite le suivi à 30 requêtes/minute (200 colis par requête).</p>
      </div>
    </Section></form>}

    {tab === "notifications" && <div className="adm-grid">
      <Section title="Application sur le téléphone" hint="Ouvrez l'admin sur votre téléphone puis « Ajouter à l'écran d'accueil » (Android: menu ⋮ ; iPhone: bouton Partager).">
        {env.push ? <><PushToggle /><div className="adm-row" style={{ marginTop: 10 }}><TestButton target="push" label="Envoyer une notification test" /></div></> : <p className="adm-alert adm-alert-warn">Notifications push non configurées sur le serveur: ajoutez les clés VAPID (voir README, section Notifications).</p>}
      </Section>
      <Section title="Sons dans l'admin (cet appareil)" hint="Choisissez un son pour les commandes (ex: caisse « cha-ching ») et un autre pour les visiteurs. Appuyez sur ▶ pour écouter.">
        <SoundPicker />
      </Section>
      <form key="notifications" onSubmit={(event) => save("notifications", event)}><Section title="Quand me notifier">
        <div className="adm-form-grid">
          <Toggle name="newOrder" label="Nouvelle commande" checked={s.notifications.newOrder} />
          <Toggle name="statusChanges" label="Colis livré ou retourné (suivi Jetpack)" checked={s.notifications.statusChanges} />
          <Toggle name="visitors" label="Visiteurs sur le site" checked={s.notifications.visitors} hint="Un résumé « X visiteurs en ligne » quand de nouveaux visiteurs arrivent." />
          <label className="adm-field">Au plus une notification visiteurs toutes les (minutes)<input className="adm-input" type="number" min={1} max={1440} name="visitorIntervalMin" defaultValue={s.notifications.visitorIntervalMin} /></label>
          <SaveBar group="notifications" />
        </div>
      </Section></form>
    </div>}

    {tab === "orders" && <div className="adm-grid">
      <form key="orders" onSubmit={(event) => save("orders", event)}><Section title="Règles des commandes">
        <div className="adm-form-grid">
          <Toggle name="blockBlacklisted" label="Refuser les commandes des numéros en liste noire" checked={s.orders.blockBlacklisted} />
          <Toggle name="restockOnReturn" label="Remettre en stock les colis retournés" checked={s.orders.restockOnReturn} />
          <label className="adm-field">Signaler un doublon si même numéro dans les (heures)<input className="adm-input" type="number" min={0} max={720} name="duplicateHours" defaultValue={s.orders.duplicateHours} /></label>
          <SaveBar group="orders" />
        </div>
      </Section></form>
      <BlacklistManager initial={blacklist} />
    </div>}

    {tab === "security" && <PasswordForm />}
  </>;
}

function BlacklistManager({ initial }: { initial: Blocked[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  return <Section title="Liste noire" hint="Numéros qui refusent les colis ou passent de fausses commandes.">
    <form className="adm-row" onSubmit={async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = Object.fromEntries(new FormData(form).entries());
      try { await api("/api/admin/blacklist", { body: data }); form.reset(); setError(""); router.refresh(); } catch (failure) { setError((failure as Error).message); }
    }}>
      <input className="adm-input" name="phone" placeholder="Numéro" inputMode="tel" required style={{ width: 160 }} />
      <input className="adm-input" name="reason" placeholder="Raison" style={{ flex: "1 1 160px", width: "auto" }} />
      <button className="adm-btn">Ajouter</button>
    </form>
    {error && <p className="adm-alert adm-alert-error" style={{ marginTop: 8 }}>{error}</p>}
    <div style={{ marginTop: 10 }}>{initial.length === 0 ? <p className="adm-empty">Liste vide.</p> : initial.map((row) => <div key={row.phone} className="adm-cost-row">
      <span><span className="adm-mono">{formatTunisianPhone(row.phone)}</span> <small className="adm-muted">{row.reason}</small></span>
      <button type="button" className="adm-btn adm-btn-sm" aria-label="Retirer" onClick={async () => { await api(`/api/admin/blacklist?phone=${row.phone}`, { method: "DELETE" }); router.refresh(); }}><Trash2 size={13} /></button>
    </div>)}</div>
  </Section>;
}

function PasswordForm() {
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  return <form onSubmit={async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    if (data.next !== data.confirm) { setMessage({ tone: "error", text: "Les deux mots de passe ne correspondent pas." }); return; }
    try { await api("/api/admin/password", { body: data }); form.reset(); setMessage({ tone: "ok", text: "Mot de passe changé." }); } catch (error) { setMessage({ tone: "error", text: (error as Error).message }); }
  }}><Section title="Mot de passe">
    <div className="adm-form-grid">
      <label className="adm-field adm-span-2">Mot de passe actuel<input className="adm-input" type="password" name="current" autoComplete="current-password" required /></label>
      <label className="adm-field">Nouveau (10 caractères min.)<input className="adm-input" type="password" name="next" autoComplete="new-password" minLength={10} required /></label>
      <label className="adm-field">Confirmer<input className="adm-input" type="password" name="confirm" autoComplete="new-password" minLength={10} required /></label>
      {message && <p className={`adm-alert adm-alert-${message.tone} adm-span-2`}>{message.text}</p>}
      <div className="adm-span-2"><button className="adm-btn adm-btn-primary">Changer le mot de passe</button></div>
    </div>
  </Section></form>;
}
