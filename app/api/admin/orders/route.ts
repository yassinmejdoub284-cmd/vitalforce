import { after, NextResponse } from "next/server";
import { adminRoute, readJson } from "@/lib/api";
import { afterOrderCreated, createOrder } from "@/lib/orders";

/** Commande saisie à la main (téléphone, Messenger, boutique physique). */
export const POST = adminRoute(async (request, { admin }) => {
  const body = await readJson(request);
  const { order, settings } = await createOrder({ ...body, source: "admin" }, { actor: admin.name });
  after(() => afterOrderCreated(order, { ...settings, notifications: { ...settings.notifications, newOrder: false } }));
  return NextResponse.json({ order }, { status: 201 });
});
