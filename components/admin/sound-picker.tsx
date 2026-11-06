"use client";

import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { defaultSoundPrefs, loadSoundPrefs, playSound, saveSoundPrefs, soundOptions, type SoundId, type SoundPrefs } from "./sounds";

/** Choix des sons sur cet appareil (chaque téléphone / ordinateur garde son propre choix). */
export function SoundPicker() {
  const [prefs, setPrefs] = useState<SoundPrefs>(defaultSoundPrefs);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setPrefs(loadSoundPrefs()); }, []);

  function update(next: Partial<SoundPrefs>) {
    const value = { ...prefs, ...next };
    setPrefs(value);
    saveSoundPrefs(value);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  }

  const picker = (key: "order" | "visitor", label: string) => <label className="adm-field">{label}
    <span className="adm-row" style={{ flexWrap: "nowrap" }}>
      <select className="adm-input" value={prefs[key]} onChange={(event) => { const id = event.target.value as SoundId; update({ [key]: id }); playSound(id, prefs.volume); }}>
        {soundOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
      <button type="button" className="adm-btn" aria-label={`Écouter: ${label}`} onClick={() => playSound(prefs[key], key === "visitor" ? prefs.volume * 0.7 : prefs.volume)}><Play size={16} /></button>
    </span>
  </label>;

  return <div className="adm-form-grid">
    {picker("order", "Son d'une nouvelle commande")}
    {picker("visitor", "Son d'un nouveau visiteur")}
    <label className="adm-toggle"><input type="checkbox" checked={prefs.visitorsEnabled} onChange={(event) => update({ visitorsEnabled: event.target.checked })} /><span>Jouer un son quand un visiteur arrive<small>Au plus une fois toutes les 30 secondes.</small></span></label>
    <label className="adm-field">Volume: {Math.round(prefs.volume * 100)} %
      <input type="range" min={0} max={1} step={0.05} value={prefs.volume} onChange={(event) => update({ volume: Number(event.target.value) })} onPointerUp={() => playSound(prefs.order, prefs.volume)} style={{ accentColor: "#111" }} />
    </label>
    <p className="adm-hint adm-span-2">{saved ? "✓ Enregistré sur cet appareil. " : ""}Ces sons jouent quand l&apos;admin est ouvert. Les notifications téléphone (app fermée) utilisent le son du téléphone: sur Android, appui long sur une notification VF Admin → Paramètres → Son.</p>
  </div>;
}
