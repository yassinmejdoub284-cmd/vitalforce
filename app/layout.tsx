import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import "./storefront.css";
import { SiteChrome } from "@/components/layout/site-chrome";
import { CartProvider } from "@/components/cart/cart-provider";
import { MetaPixel } from "@/components/integrations/meta-pixel";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const fallbackSiteUrl = vercelHost ? `https://${vercelHost}` : "http://localhost:3000";
let siteUrl = fallbackSiteUrl;
try {
  siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || fallbackSiteUrl).toString();
} catch {
  // A malformed deployment variable should not prevent the site from building.
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "VITAL FORCE Tunisie | Complément alimentaire naturel",
    template: "%s | VITAL FORCE"
  },
  description:
    "Boutique officielle VITAL FORCE: mélange de plantes naturelles, 7 ingrédients, achat en TND et gestion de commandes locale.",
  openGraph: {
    title: "VITAL FORCE Tunisie",
    description: "Complément alimentaire botanique VITAL FORCE aux goûts orange, citron et menthe, avec sept ingrédients à découvrir.",
    type: "website",
    locale: "fr_TN",
    siteName: "VITAL FORCE"
  },
  icons: {
    icon: "/favicon.svg"
  }
};

export const viewport: Viewport = {
  themeColor: "#0b4f32",
  colorScheme: "light"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-scroll-behavior="smooth" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <CartProvider>
          <MetaPixel />
          <SiteChrome>{children}</SiteChrome>
        </CartProvider>
      </body>
    </html>
  );
}
