export function DiscountBadge({ percent, lang = "fr" }: { percent?: number; lang?: "fr" | "ar" }) {
  if (!percent) return null;
  return <span className="sale-badge" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
    {lang === "ar" ? `تخفيض ${percent}%` : `Réduction de ${percent} %`}
  </span>;
}
