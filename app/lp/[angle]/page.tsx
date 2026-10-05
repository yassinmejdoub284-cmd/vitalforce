import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CampaignLanding } from "@/components/landing/campaign-landing";
import { getLandingPage, landingPages } from "@/lib/landing-pages";

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
  return <CampaignLanding page={page} />;
}
