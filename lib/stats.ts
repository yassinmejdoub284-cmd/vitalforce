import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const TZ = "Africa/Tunis";

export type Range = { from: string; to: string };

export function todayInTunis() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function shiftDay(day: string, delta: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

export function rangeFromPreset(preset: string | undefined, from?: string, to?: string): Range & { preset: string } {
  const today = todayInTunis();
  const valid = (value?: string) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined);
  if (preset === "custom" && valid(from) && valid(to)) return { from: valid(from)! <= valid(to)! ? from! : to!, to: from! <= to! ? to! : from!, preset };
  if (preset === "today") return { from: today, to: today, preset };
  if (preset === "yesterday") return { from: shiftDay(today, -1), to: shiftDay(today, -1), preset };
  if (preset === "30d") return { from: shiftDay(today, -29), to: today, preset };
  if (preset === "month") return { from: `${today.slice(0, 8)}01`, to: today, preset };
  if (preset === "90d") return { from: shiftDay(today, -89), to: today, preset };
  return { from: shiftDay(today, -6), to: today, preset: "7d" };
}

/** Filtre « jour local tunisien » sur une colonne timestamptz (bornes calculées en Africa/Tunis). */
const inRange = (column: string, range: Range) => {
  const col = sql.raw(column);
  return sql`${col} >= ((${range.from}::date)::timestamp at time zone ${TZ}) and ${col} < (((${range.to}::date + 1))::timestamp at time zone ${TZ})`;
};

type Row = Record<string, unknown>;
const num = (value: unknown) => Number(value ?? 0);
const numbers = <K extends string>(row: Row | undefined, keys: readonly K[]) => Object.fromEntries(keys.map((key) => [key, num(row?.[key])])) as Record<K, number>;
async function rows<T extends Row = Row>(query: ReturnType<typeof sql>) {
  const result = await db.execute(query);
  return result.rows as T[];
}

