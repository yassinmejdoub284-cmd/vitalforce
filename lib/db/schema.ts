import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex
} from "drizzle-orm/pg-core";

const money = (name: string) => numeric(name, { precision: 12, scale: 3, mode: "number" });
const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => "bytea" });
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date());

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  subtitle: text("subtitle").notNull().default(""),
  description: text("description").notNull().default(""),
  sku: text("sku").notNull().unique(),
  flavor: text("flavor").notNull().default(""),
  netWeight: text("net_weight").notNull().default(""),
  price: money("price").notNull(),
  compareAtPrice: money("compare_at_price"),
  /** Coût de production d'une unité. */
  costPrice: money("cost_price").notNull().default(0),
  /** Emballage / étiquette / goodies par unité expédiée. */
  packagingCost: money("packaging_cost").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(20),
  image: text("image").notNull().default(""),
  /** "vital-force" affiche la formule, les ingrédients et le mode d'emploi VITAL FORCE. */
  template: text("template").notNull().default("simple"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt()
});

export const orderStatuses = ["pending", "no_answer", "confirmed", "cancelled", "shipped", "delivered", "returned"] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  number: text("number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  phone2: text("phone2"),
  email: text("email"),
  governorate: text("governorate").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull(),
  note: text("note"),
  status: text("status").$type<OrderStatus>().notNull().default("pending"),
  callAttempts: integer("call_attempts").notNull().default(0),
  cancelReason: text("cancel_reason"),
  internalNote: text("internal_note"),
  subtotal: money("subtotal").notNull(),
  deliveryFee: money("delivery_fee").notNull().default(0),
  discount: money("discount").notNull().default(0),
  total: money("total").notNull(),
  /** Coûts figés au moment de la commande pour que les stats restent justes si les réglages changent. */
  carrierCost: money("carrier_cost").notNull().default(0),
  returnCost: money("return_cost").notNull().default(0),
  confirmationCost: money("confirmation_cost").notNull().default(0),
  source: text("source").notNull().default("site"),
  landingAngle: text("landing_angle"),
  utm: jsonb("utm").$type<Record<string, string>>(),
  visitorId: text("visitor_id"),
  fbp: text("fbp"),
  fbc: text("fbc"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  carrier: text("carrier"),
  carrierBarcode: text("carrier_barcode"),
  carrierState: text("carrier_state"),
  carrierPreState: text("carrier_pre_state"),
  carrierReason: text("carrier_reason"),
  carrierPreReason: text("carrier_pre_reason"),
  carrierPaid: boolean("carrier_paid").notNull().default(false),
  carrierPaidAt: timestamp("carrier_paid_at", { withTimezone: true }),
  carrierSyncedAt: timestamp("carrier_synced_at", { withTimezone: true }),
  carrierError: text("carrier_error"),
  stockReserved: boolean("stock_reserved").notNull().default(false),
  metaPurchaseSentAt: timestamp("meta_purchase_sent_at", { withTimezone: true }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  shippedAt: timestamp("shipped_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  returnedAt: timestamp("returned_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt()
}, (table) => [
  index("orders_status_idx").on(table.status),
  index("orders_phone_idx").on(table.phone),
  index("orders_created_idx").on(table.createdAt),
  index("orders_barcode_idx").on(table.carrierBarcode)
]);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  name: text("name").notNull(),
  unitPrice: money("unit_price").notNull(),
  unitCost: money("unit_cost").notNull().default(0),
  packagingCost: money("packaging_cost").notNull().default(0),
  quantity: integer("quantity").notNull()
}, (table) => [index("order_items_order_idx").on(table.orderId)]);

export const orderEvents = pgTable("order_events", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  message: text("message").notNull(),
  actor: text("actor").notNull().default("system"),
  createdAt: createdAt()
}, (table) => [index("order_events_order_idx").on(table.orderId)]);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: updatedAt()
});

export const visitors = pgTable("visitors", {
  id: text("id").primaryKey(),
  firstSeen: timestamp("first_seen", { withTimezone: true }).notNull().defaultNow(),
  lastSeen: timestamp("last_seen", { withTimezone: true }).notNull().defaultNow(),
  currentPath: text("current_path"),
  landingPath: text("landing_path"),
  referrer: text("referrer"),
  source: text("source"),
  utm: jsonb("utm").$type<Record<string, string>>(),
  device: text("device"),
  country: text("country"),
  city: text("city"),
  pageViews: integer("page_views").notNull().default(0)
}, (table) => [index("visitors_last_seen_idx").on(table.lastSeen)]);

export const trackingEventTypes = ["page_view", "view_content", "add_to_cart", "initiate_checkout", "purchase"] as const;
export type TrackingEventType = (typeof trackingEventTypes)[number];

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  visitorId: text("visitor_id").notNull(),
  type: text("type").$type<TrackingEventType>().notNull(),
  path: text("path"),
  angle: text("angle"),
  source: text("source"),
  value: money("value"),
  createdAt: createdAt()
}, (table) => [
  index("events_created_idx").on(table.createdAt),
  index("events_type_created_idx").on(table.type, table.createdAt)
]);

export const adSpend = pgTable("ad_spend", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull(),
  platform: text("platform").notNull().default("meta"),
  campaign: text("campaign").notNull().default("Total"),
  amount: money("amount").notNull(),
  impressions: integer("impressions"),
  clicks: integer("clicks"),
  landingPageViews: integer("landing_page_views"),
  pixelPurchases: integer("pixel_purchases"),
  pixelCheckouts: integer("pixel_checkouts"),
  source: text("source").notNull().default("manual"),
  createdAt: createdAt()
}, (table) => [uniqueIndex("ad_spend_day_campaign_idx").on(table.date, table.platform, table.campaign)]);

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  adminId: integer("admin_id"),
  userAgent: text("user_agent"),
  createdAt: createdAt()
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default("Admin"),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt()
});

export const loginAttempts = pgTable("login_attempts", {
  id: serial("id").primaryKey(),
  ip: text("ip").notNull(),
  email: text("email"),
  success: boolean("success").notNull(),
  createdAt: createdAt()
}, (table) => [index("login_attempts_ip_idx").on(table.ip, table.createdAt)]);

export const blacklist = pgTable("blacklist", {
  phone: text("phone").primaryKey(),
  reason: text("reason").notNull().default(""),
  createdAt: createdAt()
});

export const media = pgTable("media", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()::text`),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  data: bytea("data").notNull(),
  createdAt: createdAt()
});

export type ProductRow = typeof products.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
