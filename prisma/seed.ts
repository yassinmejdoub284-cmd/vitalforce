import { PrismaClient } from "@prisma/client";
import { products } from "../lib/product-data";

const prisma = new PrismaClient();

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        subtitle: product.subtitle,
        sku: product.sku,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stock: product.stock,
        flavor: product.flavor,
        netWeight: product.netWeight,
        image: product.image,
        shortDescription: product.shortDescription,
        active: true
      },
      create: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        subtitle: product.subtitle,
        sku: product.sku,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stock: product.stock,
        flavor: product.flavor,
        netWeight: product.netWeight,
        image: product.image,
        shortDescription: product.shortDescription,
        active: true
      }
    });
  }

  await prisma.siteSetting.upsert({
    where: { id: "site" },
    update: {},
    create: {
      id: "site",
      siteName: "VITAL FORCE",
      phone: "+216 27 200 603",
      address: "Sfax, Tunisie",
      deliveryFee: 7,
      freeShippingThreshold: 180
    }
  });

  await prisma.coupon.upsert({
    where: { code: "VITAL10" },
    update: {},
    create: {
      code: "VITAL10",
      description: "Remise de lancement",
      percentOff: 10,
      active: true
    }
  });

  const firstProduct = await prisma.product.findUnique({ where: { slug: "vital-force-400g-orange" } });
  if (firstProduct) {
    const existing = await prisma.order.findUnique({ where: { number: "VF-1001" } });
    if (!existing) {
      await prisma.order.create({
        data: {
          number: "VF-1001",
          customerName: "Client Démo",
          phone: "+216 20 000 000",
          email: "client@example.com",
          address: "Rue Habib Bourguiba",
          city: "Sfax",
          status: "confirmed",
          paymentMethod: "cod",
          paymentStatus: "pending",
          deliveryCompany: "local_courier",
          trackingNumber: "LOCAL-VF-1001-DEMO",
          subtotal: firstProduct.price,
          deliveryFee: 7,
          total: firstProduct.price + 7,
          items: {
            create: [{ productId: firstProduct.id, name: firstProduct.name, price: firstProduct.price, quantity: 1 }]
          }
        }
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
