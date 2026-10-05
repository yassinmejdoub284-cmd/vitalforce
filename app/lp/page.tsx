import Image from "next/image";
import Link from "next/link";
import { ArrowUpLeft } from "lucide-react";
import { landingPages } from "@/lib/landing-pages";
import { productBenefitsAr } from "@/lib/product-benefits";

export const metadata = { title: { absolute: "اختر روتينك | VITAL FORCE تونس" }, description: "اكتشف صفحات VITAL FORCE حسب اهتماماتك، وتعرّف على المكوّنات وملاءمة المنتج." };
export default function LandingDirectory() {
  return <main className="lp-directory lp-shell">
    <Link href="/" className="lp-brand" dir="ltr">VITAL FORCE<span>روتين نباتي يومي</span></Link>
    <p className="lp-kicker">روتينك، بطريقتك</p><h1>كل نهار حكاية.<br /><em>اختار البداية متاعك.</em></h1>
    <p className="lp-intro">{new Intl.NumberFormat("ar-TN").format(landingPages.length)} مسارات، نفس التركيبة النباتية. اكتشف المكوّنات، واختر الزاوية والنكهة اللي تناسبك.</p>
    <section className="lp-benefits" aria-labelledby="directory-benefits-title"><h2 id="directory-benefits-title">{productBenefitsAr.title}</h2><p>{productBenefitsAr.paragraph}</p></section>
    <div className="lp-directory-grid">{landingPages.map((page, index) => <Link href={`/lp/${page.slug}`} key={page.slug} className="lp-directory-card">
      <div className={page.visualImage ? "lp-directory-poster" : undefined}><Image src={page.visualImage ?? page.image} alt={page.imageAlt} width={page.visualImage ? 1024 : 1536} height={page.visualImage ? 1536 : 1024} sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 33vw" /><span>0{index + 1}</span></div>
      <p>{page.eyebrow}</p><h2>{page.name}<ArrowUpLeft size={22} /></h2><span>اكتشف روتينك</span>
    </Link>)}</div>
    <p className="lp-fineprint">مكمّل غذائي، وليس دواءً. لا يعوّض الغذاء المتوازن. الصور توضيحية مولّدة.</p>
  </main>;
}
