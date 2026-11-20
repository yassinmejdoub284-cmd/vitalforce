import Image from "next/image";
import { getReviews } from "@/lib/reviews";
import styles from "./customer-reviews.module.css";

export async function CustomerReviews({ lang = "fr", whatsapp }: { lang?: "fr" | "ar"; whatsapp?: string }) {
  const reviews = await getReviews();
  if (!reviews.length && !whatsapp) return null;
  const arabic = lang === "ar";
  const photoLabel = arabic ? "تصويرة من رأي حريف" : "Photo d’un avis client";
  return (
    <section className={styles.section} data-live-section="reviews" aria-labelledby="customer-reviews-title" lang={lang} dir={arabic ? "rtl" : "ltr"}>
      <h2 id="customer-reviews-title" className={styles.title}>{arabic ? "آراء الحرفاء" : "Avis clients"}</h2>
      {reviews.length > 0 && <ul className={styles.list} tabIndex={reviews.length > 1 ? 0 : undefined}>
        {reviews.map(review => <li key={review.id}>
          <figure className={styles.card}>
            {review.photoId && <a data-live-action="reviewPhoto" href={`/api/media/${review.photoId}`} target="_blank" rel="noopener noreferrer">
              <Image unoptimized src={`/api/media/${review.photoId}`} alt={review.name ? `${photoLabel} · ${review.name}` : photoLabel} width={420} height={300} />
            </a>}
            {review.body && <blockquote dir="auto">{review.body}</blockquote>}
            {review.name && <figcaption dir="auto">{review.name}</figcaption>}
          </figure>
        </li>)}
      </ul>}
      {whatsapp && <a className={styles.share} href={`https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("السلام، جرّبت VITAL FORCE ونحب نشارك رأيي.")}`}>جرّبت VITAL FORCE؟ شاركنا رأيك على واتساب</a>}
    </section>
  );
}
