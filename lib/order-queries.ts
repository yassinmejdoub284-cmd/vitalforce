import "server-only";
import { and, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderItems, orders, orderStatuses, type OrderStatus } from "@/lib/db/schema";
import { TZ } from "@/lib/stats";

export type OrderFilters = { status?: string; q?: string; from?: string; to?: string; governorate?: string; page?: number; paid?: string; returning?: string };
export const PAGE_SIZE = 50;

function where(filters: OrderFilters) {
  const conditions: SQL[] = [];
  if (filters.status && (orderStatuses as readonly string[]).includes(filters.status)) conditions.push(eq(orders.status, filters.status as OrderStatus));
  if (filters.governorate) conditions.push(eq(orders.governorate, filters.governorate));
  if (filters.paid === "yes") conditions.push(eq(orders.carrierPaid, true));
  if (filters.paid === "no") conditions.push(and(eq(orders.status, "delivered"), eq(orders.carrierPaid, false))!);
  if (filters.returning === "yes") conditions.push(sql`(${orders.status} = 'shipped' and (lower(${orders.carrierState}) in ('rtn depot','a verifier','rtn client/agence','rtn definitif') or lower(${orders.carrierPreState}) = 'retour'))`);
  if (filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from)) conditions.push(sql`${orders.createdAt} >= ((${filters.from}::date)::timestamp at time zone ${TZ})`);
  if (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to)) conditions.push(sql`${orders.createdAt} < (((${filters.to}::date + 1))::timestamp at time zone ${TZ})`);
  const q = filters.q?.trim();
  if (q) {
    const digits = q.replace(/\D/g, "");
    const like = `%${q.replace(/[%_]/g, "")}%`;
    conditions.push(or(ilike(orders.customerName, like), ilike(orders.number, like), ilike(orders.city, like), ilike(orders.address, like), ...(digits.length >= 3 ? [ilike(orders.phone, `%${digits.slice(-8)}%`), ilike(orders.carrierBarcode, `%${digits}%`)] : []))!);
  }
  return conditions.length ? and(...conditions) : undefined;
}

export async function listOrders(filters: OrderFilters, options: { all?: boolean } = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const condition = where(filters);
  const query = db.select().from(orders).where(condition).orderBy(desc(orders.createdAt));
  const rows = options.all ? await query.limit(5000) : await query.limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE);
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(orders).where(condition);
  const items = rows.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, rows.map((row) => row.id))) : [];
  const itemsByOrder = new Map<number, typeof items>();
  for (const item of items) itemsByOrder.set(item.orderId, [...(itemsByOrder.get(item.orderId) ?? []), item]);
  return { orders: rows.map((row) => ({ ...row, items: itemsByOrder.get(row.id) ?? [] })), total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function statusCounts(filters: OrderFilters) {
  const condition = where({ ...filters, status: undefined });
  const rows = await db.select({ status: orders.status, count: sql<number>`count(*)::int` }).from(orders).where(condition).groupBy(orders.status);
  const counts = Object.fromEntries(orderStatuses.map((status) => [status, 0])) as Record<OrderStatus, number>;
  for (const row of rows) counts[row.status] = row.count;
  return counts;
}
