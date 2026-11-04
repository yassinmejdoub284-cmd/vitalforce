import { after, NextResponse } from "next/server";
import { handleError, jsonError, readJson } from "@/lib/api";
import { hasDatabase } from "@/lib/db";
import { purchaseEventId } from "@/lib/meta-server";
import { afterOrderCreated, createOrder } from "@/lib/orders";

export async function POST(request: Request) {
  if (!hasDatabase()) return jsonError("La commande en ligne est momentanément indisponible. Appelez-nous pour commander.", 503);
  const body = await readJson(request);
  // Une commande passée depuis la boutique ne peut jamais se déclarer « admin ».
  if (body && typeof body === "object" && body.source === "admin") body.source = "site";
  try {
    const { order, settings, pageUrl } = await createOrder(body, {
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent")
    });
    after(() => afterOrderCreated(order, settings, pageUrl));
    return NextResponse.json({
      order: { number: order.number, total: order.total, subtotal: order.subtotal, deliveryFee: order.deliveryFee, items: order.items },
      eventId: purchaseEventId(order.number),
      purchaseOn: settings.meta.purchaseOn
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
