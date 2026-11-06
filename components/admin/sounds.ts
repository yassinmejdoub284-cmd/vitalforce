"use client";

/**
 * Sons de l'admin, synthétisés avec Web Audio (aucun fichier audio à charger).
 * Le choix est propre à chaque appareil (localStorage).
 */
export const soundOptions = [
  { id: "cash", label: "Caisse « cha-ching » 💰" },
  { id: "coins", label: "Pièces qui tombent 🪙" },
  { id: "bell", label: "Clochette 🔔" },
  { id: "chime", label: "Carillon (3 notes)" },
  { id: "pop", label: "Bulle (discret)" },
  { id: "knock", label: "Toc toc 🚪" },
  { id: "beep", label: "Bip bip" },
  { id: "none", label: "Aucun son" }
] as const;

export type SoundId = (typeof soundOptions)[number]["id"];
export type SoundPrefs = { order: SoundId; visitor: SoundId; visitorsEnabled: boolean; volume: number };

const PREFS_KEY = "vf_admin_sounds";
export const defaultSoundPrefs: SoundPrefs = { order: "cash", visitor: "pop", visitorsEnabled: true, volume: 0.8 };

export function loadSoundPrefs(): SoundPrefs {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") as Partial<SoundPrefs>;
    const valid = (id: unknown): id is SoundId => soundOptions.some((option) => option.id === id);
    return {
      order: valid(saved.order) ? saved.order : defaultSoundPrefs.order,
      visitor: valid(saved.visitor) ? saved.visitor : defaultSoundPrefs.visitor,
      visitorsEnabled: typeof saved.visitorsEnabled === "boolean" ? saved.visitorsEnabled : defaultSoundPrefs.visitorsEnabled,
      volume: typeof saved.volume === "number" ? Math.min(1, Math.max(0, saved.volume)) : defaultSoundPrefs.volume
    };
  } catch {
    return defaultSoundPrefs;
  }
}

export function saveSoundPrefs(prefs: SoundPrefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* navigation privée */ }
}

let context: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  return context;
}

/** Les navigateurs bloquent le son tant que l'utilisateur n'a pas touché la page: on débloque au premier geste. */
export function unlockAudio() {
  const ctx = audio();
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
}

function envelope(ctx: AudioContext, out: AudioNode, start: number, peak: number, attack: number, decay: number) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);
  gain.connect(out);
  return gain;
}

function tone(ctx: AudioContext, out: AudioNode, start: number, frequency: number, duration: number, peak: number, type: OscillatorType = "sine", endFrequency?: number) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  if (endFrequency) osc.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
  osc.connect(envelope(ctx, out, start, peak, 0.005, duration));
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** Cloche métallique: partiels inharmoniques qui s'éteignent à des vitesses différentes. */
function bellTone(ctx: AudioContext, out: AudioNode, start: number, frequency: number, duration: number, peak: number) {
  [[1, 1], [2.76, 0.45], [5.4, 0.22], [8.93, 0.1]].forEach(([ratio, level], index) => {
    tone(ctx, out, start, frequency * ratio, duration / (1 + index * 0.6), peak * level);
  });
}

function noise(ctx: AudioContext, out: AudioNode, start: number, duration: number, peak: number, frequency: number, q = 1) {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = frequency;
  filter.Q.value = q;
  source.connect(filter);
  filter.connect(envelope(ctx, out, start, peak, 0.002, duration));
  source.start(start);
  source.stop(start + duration + 0.02);
}

const recipes: Record<Exclude<SoundId, "none">, (ctx: AudioContext, out: AudioNode, t: number) => void> = {
  cash: (ctx, out, t) => {
    noise(ctx, out, t, 0.06, 0.5, 1800, 0.8);           // tiroir-caisse
    tone(ctx, out, t + 0.01, 180, 0.08, 0.35, "triangle");
    bellTone(ctx, out, t + 0.09, 2637, 0.35, 0.45);      // « cha »
    bellTone(ctx, out, t + 0.22, 3520, 1.1, 0.55);       // « ching »
    for (let i = 0; i < 6; i += 1) tone(ctx, out, t + 0.3 + i * 0.055 + Math.random() * 0.02, 4200 + Math.random() * 1800, 0.12, 0.08);
  },
  coins: (ctx, out, t) => {
    for (let i = 0; i < 9; i += 1) {
      const at = t + i * 0.07 * (1 - i * 0.04) + Math.random() * 0.015;
      bellTone(ctx, out, at, 2400 + Math.random() * 2200, 0.25, 0.3 * (1 - i * 0.07));
      noise(ctx, out, at, 0.02, 0.15, 6000, 2);
    }
  },
  bell: (ctx, out, t) => bellTone(ctx, out, t, 1320, 1.6, 0.6),
  chime: (ctx, out, t) => [1046.5, 1318.5, 1568].forEach((frequency, index) => tone(ctx, out, t + index * 0.13, frequency, 0.7, 0.4, "triangle")),
  pop: (ctx, out, t) => tone(ctx, out, t, 520, 0.12, 0.5, "sine", 1150),
  knock: (ctx, out, t) => [0, 0.16].forEach((offset) => { noise(ctx, out, t + offset, 0.07, 0.9, 260, 1.5); tone(ctx, out, t + offset, 140, 0.08, 0.6, "sine", 90); }),
  beep: (ctx, out, t) => [0, 0.18].forEach((offset) => tone(ctx, out, t + offset, 880, 0.1, 0.25, "square"))
};

export function playSound(id: SoundId, volume = 0.8) {
  if (id === "none" || volume <= 0) return;
  const ctx = audio();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);
  recipes[id](ctx, master, ctx.currentTime + 0.02);
}
