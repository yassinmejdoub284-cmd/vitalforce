import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CampaignLanding } from "@/components/landing/campaign-landing";
import { getLandingPage, landingPages } from "@/lib/landing-pages";
import { getCatalog } from "@/lib/catalog";
import { getPublicSettings } from "@/lib/settings";

export function generateStaticParams() { return landingPages.map(page => ({ angle: page.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ angle: string }> }): Promise<Metadata> {
  const page = getLandingPage((await params).angle);
  if (!page) return {};
  const title = `${page.name} | VITAL FORCE تونس`;
  const socialImage = page.visualImage ?? page.image;
  return {
    title: { absolute: title }, description: page.description,
    alternates: { canonical: `/lp/${page.slug}` },
    openGraph: { title, description: page.description, locale: "ar_TN", type: "website", url: `/lp/${page.slug}`, images: [{ url: socialImage, width: page.visualImage ? 1024 : 1536, height: page.visualImage ? 1536 : 1024, alt: page.imageAlt }] },
    twitter: { card: "summary_large_image", title, description: page.description, images: [socialImage] }
  };
}
export default async function LandingPage({ params }: { params: Promise<{ angle: string }> }) {
  const page = getLandingPage((await params).angle);
  if (!page) notFound();
  const [{ products, live }, settings] = await Promise.all([getCatalog(), getPublicSettings()]);
  // Les pages de vente présentent la formule VITAL FORCE (accessoires et autres produits restent dans la boutique).
  const formula = products.filter((product) => product.template === "vital-force");
  return <CampaignLanding page={page} products={formula.length ? formula : products} settings={settings} ordersLive={live} />;
}
