export type DeliveryCompany = "local_courier" | "aramex" | "intigo" | "pickup";

export type DeliveryQuote = {
  company: DeliveryCompany;
  label: string;
  fee: number;
  eta: string;
};

export type DeliverySettings = { deliveryFee: number; freeShippingThreshold: number };

const companies: Record<DeliveryCompany, Omit<DeliveryQuote, "company">> = {
  local_courier: { label: "Coursier local", fee: 7, eta: "24-72 h selon la ville" },
  aramex: { label: "Aramex Tunisie", fee: 9.5, eta: "2-4 jours ouvrables" },
  intigo: { label: "Intigo", fee: 8, eta: "24-72 h zones couvertes" },
  pickup: { label: "Retrait sur place", fee: 0, eta: "Après confirmation téléphonique" }
};

export function getDeliveryQuotes(subtotal: number, settings: DeliverySettings = { deliveryFee: 7, freeShippingThreshold: 180 }): DeliveryQuote[] {
  return (Object.keys(companies) as DeliveryCompany[]).map((company) => ({
    company,
    ...companies[company],
    fee: subtotal >= settings.freeShippingThreshold ? 0 : company === "local_courier" ? settings.deliveryFee : companies[company].fee
  }));
}

export function createShipmentReference(company: DeliveryCompany, orderNumber: string) {
  return company === "pickup" ? null : `${company.toUpperCase()}-${orderNumber}-${Date.now().toString().slice(-5)}`;
}

export function getDeliveryLabel(company: string) {
  return companies[company as DeliveryCompany]?.label ?? "Coursier local";
}
