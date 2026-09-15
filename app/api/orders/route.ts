import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentAdapter } from "@/lib/payment";
import { checkoutSchema } from "@/lib/validations";
import { createShipmentReference, getDeliveryQuotes } from "@/lib/delivery";

export async function GET() {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const payload = checkoutSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Veuillez vérifier les informations de commande.", issues: payload.error.flatten() }, { status: 400 });
  }

  const currentProducts = await prisma.product.findMany({
    where: { id: { in: payload.data.items.map((item) => item.productId) }, active: true }
  });
  const productById = new Map(currentProducts.map((product) => [product.id, product]));
  if (payload.data.items.some((item) => !productById.get(item.productId) || (productById.get(item.productId)?.stock ?? 0) < item.quantity)) {
    return NextResponse.json({ error: "Un produit n'est plus disponible dans la quantité demandée." }, { status: 409 });
  }
  const priceById = new Map(currentProducts.map((product) => [product.id, product.price]));
  if (payload.data.items.some((item) => priceById.get(item.productId) !== item.price)) {
    return NextResponse.json({ error: "Un prix a changé. Actualisez votre panier avant de commander." }, { status: 409 });
  }
  const subtotal = payload.data.items.reduce((sum, item) => sum + (priceById.get(item.productId) ?? 0) * item.quantity, 0);
  const settings = await prisma.siteSetting.findUnique({ where: { id: "site" } });
  const selectedQuote = getDeliveryQuotes(subtotal, settings ?? undefined).find((quote) => quote.company === payload.data.deliveryCompany);
  const deliveryFee = selectedQuote?.fee ?? settings?.deliveryFee ?? 7;
  const total = subtotal + deliveryFee;
  const payment = await getPaymentAdapter(payload.data.paymentMethod).charge(payload.data, total);
  if (!payment.ok) {
    return NextResponse.json({ error: "Paiement refusé." }, { status: 402 });
  }

  const count = await prisma.order.count();
  const number = `VF-${String(1001 + count).padStart(4, "0")}`;
  const order = await prisma.order.create({
    data: {
      number,
      customerName: payload.data.customerName,
      phone: payload.data.phone,
      email: payload.data.email || null,
      address: payload.data.address,
      city: payload.data.city,
      note: payload.data.note,
      paymentMethod: payload.data.paymentMethod,
      paymentStatus: payment.status,
      paymentRef: payment.providerRef,
      deliveryCompany: payload.data.deliveryCompany,
      trackingNumber: createShipmentReference(payload.data.deliveryCompany, number),
      subtotal,
      deliveryFee,
      total,
      items: {
        create: payload.data.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      }
    },
    include: { items: true }
  });

  await Promise.all(
    payload.data.items.map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      })
    )
  );

  return NextResponse.json({ order }, { status: 201 });
}
