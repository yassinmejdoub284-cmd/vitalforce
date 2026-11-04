import { LiveVisitors } from "@/components/admin/live-visitors";
import { PageHeader } from "@/components/admin/shell";

export const metadata = { title: "Visiteurs en direct" };

export default function LivePage() {
  return <>
    <PageHeader title="Visiteurs en direct" subtitle="Personnes actives sur le site dans la dernière minute · actualisé toutes les 5 secondes" />
    <LiveVisitors />
  </>;
}
