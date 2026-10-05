import Image from "next/image";
import Link from "next/link";
import { ArrowUpLeft } from "lucide-react";
import { landingPages } from "@/lib/landing-pages";
import { productBenefitsAr } from "@/lib/product-benefits";
import styles from "./campaign-gallery.module.css";

export function CampaignGallery() {
  return <section className={styles.section} lang="ar" dir="rtl" aria-labelledby="campaign-gallery-title" id="campaigns">
    <div className="container-shell">
      <div className={styles.intro}>
        <p className={styles.kicker}>VITAL FORCE · العناية، بطريقتك</p>
        <h2 id="campaign-gallery-title">{productBenefitsAr.title}</h2>
        <p>{productBenefitsAr.paragraph}</p>
      </div>
      <div className={styles.heading}><h3>اختار الزاوية اللي تهمّك.</h3><Link href="/lp">شوف كل الصفحات<ArrowUpLeft size={18} /></Link></div>
      <div className={styles.grid}>{landingPages.map(page => <Link className={styles.card} href={`/lp/${page.slug}`} key={page.slug}>
        <div className={styles.art}><Image src={page.visualImage ?? page.image} alt={page.imageAlt} width={page.visualImage ? 1024 : 1536} height={page.visualImage ? 1536 : 1024} sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 1000px) 45vw, 30vw" /></div>
        <div className={styles.caption}><h4>{page.name}</h4><span>اكتشف الصفحة<ArrowUpLeft size={18} /></span></div>
      </Link>)}</div>
    </div>
  </section>;
}
