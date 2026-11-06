import "server-only";
import type { OrderStatus } from "@/lib/db/schema";

/** Client de l'API Jetpack (https://jetpack.tn/apis-v2), selon la documentation fournie. */
const BASE_URL = process.env.JETPACK_API_URL || "https://jetpack.tn/apis-v2";

export type JetpackOrderInput = {
  nom: string;
  tel: string;
  tel2?: string;
  adresse: string;
  ville: string;
  gouvernerat: string;
  prix: number;
  designation?: string;
  article?: string;
  nb_article?: number;
  fragile?: boolean;
  ouvrir?: boolean;
  msg?: string;
};

export type JetpackTrackResult = {
  code: string;
  found: boolean;
  paid: boolean;
  state: string;
  reason: string;
  preState: string;
  preReason: string;
  error?: string;
};

export class JetpackError extends Error {}

async function post(endpoint: string, token: string, body: Record<string, string>) {
  if (!token) throw new JetpackError("Token Jetpack manquant. Ajoutez-le dans Réglages → Jetpack.");
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: { "X-Api-Key": token, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json", "User-Agent": "VitalForce-Admin/1.0" },
      body: new URLSearchParams(body).toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000)
    });
  } catch (error) {
    const cause = (error as { cause?: { code?: string } }).cause?.code;
    throw new JetpackError(`serveur injoignable (${cause ?? (error as Error).name}).`);
  }
  const text = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    console.error("[jetpack] réponse non JSON", endpoint, response.status, text.slice(0, 500));
    throw new JetpackError(`Réponse illisible (HTTP ${response.status}): ${text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160) || "vide"}`);
  }
  return data as Record<string, unknown>;
}

export async function addJetpackOrder(token: string, input: JetpackOrderInput): Promise<string> {
  const data = await post("add_order.php", token, {
    nom: input.nom,
    tel: input.tel,
    tel2: input.tel2 ?? "",
    adresse: input.adresse,
    ville: input.ville,
    gouvernerat: input.gouvernerat,
    prix: input.prix.toFixed(3),
    designation: input.designation ?? "",
    article: input.article ?? "",
    nb_article: String(input.nb_article ?? 1),
    echange: "0",
    fragile: input.fragile ? "1" : "0",
    ouvrir: input.ouvrir ? "1" : "0",
    msg: input.msg ?? ""
  });
  if (Number(data.status) !== 1 || !data.status_message) throw new JetpackError(String(data.status_message ?? "Erreur Jetpack inconnue."));
  return String(data.status_message);
}

/** Suivi par lots de 200 codes (limite Jetpack). Le débit (30 requêtes/minute) est respecté par l'appelant. */
export async function trackJetpackOrders(token: string, codes: string[]): Promise<JetpackTrackResult[]> {
  const unique = [...new Set(codes.filter(Boolean))].slice(0, 200);
  if (unique.length === 0) return [];
  const data = await post("track_order.php", token, { codes: unique.join(",") });
  if (Number(data.status) !== 1) throw new JetpackError(String(data.status_message ?? "Suivi Jetpack indisponible."));
  const commandes = (data.commandes ?? {}) as Record<string, Record<string, unknown>>;
  return unique.map((code) => {
    const item = commandes[code];
    if (!item || item.status === 0 || String(item.status_message ?? "").startsWith("ERREUR")) {
      return { code, found: false, paid: false, state: "", reason: "", preState: "", preReason: "", error: String(item?.status_message ?? "Commande introuvable") };
    }
    return {
      code,
      found: true,
      paid: String(item.status ?? "").toLowerCase() === "payee",
      state: String(item.etat ?? ""),
      reason: String(item.motif ?? ""),
      preState: String(item["pre-etat"] ?? ""),
      preReason: String(item["pre-motif"] ?? "")
    };
  });
}

const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const finalReturnStates = new Set(["retour recu", "retour paye", "retour expediteur", "rtn definitif"]);
const returningStates = new Set(["rtn depot", "a verifier", "rtn client/agence"]);

/** Traduit l'état Jetpack vers le statut de la commande dans l'admin. */
export function statusFromCarrier(state: string): OrderStatus | null {
  const value = normalize(state);
  if (!value) return null;
  if (value === "livrer") return "delivered";
  if (finalReturnStates.has(value)) return "returned";
  if (value === "supprime") return "cancelled";
  return "shipped";
}

export function isReturning(state: string) {
  const value = normalize(state);
  return finalReturnStates.has(value) || returningStates.has(value);
}

export const jetpackStates = ["En attente", "A enlever", "Enleve", "Au magasin", "En cours", "Echange", "Rtn depot", "A verifier", "Livrer", "Rtn definitif", "Rtn client/agence", "Retour Expediteur", "Retour recu", "Retour paye", "Supprime", "Non recu"];
