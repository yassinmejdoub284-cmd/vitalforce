"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveReview, removeReview } from "@/app/admin/(panel)/reviews/actions";
import { api } from "./client-api";

type Review = { id: number; name: string; body: string; photoId: string | null };

export function ReviewForm({ review }: { review?: Review }) {
  const [photoId, setPhoto] = useState(review?.photoId ?? null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try { await action(); } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }

  return <form className="adm-card" onSubmit={event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    void run(async () => {
      await saveReview({ id: review?.id, name: String(data.get("name") ?? ""), body: String(data.get("body") ?? ""), photoId });
      if (!review) { form.reset(); setPhoto(null); }
      setMessage("Avis publié."); router.refresh();
    });
  }}>
    <h2>{review ? "Modifier l’avis" : "Publier un avis client"}</h2>
    <fieldset disabled={busy} className="adm-form-grid">
      <label className="adm-field">Prénom (facultatif)<input className="adm-input" name="name" maxLength={80} defaultValue={review?.name} /></label>
      <label className="adm-field adm-span-2">Texte ou légende<textarea className="adm-input" name="body" dir="auto" rows={3} maxLength={1200} defaultValue={review?.body} /></label>
      <label className="adm-field">Photo ou capture de l’avis
        <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={event => {
          const file = event.target.files?.[0];
          if (!file) return;
          const data = new FormData(); data.append("file", file);
          void run(async () => { const { url } = await api<{ url: string }>("/api/admin/media", { body: data }); setPhoto(url.split("/").pop()!); });
        }} />
        <small>3 Mo maximum. Masquez les coordonnées avant publication.</small>
      </label>
      {photoId && <div><Image unoptimized src={`/api/media/${photoId}`} width={150} height={110} style={{ objectFit: "contain" }} alt="Aperçu de l’avis" />
        <button type="button" className="adm-btn adm-btn-sm" onClick={() => setPhoto(null)}>Retirer la photo</button></div>}
      <div className="adm-row adm-span-2"><button className="adm-btn adm-btn-primary">{busy ? "En cours…" : "Publier"}</button>
        {review && <button type="button" className="adm-btn" onClick={() => { if (window.confirm("Retirer cet avis du site ?")) void run(async () => { await removeReview(review.id); router.refresh(); }); }}>Retirer cet avis</button>}
      </div>
    </fieldset>
    {message && <p role="status">{message}</p>}
  </form>;
}
