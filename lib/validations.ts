import { z } from "zod";
import { orderStatuses, paymentStatuses } from "@/lib/product-data";

export const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  subtitle: z.string().min(2),
  sku: z.string().min(2),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
  flavor: z.string().min(2),
  netWeight: z.string().min(1),
  shortDescription: z.string().min(10),
  image: z.string().min(1)
});

export const productUpdateSchema = productSchema.partial().extend({ active: z.boolean().optional() });

export const checkoutSchema = z.object({
  customerName: z.string().min(3, "Nom complet requis"),
  phone: z.string().min(8, "Numéro de téléphone requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  address: z.string().min(8, "Adresse requise"),
  city: z.string().min(2, "Ville requise"),
  note: z.string().optional(),
  paymentMethod: z.enum(["cod", "mock_card"]),
  deliveryCompany: z.enum(["local_courier", "aramex", "intigo", "pickup"]).default("local_courier"),
  items: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      price: z.number().positive(),
      quantity: z.number().int().positive()
    })
  ).min(1)
});

export const orderUpdateSchema = z.object({
  status: z.enum(orderStatuses),
  paymentStatus: z.enum(paymentStatuses)
});

export const settingsSchema = z.object({
  siteName: z.string().min(2),
  phone: z.string().min(4),
  address: z.string().min(4),
  freeShippingThreshold: z.coerce.number().min(0),
  deliveryFee: z.coerce.number().min(0)
});
