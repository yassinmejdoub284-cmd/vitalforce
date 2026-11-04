"use client";

import { LogOut } from "lucide-react";

export function LogoutButton() {
  return <button type="button" className="adm-btn adm-btn-red" onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); window.location.href = "/admin/login"; }}>
    <LogOut size={16} />Se déconnecter
  </button>;
}
