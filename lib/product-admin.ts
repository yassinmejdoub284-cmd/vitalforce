import "server-only";
import { z } from "zod";
import { slugify } from "@/lib/utils";

const money = z.coerce.number().min(0).max(100000);

export const productInputSchema = z.object({
  name: z.string().trim().min(2, "Nom requis.").max(120),
  nameAr: z.string().trim().max(120).nullish().transform((value) => value || null),
  slug: z.string().trim().max(120).optional(),
  subtitle: z.string().trim().max(200).default(""),
  description: z.string().trim().max(2000).default(""),
  sku: z.string().trim().min(2, "Référence (SKU) requise.").max(60),
  flavor: z.string().trim().max(60).default(""),
  netWeight: z.string().trim().max(40).default(""),
  price: z.coerce.number().positive("Prix de vente requis.").max(100000),
  compareAtPrice: z.union([z.literal(""), z.null(), money]).optional().transform((value) => (value === "" || value === null || value === undefined || value === 0 ? null : Number(value))),
  costPrice: money.default(0),
  packagingCost: money.default(0),
  stock: z.coerce.number().int().min(0).max(1_000_000).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).max(100000).default(20),
  image: z.string().trim().max(500).refine((value) => !value || value.startsWith("/") || /^https:\/\//.test(value), "Image: lien https:// ou image importée.").default(""),
  template: z.enum(["vital-force", "simple"]).default("simple"),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0)
}).transform((value) => ({ ...value, slug: slugify(value.slug || value.name) }))
  .refine((value) => value.slug.length >= 2, { message: "Lien (slug) invalide.", path: ["slug"] })
  .refine((value) => value.compareAtPrice === null || value.compareAtPrice > value.price, { message: "Le prix barré doit être supérieur au prix de vente.", path: ["compareAtPrice"] });
