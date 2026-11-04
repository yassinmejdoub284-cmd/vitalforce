/** Montant en dinars: 3 décimales max pour les petits montants, arrondi au dinar au-delà de 1000. */
export const money = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const max = Math.abs(value) >= 1000 ? 0 : 3;
  return `${new Intl.NumberFormat("fr-TN", { numberingSystem: "latn", maximumFractionDigits: max }).format(value)} DT`;
};

export const percent = (value: number | null | undefined) => (value === null || value === undefined ? "—" : `${(value * 100).toFixed(value < 0.1 ? 1 : 0)} %`);

export const shortDate = (value: string | Date) => new Intl.DateTimeFormat("fr-TN", { timeZone: "Africa/Tunis", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value));

export const day = (value: string | Date) => new Intl.DateTimeFormat("fr-TN", { timeZone: "Africa/Tunis", day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
export const count = (value: number | null | undefined) => (value === null || value === undefined ? "—" : new Intl.NumberFormat("fr-TN", { numberingSystem: "latn" }).format(value));
