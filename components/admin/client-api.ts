"use client";

export async function api<T = Record<string, unknown>>(url: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(url, {
    method: options.method ?? (options.body ? "POST" : "GET"),
    headers: options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : undefined,
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store"
  });
  if (response.status === 401) {
    window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    throw new Error("Session expirée.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as { error?: string }).error ?? `Erreur ${response.status}`);
  return data as T;
}

export { money, percent, shortDate } from "@/lib/format";
