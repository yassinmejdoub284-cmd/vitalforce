"use client";

import Image from "next/image";
import { Loader2, LogIn } from "lucide-react";
import { useState } from "react";

export function LoginForm({ next }: { next: string }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: data.get("email"), password: data.get("password") }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setError(body.error ?? "Connexion impossible."); setLoading(false); return; }
    window.location.href = next;
  }

  return <div className="adm-login">
    <form onSubmit={submit}>
      <Image src="/images/v2/logo.png" alt="VITAL FORCE" width={120} height={78} priority />
      <h1 className="adm-title" style={{ textAlign: "center", fontSize: 22 }}>Espace administration</h1>
      <label className="adm-field">Email<input className="adm-input" name="email" type="email" autoComplete="username" required /></label>
      <label className="adm-field">Mot de passe<input className="adm-input" name="password" type="password" autoComplete="current-password" required minLength={6} /></label>
      {error && <p className="adm-alert adm-alert-error" role="alert">{error}</p>}
      <button className="adm-btn adm-btn-primary" disabled={loading} style={{ minHeight: 46 }}>{loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}Se connecter</button>
    </form>
  </div>;
}