export async function getDashboardStats(range: Range) {
  const config = await getSettings();
  const days = Math.round((new Date(`${range.to}T00:00:00Z`).getTime() - new Date(`${range.from}T00:00:00Z`).getTime()) / 86_400_000) + 1;

  const [orderTotals] = await rows(sql`
    select
      count(*)::int as received,
      count(*) filter (where status = 'pending')::int as pending,
      count(*) filter (where status = 'no_answer')::int as no_answer,
      count(*) filter (where status = 'cancelled')::int as cancelled,
      count(*) filter (where confirmed_at is not null and status <> 'cancelled')::int as confirmed,
      count(*) filter (where status = 'confirmed')::int as to_ship,
      count(*) filter (where status = 'shipped')::int as in_transit,
      count(*) filter (where status = 'delivered')::int as delivered,
      count(*) filter (where status = 'returned')::int as returned,
      coalesce(sum(total) filter (where status = 'delivered'), 0) as delivered_revenue,
      coalesce(sum(total) filter (where status = 'shipped'), 0) as transit_value,
      coalesce(sum(total) filter (where carrier_paid), 0) as collected,
      coalesce(sum(total) filter (where status = 'delivered' and not carrier_paid), 0) as awaiting_payment,
      coalesce(sum(carrier_cost) filter (where status = 'delivered'), 0) as carrier_cost,
      coalesce(sum(return_cost) filter (where status = 'returned'), 0) as return_cost,
      coalesce(sum(confirmation_cost), 0) as confirmation_cost
    from orders where ${inRange("created_at", range)}`);

  const [itemTotals] = await rows(sql`
    select
      coalesce(sum(i.unit_cost * i.quantity) filter (where o.status = 'delivered'), 0) as cogs_delivered,
      coalesce(sum(i.unit_cost * i.quantity) filter (where o.status = 'returned'), 0) as cogs_returned,
      coalesce(sum(i.packaging_cost * i.quantity) filter (where o.status in ('shipped','delivered','returned')), 0) as packaging,
      coalesce(sum(i.quantity) filter (where o.status = 'delivered'), 0)::int as units_delivered
    from order_items i join orders o on o.id = i.order_id where ${inRange("o.created_at", range)}`);

  const [ads] = await rows(sql`
    select coalesce(sum(amount), 0) as spend, coalesce(sum(impressions), 0)::int as impressions, coalesce(sum(clicks), 0)::int as clicks,
      coalesce(sum(landing_page_views), 0)::int as lpv, coalesce(sum(pixel_purchases), 0)::int as pixel_purchases, coalesce(sum(pixel_checkouts), 0)::int as pixel_checkouts,
      count(*) filter (where source = 'meta-api')::int as api_rows
    from ad_spend where date between ${range.from}::date and ${range.to}::date`);

  const [traffic] = await rows(sql`
    select
      count(distinct visitor_id) filter (where type = 'page_view')::int as visitors,
      count(*) filter (where type = 'page_view')::int as page_views,
      count(distinct visitor_id) filter (where type = 'view_content')::int as view_content,
      count(distinct visitor_id) filter (where type = 'add_to_cart')::int as add_to_cart,
      count(distinct visitor_id) filter (where type = 'initiate_checkout')::int as initiate_checkout,
      count(distinct visitor_id) filter (where type = 'purchase')::int as purchasers
    from events where ${inRange("created_at", range)}`);

  const o = numbers(orderTotals, ["received", "pending", "no_answer", "cancelled", "confirmed", "to_ship", "in_transit", "delivered", "returned", "delivered_revenue", "transit_value", "collected", "awaiting_payment", "carrier_cost", "return_cost", "confirmation_cost"]);
  const it = numbers(itemTotals, ["cogs_delivered", "cogs_returned", "packaging", "units_delivered"]);
  const ad = numbers(ads, ["spend", "impressions", "clicks", "lpv", "pixel_purchases", "pixel_checkouts", "api_rows"]);
  const tr = numbers(traffic, ["visitors", "page_views", "view_content", "add_to_cart", "initiate_checkout", "purchasers"]);

  const lostGoods = config.orders.restockOnReturn ? 0 : it.cogs_returned;
  const fixed = (config.costs.monthlyFixed * days) / 30;
  const operating = it.cogs_delivered + it.packaging + o.carrier_cost + o.return_cost + o.confirmation_cost + lostGoods;
  const grossProfit = o.delivered_revenue - operating;
  const netProfit = grossProfit - ad.spend - fixed;
  const finished = o.delivered + o.returned;
  const ratio = (a: number, b: number) => (b > 0 ? a / b : null);

  return {
    range, days,
    orders: o,
    costs: { cogs: it.cogs_delivered, packaging: it.packaging, carrier: o.carrier_cost, returns: o.return_cost, confirmation: o.confirmation_cost, lostGoods, ads: ad.spend, fixed, total: operating + ad.spend + fixed },
    unitsDelivered: it.units_delivered,
    profit: { gross: grossProfit, net: netProfit, perDelivered: ratio(netProfit, o.delivered), margin: ratio(netProfit, o.delivered_revenue) },
    rates: {
      confirmation: ratio(o.confirmed, o.received - o.pending - o.no_answer),
      delivery: ratio(o.delivered, finished),
      return: ratio(o.returned, finished),
      conversion: ratio(o.received, tr.visitors),
      cancellation: ratio(o.cancelled, o.received)
    },
    unitCosts: {
      cpl: ratio(ad.spend, o.received),
      cpaConfirmed: ratio(ad.spend, o.confirmed),
      costPerDelivered: ratio(operating + ad.spend + fixed, o.delivered),
      roas: ratio(o.delivered_revenue, ad.spend)
    },
    ads: { ...ad, ctr: ratio(ad.clicks, ad.impressions), cpm: ratio(ad.spend * 1000, ad.impressions), pixelConversion: ratio(ad.pixel_purchases, ad.lpv || ad.clicks), pixelCpa: ratio(ad.spend, ad.pixel_purchases) },
    traffic: tr
  };
}

export async function getDailySeries(range: Range) {
  return rows<{ day: string; orders: number; confirmed: number; delivered: number; revenue: number; visitors: number; spend: number }>(sql`
    with days as (select generate_series(${range.from}::date, ${range.to}::date, interval '1 day')::date as day),
    o as (select (created_at at time zone ${TZ})::date as day, count(*)::int as orders,
            count(*) filter (where confirmed_at is not null and status <> 'cancelled')::int as confirmed,
            count(*) filter (where status = 'delivered')::int as delivered,
            coalesce(sum(total) filter (where status = 'delivered'), 0)::float as revenue
          from orders where ${inRange("created_at", range)} group by 1),
    v as (select (created_at at time zone ${TZ})::date as day, count(distinct visitor_id)::int as visitors from events where type = 'page_view' and ${inRange("created_at", range)} group by 1),
    a as (select date as day, sum(amount)::float as spend from ad_spend where date between ${range.from}::date and ${range.to}::date group by 1)
    select to_char(days.day, 'YYYY-MM-DD') as day, coalesce(o.orders, 0) as orders, coalesce(o.confirmed, 0) as confirmed, coalesce(o.delivered, 0) as delivered,
      coalesce(o.revenue, 0) as revenue, coalesce(v.visitors, 0) as visitors, coalesce(a.spend, 0) as spend
    from days left join o using (day) left join v using (day) left join a using (day) order by days.day`);
}

