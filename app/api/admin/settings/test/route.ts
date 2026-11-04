import { NextResponse } from "next/server";
import { adminRoute, jsonError, readJson } from "@/lib/api";
import { trackJetpackOrders } from "@/lib/jetpack";
import { fetchAdInsights } from "@/lib/meta-server";
import { notifyAdmins, pushConfigured } from "@/lib/push";
import { getSettings } from "@/lib/settings";
import { shiftDay, todayInTunis } from "@/lib/stats";

/** Vérifie une connexion (Jetpack, Meta Ads, notifications) sans rien modifier. */
export const POST = adminRoute(async (request) => {
  const { target } = await readJson(request);
  const config = await getSettings();
  if (target === "jetpack") {
    // Un code inexistant renvoie « introuvable » si le token est bon, « Token invalide » sinon.
    await trackJetpackOrders(config.jetpack.trackToken, ["000000000000"]);
    return NextResponse.json({ ok: true, message: "Connexion Jetpack (tracking) OK." });
  }
  if (target === "meta-ads") {
    const rows = await fetchAdInsights(config.meta, shiftDay(todayInTunis(), -7), todayInTunis());
    return NextResponse.json({ ok: true, message: `Compte publicitaire OK · ${rows.length} ligne(s) sur 7 jours.` });
  }
  if (target === "push") {
    if (!pushConfigured()) return jsonError("Clés VAPID absentes: ajoutez NEXT_PUBLIC_VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY.");
    const { sent } = await notifyAdmins({ title: "🔔 Test VITAL FORCE", body: "Les notifications fonctionnent sur cet appareil.", url: "/admin", tag: "test" });
    return NextResponse.json({ ok: sent > 0, message: sent ? `Notification envoyée à ${sent} appareil(s).` : "Aucun appareil abonné: activez les notifications d'abord." });
  }
  return jsonError("Test inconnu.");
});
