import { actions, maxSteps, sections, storefrontPath, type Action, type LiveActivity, type LiveStep, type Section } from "@/lib/live-activity";
import { getVisitorId } from "@/lib/visitor";

function sectionOf(target: Element | null, path: string): Section {
  const tag = target?.closest("[data-live-section],header,footer");
  const key = tag?.getAttribute("data-live-section");
  if (key && Object.hasOwn(sections, key)) return key as Section;
  if (tag?.tagName === "HEADER") return "header";
  if (tag?.tagName === "FOOTER") return "footer";
  if (path.startsWith("/products/")) return "product";
  switch (path) {
    case "/lp": return "campaigns";
    case "/products": return "catalog";
    case "/cart": return "cart";
    case "/checkout": return "order";
    case "/confirmation": return "confirmation";
    case "/viewer": return "viewer";
    default: return "page";
  }
}

function actionOf(target: Element, section: Section): Action {
  const control = target.closest("a,button,summary,input,textarea,select,label,[role=button]");
  if (!control) return "area";
  const flavor = control.getAttribute("data-live-flavor");
  if (flavor === "orange" || flavor === "citron" || flavor === "menthe") return flavor;
  const action = control.getAttribute("data-live-action");
  if (action && Object.hasOwn(actions, action)) return action as Action;
  if (control.matches("input,textarea,select,label")) return "field";
  if (control.matches("summary")) return section === "faq" ? "faq" : "details";
  if (control.matches('a[href="#order"]')) return "order";
  if (control.matches('a[href$="#ingredients"]')) return "ingredients";
  if (control.matches('a[href^="https://wa.me/"]')) return "whatsapp";
  if (control.matches('a[href^="/products/"]')) return "product";
  if (control.matches('a[href="/checkout"]')) return "checkout";
  if (control.matches("a")) return "link";
  if (control.matches('button[type="submit"]')) return "submit";
  if (section === "flavor" || section === "quantity") return section;
  return "button";
}

let lastTimestamp = 0;

export function observeLivePage(path: string, history: LiveStep[]) {
  if (!storefrontPath.test(path) || navigator.doNotTrack === "1" ||
      (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
  const view = crypto.randomUUID();
  const vid = getVisitorId();
  const foreground = () => document.visibilityState === "visible" && document.hasFocus();
  const center = () => sectionOf(document.elementFromPoint(innerWidth / 2, innerHeight / 2), path);
  let active = foreground();
  let section = center();
  let elapsed = 0;
  let tick = performance.now();
  let lastSent = -Infinity;
  let visited = false;
  let pending: number | undefined;

  function step(action: Action, area: Section) {
    const at = Date.now();
    if (history.length && at - history[history.length - 1].at > 30 * 60_000) history.length = 0;
    history.push({ path, section: area, action, at });
    if (history.length > maxSteps) history.shift();
  }

  function sample() {
    const now = performance.now();
    if (active) elapsed += Math.min(now - tick, 1500);
    tick = now;
    if (!active) return;
    const next = center();
    if (next !== section) {
      section = next;
      elapsed = 0;
    }
  }

  function send() {
    window.clearTimeout(pending);
    pending = undefined;
    lastSent = performance.now();
    const range = document.documentElement.scrollHeight - innerHeight;
    const scroll = range > 0 ? Math.max(0, Math.min(100, Math.round(scrollY * 100 / range))) : 0;
    lastTimestamp = Math.max(Date.now(), lastTimestamp + 1);
    const activity: LiveActivity = { view, path, at: lastTimestamp, foreground: active, section, seconds: Math.min(86400, Math.floor(elapsed / 1000)), scroll, steps: history };
    const body = JSON.stringify({ vid, activity });
    try {
      if (navigator.sendBeacon?.("/api/t/live", new Blob([body], { type: "application/json" }))) return;
    } catch { /* use fetch when beacon is unavailable */ }
    void fetch("/api/t/live", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
  }

  function update(next: boolean) {
    sample();
    const changed = next !== active;
    active = next;
    if (active && !visited) { step("visit", center()); visited = true; }
    if ((changed && visited) || (active && performance.now() - lastSent >= 4500)) send();
  }
  function refresh() { update(foreground()); }
  function pause() { update(false); }
  function click(event: MouseEvent) {
    if (!(event.target instanceof Element) || !foreground()) return;
    refresh();
    const area = sectionOf(event.target, path);
    step(actionOf(event.target, area), area);
    if (pending === undefined) pending = window.setTimeout(send, 200);
  }

  refresh();
  const timer = window.setInterval(refresh, 1000);
  document.addEventListener("click", click, true);
  document.addEventListener("visibilitychange", refresh);
  window.addEventListener("focus", refresh);
  window.addEventListener("blur", pause);
  window.addEventListener("pagehide", pause);
  return () => {
    pause();
    window.clearTimeout(pending);
    window.clearInterval(timer);
    document.removeEventListener("click", click, true);
    document.removeEventListener("visibilitychange", refresh);
    window.removeEventListener("focus", refresh);
    window.removeEventListener("blur", pause);
    window.removeEventListener("pagehide", pause);
  };
}
