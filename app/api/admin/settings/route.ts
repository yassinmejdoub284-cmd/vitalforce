import { NextResponse } from "next/server";
import { adminRoute, jsonError, readJson } from "@/lib/api";
import { getSettings, maskedSettings, saveSettingsGroup, settingsGroups, type SettingsGroup } from "@/lib/settings";

export const GET = adminRoute(async () => NextResponse.json({ settings: maskedSettings(await getSettings()) }));

export const PATCH = adminRoute(async (request) => {
  const { group, values } = await readJson(request);
  if (!settingsGroups.includes(group)) return jsonError("Section de réglages inconnue.");
  await saveSettingsGroup(group as SettingsGroup, values ?? {});
  return NextResponse.json({ settings: maskedSettings(await getSettings()) });
});
