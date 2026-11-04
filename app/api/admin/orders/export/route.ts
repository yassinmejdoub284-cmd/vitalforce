import { adminRoute } from "@/lib/api";
import { listOrders } from "@/lib/order-queries";
import { orderLabel } from "@/lib/orders";

const cell = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  // Neutralise les formules (=, +, -, @) à l'ouverture dans Excel.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[";\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export const GET = adminRoute(async (request) => {
  const url = new URL(request.url);
  const filters = Object.fromEntries(url.searchParams.entries());
  const { orders } = await listOrders(filters, { all: true });
  const header = ["Numéro", "Date", "Statut", "Client", "Téléphone", "Téléphone 2", "Email", "Gouvernorat", "Ville", "Adresse", "Articles", "Sous-total", "Livraison", "Total", "Code Jetpack", "État Jetpack", "Motif", "Payée par Jetpack", "Source", "Page", "utm_campaign", "Note"];
  const lines = orders.map((order) => [
    order.number, order.createdAt.toISOString(), orderLabel(order.status), order.customerName, order.phone, order.phone2, order.email, order.governorate, order.city, order.address,
    order.items.map((item) => `${item.quantity}x ${item.name}`).join(" + "), order.subtotal, order.deliveryFee, order.total, order.carrierBarcode, order.carrierState, order.carrierReason,
    order.carrierPaid ? "oui" : "non", order.source, order.landingAngle, order.utm?.utm_campaign, order.note
  ].map(cell).join(";"));
  const csv = "﻿" + [header.join(";"), ...lines].join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="commandes-vitalforce-${new Date().toISOString().slice(0, 10)}.csv"` } });
});
