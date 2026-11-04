export type DeliveryPricing = { fee: number; included: boolean; freeThreshold: number };

/** Frais de livraison payés par le client pour un sous-total donné. */
export function deliveryFeeFor(subtotal: number, delivery: DeliveryPricing) {
  if (subtotal <= 0 || delivery.included) return 0;
  if (delivery.freeThreshold > 0 && subtotal >= delivery.freeThreshold) return 0;
  return delivery.fee;
}

export function roundMoney(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function formatMoney(value: number, suffix = "DT") {
  const formatted = new Intl.NumberFormat("fr-TN", { numberingSystem: "latn", maximumFractionDigits: 3 }).format(value);
  return `${formatted} ${suffix}`;
}
