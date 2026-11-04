export const dynamic = "force-static";

export function GET() {
  const manifest = {
    name: "VITAL FORCE Admin",
    short_name: "VF Admin",
    description: "Commandes, livraisons, statistiques et visiteurs en temps réel.",
    id: "/admin",
    start_url: "/admin?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#111111",
    theme_color: "#111111",
    lang: "fr",
    icons: [
      { src: "/admin-icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/admin-icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/admin-icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ],
    shortcuts: [
      { name: "Commandes à confirmer", short_name: "À confirmer", url: "/admin/orders?status=pending", icons: [{ src: "/admin-icons/icon-192.png", sizes: "192x192" }] },
      { name: "Visiteurs en direct", short_name: "Live", url: "/admin/live", icons: [{ src: "/admin-icons/icon-192.png", sizes: "192x192" }] }
    ]
  };
  return new Response(JSON.stringify(manifest), { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" } });
}
