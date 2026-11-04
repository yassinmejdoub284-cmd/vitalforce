import { desc } from "drizzle-orm";
import { SettingsEditor } from "@/components/admin/settings-editor";
import { PageHeader } from "@/components/admin/shell";
import { db } from "@/lib/db";
import { blacklist } from "@/lib/db/schema";
import { pushConfigured } from "@/lib/push";
import { getSettings, maskedSettings } from "@/lib/settings";

export const metadata = { title: "Gestion du site" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [{ tab }, config, blocked] = await Promise.all([searchParams, getSettings(), db.select().from(blacklist).orderBy(desc(blacklist.createdAt)).limit(200)]);
  const host = process.env.NEXT_PUBLIC_SITE_URL || "";
  return <>
    <PageHeader title="Gestion du site" subtitle="Tout ce qui s'affiche sur le site et les connexions (Meta, Jetpack, notifications)." />
    <SettingsEditor
      initial={maskedSettings(config)}
      initialTab={tab}
      blacklist={blocked.map((row) => ({ phone: row.phone, reason: row.reason, createdAt: row.createdAt.toISOString() }))}
      env={{ push: pushConfigured(), cron: Boolean(process.env.CRON_SECRET), siteUrl: host }}
    />
  </>;
}
