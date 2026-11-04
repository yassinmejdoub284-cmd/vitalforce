import "server-only";
import { inArray } from "drizzle-orm";
import webpush from "web-push";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";

let configured = false;

export function pushConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function configure() {
  if (configured || !pushConfigured()) return configured;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@vitalforce-bioactive.com", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  configured = true;
  return true;
}

export type PushMessage = { title: string; body: string; url?: string; tag?: string };

/** Envoie la notification à tous les appareils admin abonnés; les abonnements expirés sont supprimés. */
export async function notifyAdmins(message: PushMessage) {
  if (!configure()) return { sent: 0 };
  const subscriptions = await db.select().from(pushSubscriptions);
  const expired: number[] = [];
  let sent = 0;
  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        JSON.stringify(message),
        { TTL: 3600, urgency: "high", topic: message.tag?.slice(0, 32).replace(/[^a-zA-Z0-9_-]/g, "") || undefined }
      );
      sent += 1;
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) expired.push(subscription.id);
      else console.error("[push]", status, (error as Error).message);
    }
  }));
  if (expired.length) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, expired));
  return { sent };
}
