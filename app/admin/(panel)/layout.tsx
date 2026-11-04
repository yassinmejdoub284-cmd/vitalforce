import { count, eq } from "drizzle-orm";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/shell";
import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdminPage();
  const [{ pending }] = await db.select({ pending: count() }).from(orders).where(eq(orders.status, "pending"));
  return <AdminShell adminName={admin.name} initialPending={pending}>{children}</AdminShell>;
}