export async function getBreakdowns(range: Range) {
  const [sources, angles, governorates, productsSold] = await Promise.all([
    rows<{ source: string; visitors: number; orders: number }>(sql`
      with v as (select coalesce(source, 'direct') as source, count(distinct visitor_id)::int as visitors from events where type = 'page_view' and ${inRange("created_at", range)} group by 1),
      o as (select case
              when lower(utm->>'utm_source') ~ '^(fb|facebook|meta)' or utm ? 'fbclid' then 'facebook'
              when lower(utm->>'utm_source') ~ '^(ig|instagram)' then 'instagram'
              when coalesce(utm->>'utm_source', '') <> '' then left(lower(utm->>'utm_source'), 30)
              when source = 'admin' then 'admin' else 'direct' end as source, count(*)::int as orders
            from orders where ${inRange("created_at", range)} group by 1)
      select coalesce(v.source, o.source) as source, coalesce(v.visitors, 0) as visitors, coalesce(o.orders, 0) as orders
      from v full join o on o.source = v.source order by visitors desc, orders desc limit 12`),
    rows<{ angle: string; visitors: number; orders: number; delivered: number }>(sql`
      with v as (select coalesce(angle, case when path like '/lp/%' then substring(path from 5) else 'boutique' end) as angle, count(distinct visitor_id)::int as visitors
                 from events where type = 'page_view' and ${inRange("created_at", range)} group by 1),
      o as (select coalesce(landing_angle, case when source = 'admin' then 'admin' else 'boutique' end) as angle, count(*)::int as orders, count(*) filter (where status = 'delivered')::int as delivered
            from orders where ${inRange("created_at", range)} group by 1)
      select coalesce(v.angle, o.angle) as angle, coalesce(v.visitors, 0) as visitors, coalesce(o.orders, 0) as orders, coalesce(o.delivered, 0) as delivered
      from v full join o using (angle) order by orders desc, visitors desc limit 15`),
    rows<{ governorate: string; orders: number; delivered: number; returned: number }>(sql`
      select governorate, count(*)::int as orders, count(*) filter (where status = 'delivered')::int as delivered, count(*) filter (where status = 'returned')::int as returned
      from orders where ${inRange("created_at", range)} group by 1 order by 2 desc limit 24`),
    rows<{ name: string; ordered: number; delivered: number; revenue: number }>(sql`
      select i.name, sum(i.quantity) filter (where o.status <> 'cancelled')::int as ordered, coalesce(sum(i.quantity) filter (where o.status = 'delivered'), 0)::int as delivered,
        coalesce(sum(i.unit_price * i.quantity) filter (where o.status = 'delivered'), 0)::float as revenue
      from order_items i join orders o on o.id = i.order_id where ${inRange("o.created_at", range)} group by 1 order by 2 desc nulls last`)
  ]);
  return { sources, angles, governorates, productsSold };
}

export async function getLiveVisitors() {
  return rows<{ id: string; current_path: string | null; source: string | null; device: string | null; city: string | null; country: string | null; page_views: number; first_seen: string; last_seen: string }>(sql`
    select id, current_path, source, device, city, country, page_views, first_seen, last_seen from visitors
    where last_seen > now() - interval '60 seconds' order by last_seen desc limit 100`);
}

export async function getLiveSummary() {
  const [summary] = await rows(sql`
    select
      (select count(*)::int from visitors where last_seen > now() - interval '60 seconds') as online,
      (select count(*)::int from visitors where last_seen > now() - interval '30 minutes') as last30,
      (select count(distinct visitor_id)::int from events where type = 'page_view' and created_at >= (((now() at time zone ${TZ})::date)::timestamp at time zone ${TZ})) as today_visitors,
      (select count(*)::int from orders where (created_at at time zone ${TZ})::date = (now() at time zone ${TZ})::date) as today_orders,
      (select count(*)::int from orders where status = 'pending') as pending`);
  return Object.fromEntries(Object.entries(summary).map(([key, value]) => [key, num(value)])) as { online: number; last30: number; today_visitors: number; today_orders: number; pending: number };
}

/** Taux réels observés sur 90 jours, utilisés comme valeurs par défaut du calculateur de rentabilité. */
export async function getObservedRates() {
  const [row] = await rows(sql`
    select count(*)::int as received,
      count(*) filter (where confirmed_at is not null and status <> 'cancelled')::int as confirmed,
      count(*) filter (where status = 'delivered')::int as delivered,
      count(*) filter (where status = 'returned')::int as returned
    from orders where created_at > now() - interval '90 days'`);
  const [ad] = await rows(sql`select coalesce(sum(amount), 0) as spend from ad_spend where date > (now() - interval '90 days')::date`);
  const received = num(row.received), confirmed = num(row.confirmed), delivered = num(row.delivered), returned = num(row.returned);
  return {
    received,
    confirmationRate: received >= 10 ? confirmed / received : null,
    deliveryRate: delivered + returned >= 10 ? delivered / (delivered + returned) : null,
    cpl: received >= 10 && num(ad.spend) > 0 ? num(ad.spend) / received : null
  };
}
