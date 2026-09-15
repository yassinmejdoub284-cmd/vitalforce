import { prisma } from "@/lib/prisma";
import { SettingsEditor } from "@/components/admin/settings-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin réglages" };

export default async function SettingsPage() {
  const settings = await prisma.siteSetting.upsert({ where: { id: "site" }, update: {}, create: {} });
  return (
    <section>
      <h1 className="font-display text-5xl font-bold">Réglages</h1>
      <SettingsEditor initialSettings={settings} />
    </section>
  );
}
