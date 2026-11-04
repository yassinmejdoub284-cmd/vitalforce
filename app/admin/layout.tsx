import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./admin.css";

export const metadata: Metadata = {
  title: { default: "VITAL FORCE Admin", template: "%s · VF Admin" },
  robots: { index: false, follow: false },
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: { capable: true, title: "VF Admin", statusBarStyle: "black-translucent" },
  icons: { icon: "/admin-icons/icon-192.png", apple: "/admin-icons/apple-touch-icon.png" }
};

export const viewport: Viewport = { themeColor: "#111111", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="adm">{children}</div>;
}
