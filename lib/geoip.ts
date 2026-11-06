import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import { isIP } from "node:net";
import maxmind, { type Reader, type Response } from "maxmind";

/**
 * Géolocalisation IP locale (aucun service externe): base « DB-IP City Lite » (licence CC BY 4.0)
 * téléchargée sur le serveur par scripts/update-geoip.sh. Précision: ville/gouvernorat pour les
 * connexions fixes; les connexions 4G sortent souvent par Tunis.
 */
const GEO_DIR = process.env.GEOIP_DIR || "/srv/vitalforce/geo";

/** Deux formats possibles: ip-location-db (city = texte) ou GeoIP2 (city.names). */
type LooseRecord = { city?: string | { names?: Record<string, string> }; country_code?: string; state1?: string; country?: { iso_code?: string }; subdivisions?: { names?: Record<string, string> }[] };

export type GeoLocation = { country: string | null; city: string | null; region: string | null };

const readers = new Map<string, Promise<Reader<Response> | null>>();

function open(file: string) {
  if (!readers.has(file)) {
    const full = path.join(GEO_DIR, file);
    readers.set(file, existsSync(full)
      ? maxmind.open<Response>(full, { cache: { max: 5000 } }).catch((error) => { console.error("[geoip]", full, error); return null; })
      : Promise.resolve(null));
  }
  return readers.get(file)!;
}

function clean(value: string | undefined | null) {
  if (!value) return null;
  return value.replace(/\s+Governorate$/i, "").replace(/^Gouvernorat (de |d')/i, "").trim().slice(0, 60) || null;
}

export function clientIp(headers: Headers) {
  const raw = headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0] ?? "";
  const ip = raw.trim().replace(/^::ffff:/, "");
  return isIP(ip) ? ip : null;
}

/** Ville, gouvernorat et pays d'une adresse IP, ou null si la base n'est pas installée. */
export async function locateIp(ip: string | null): Promise<GeoLocation | null> {
  if (!ip || /^(127\.|10\.|192\.168\.|::1$)/.test(ip)) return null;
  const version = isIP(ip);
  const reader = (await open(version === 6 ? "dbip-city-ipv6.mmdb" : "dbip-city-ipv4.mmdb")) ?? (await open("dbip-city-lite.mmdb"));
  if (!reader) return null;
  try {
    const record = reader.get(ip) as unknown as LooseRecord | null;
    if (!record) return null;
    const city = typeof record.city === "string" ? record.city : record.city?.names?.fr ?? record.city?.names?.en;
    return {
      country: record.country_code ?? record.country?.iso_code ?? null,
      city: clean(city),
      region: clean(record.state1 ?? record.subdivisions?.[0]?.names?.fr ?? record.subdivisions?.[0]?.names?.en)
    };
  } catch {
    return null;
  }
}
