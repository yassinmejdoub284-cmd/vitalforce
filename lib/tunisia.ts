/** Gouvernorats acceptés par l'API Jetpack (orthographe exacte de la documentation). */
export const governorates = [
  { value: "Ariana", ar: "أريانة" },
  { value: "Ben Arous", ar: "بن عروس" },
  { value: "Bizerte", ar: "بنزرت" },
  { value: "Béja", ar: "باجة" },
  { value: "Gabès", ar: "قابس" },
  { value: "Gafsa", ar: "قفصة" },
  { value: "Jendouba", ar: "جندوبة" },
  { value: "Kairouan", ar: "القيروان" },
  { value: "Kasserine", ar: "القصرين" },
  { value: "Kébili", ar: "قبلي" },
  { value: "La Manouba", ar: "منوبة" },
  { value: "Le Kef", ar: "الكاف" },
  { value: "Mahdia", ar: "المهدية" },
  { value: "Monastir", ar: "المنستير" },
  { value: "Médenine", ar: "مدنين" },
  { value: "Nabeul", ar: "نابل" },
  { value: "Sfax", ar: "صفاقس" },
  { value: "Sidi Bouzid", ar: "سيدي بوزيد" },
  { value: "Siliana", ar: "سليانة" },
  { value: "Sousse", ar: "سوسة" },
  { value: "Tataouine", ar: "تطاوين" },
  { value: "Tozeur", ar: "توزر" },
  { value: "Tunis", ar: "تونس" },
  { value: "Zaghouan", ar: "زغوان" }
] as const;

export const governorateValues = governorates.map((item) => item.value) as [string, ...string[]];

/**
 * Normalise un numéro tunisien en 8 chiffres.
 * Accepte +216, 00216, espaces, points et tirets. Les numéros tunisiens commencent par 2, 3, 4, 5, 7 ou 9.
 */
export function normalizeTunisianPhone(input: string): string | null {
  const digits = input.replace(/[\s.\-()/]/g, "").replace(/^(\+|00)216/, "").replace(/^216(?=\d{8}$)/, "");
  return /^[234579]\d{7}$/.test(digits) ? digits : null;
}

export function formatTunisianPhone(phone: string) {
  return phone.length === 8 ? `${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5)}` : phone;
}
