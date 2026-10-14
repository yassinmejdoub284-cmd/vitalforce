import Image from "next/image";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpLeft, Check, Leaf, ShieldCheck, Truck } from "lucide-react";
import { LandingOrder } from "./landing-order";
import { DiscountBadge } from "@/components/commerce/discount-badge";
import { arabicIngredientNames, ingredientReferences, type LandingPage } from "@/lib/landing-pages";
import { products, vitalForceIngredients } from "@/lib/product-data";

const ingredientFacts = [
  "بعض مستحضراتها دُرست للتوتر والنوم.",
  "يحتوي على مركّبات الكركمينويد.",
  "بعض مستحضراته دُرست للتعب والانتباه.",
  "جذر نباتي ضمن التركيبة.",
  "بذور تحتوي على ألياف.",
  "بعض مستحضراته دُرست لأنواع من الغثيان.",
  "يحتوي على البيبيرين."
];

export function CampaignLanding({ page }: { page: LandingPage }) {
  const target = page.informational ? "#ingredients" : "#order";
  const cta = page.informational ? "اكتشف المكوّنات" : "اختار نكهتك واطلب";
  const faq = [
    [page.question, page.answer],
    ["شنوّة الفرق بين النكهات؟", "نفس المزيج بثلاث نكهات: برتقال، ليمون ونعناع. راجع ملصق كل نكهة للتفاصيل."],
    ["وين نلقى معلومات المنتج الكاملة؟", `افتح «شوف الملصق الكامل» في ${page.informational ? "قسم معلومات المنتج" : "قسم الطلب"}: تلقى التركيبة، تعليمات المنتج واحتياطات الاستعمال لكل نكهة.`],
    ...(!page.informational ? [["كيفاش يتمّ الطلب؟", "اختار النكهة والكمية وافتح رسالة واتساب الجاهزة. أرسلها بنفسك؛ الفريق يؤكّد التوفر والعنوان والتوصيل بـ7 د.ت. فتح واتساب وحده لا يؤكّد الطلب."]] : [])
  ];
  return <main className="lp-page lp-visual-page lp-campaign-conversion" style={{ "--lp-accent": page.color } as React.CSSProperties}>
    <div className="lp-announcement">{page.informational ? "روتين نباتي للحياة اليومية" : <>توصيل في تونس <span>•</span> الدفع عند الاستلام بعد تأكيد الطلب</>}</div>
    <header className="lp-header lp-shell">
      <Link href="/lp" className="lp-brand" dir="ltr">VITAL FORCE<span>روتين نباتي يومي</span></Link>
      <a href={target} className="lp-header-cta">{page.informational ? "اكتشف التركيبة" : "اطلب توا"}<ArrowDownLeft size={17} /></a>
    </header>
    <section className={`lp-visual-hero lp-shell${page.visualImage ? " lp-has-poster" : ""}`} aria-labelledby="lp-title">
      <div className="lp-campaign-art">
        <h1 id="lp-title" className={page.visualImage ? "lp-visually-hidden" : "lp-art-headline"}>{page.title} {page.accent}</h1>
        <Image src={page.visualImage ?? page.image} alt={page.imageAlt} width={page.visualImage ? 1024 : 1280} height={page.visualImage ? 1536 : 853} preload sizes="(max-width: 800px) 100vw, 55vw" className={page.visualImage ? "lp-campaign-poster" : "lp-campaign-photo"} />
      </div>
      <div className="lp-visual-offer">
        <p className="lp-kicker">{page.name}</p>
        <h2 dir="ltr">VITAL <em>FORCE</em></h2>
        <p className="lp-visual-tagline">{page.title}<br />{page.accent}</p>
        <p className="lp-campaign-description">{page.description}</p>
        <div className="lp-ingredient-pills">{page.featured.map(index => <span key={index}>{arabicIngredientNames[index]}</span>)}</div>
        {!page.informational && <>
          <DiscountBadge percent={products[0].discountPercent} lang="ar" />
          <div className="lp-hero-offer"><strong>{products[0].price}<small>د.ت</small></strong><span>400 غ · التوصيل 7 د.ت<br />برتقال · ليمون · نعناع</span></div>
        </>}
        <div className="lp-value-strip"><strong>7 مكوّنات نباتية</strong><span>400 غ · ثلاث نكهات · {page.slug === "sport" ? "لحظة عناية ضمن روتينك الرياضي" : "لحظة عناية ضمن روتينك اليومي"}</span></div>
        <p className="lp-visual-evidence">{page.benefitCaption ?? "7 مكوّنات نباتية، بثلاث نكهات لروتينك اليومي."}</p>
        <a href={target} className="lp-primary">{cta}<ArrowDownLeft size={20} /></a>
        <p className="lp-micro"><ShieldCheck size={15} />{page.informational ? "مكوّنات واضحة · لحظة عناية يومية" : "الدفع عند الاستلام · 170 د.ت بالتوصيل لعبوة واحدة"}</p>
      </div>
    </section>
    {!page.informational && <div className="lp-proof lp-shell"><div><Leaf /><span><strong>7 مكوّنات</strong>تركيبة نباتية واضحة</span></div><div><Truck /><span><strong>توصيل في تونس</strong>7 د.ت للطلب</span></div><div><ShieldCheck /><span><strong>الدفع عند الاستلام</strong>بعد التأكيد مع الفريق</span></div></div>}
    {page.benefits && <section className="lp-angle-benefits lp-shell" aria-labelledby="angle-benefits-title">
      <p className="lp-kicker">من المكوّن، لفهم روتينك</p><h2 id="angle-benefits-title">{page.benefitsTitle ?? "شنوّة علاقة المكوّنات بالطاقة، التحمّل والاستشفاء؟"}</h2>
      <p className="lp-angle-benefits-intro">{page.benefitsIntro ?? "أبحاث على مستحضرات محدّدة من المكوّنات: اكتشف الجوانب اللي تهمّ الرياضي في كل واحد منها."}</p>
      <div className="lp-angle-benefit-grid">{page.benefits.map((benefit, index) => <article key={benefit.title}>
        <span className="lp-benefit-number" aria-hidden="true">0{index + 1}</span><h3>{benefit.title}</h3><p className="lp-benefit-ingredient">{benefit.ingredient}</p><p>{benefit.body}</p>
        <a href={benefit.reference} target="_blank" rel="noopener noreferrer">اكتشف المرجع<ArrowUpLeft size={16} aria-hidden="true" /></a>
      </article>)}</div>
    </section>}
    <section className="lp-motivation lp-shell" aria-labelledby="motivation-title">
      <div className="lp-motivation-photo"><Image src={page.lifestyleImage ?? `/images/landing/${page.slug}-lifestyle-v2.webp`} alt={`صورة توضيحية لعادات يومية متوازنة — ${page.name}`} width={1280} height={853} sizes="(max-width: 800px) 100vw, 50vw" /><span>لحظة عناية، كل نهار</span></div>
      <div><p className="lp-kicker">روتين يتماشى مع حياتك</p><h2 id="motivation-title">{page.storyTitle}</h2><p>{page.story}</p><ul>{page.habits.map(habit => <li key={habit}><Check size={18} aria-hidden="true" />{habit}</li>)}</ul><a href={target} className="lp-text-link">{cta}<ArrowDownLeft size={18} /></a></div>
    </section>
    <section className="lp-ingredients-section lp-visual-ingredients" id="ingredients">
      <div className="lp-shell">
        <div className="lp-section-heading"><div><p className="lp-kicker">من الصورة للمكوّن</p><h2>شنوّة فيه؟</h2></div><p>تعرّف على المكوّنات المرتبطة بهذه الزاوية.</p></div>
        <div className={`lp-ingredient-grid${page.featured.length === 1 ? " lp-single-ingredient" : ""}`}>{page.featured.map(index => <article key={index} className="lp-ingredient-card">
          <div><Image src={vitalForceIngredients[index].image} alt={arabicIngredientNames[index]} width={360} height={360} sizes="(max-width: 600px) 75vw, 30vw" /></div>
          <h3>{arabicIngredientNames[index]}</h3><p>{page.ingredientSummaries?.[index] ?? ingredientFacts[index]}</p>
          <details className="lp-ingredient-detail"><summary>الأبحاث والملاءمة</summary><p>{page.ingredientNotes?.[index] ?? vitalForceIngredients[index].advantageAr}</p><a href={page.references?.[index] ?? ingredientReferences[index]} target="_blank" rel="noopener noreferrer">اقرأ المرجع<ArrowUpLeft size={14} /></a></details>
        </article>)}</div>
        <p className="lp-evidence-note">تعرّف أكثر على أبحاث كل مكوّن من الروابط أعلاه. الصور توضيحية مولّدة.</p>
        <details className="lp-full-formula"><summary>شوف التركيبة الكاملة</summary><p>{arabicIngredientNames.join(" · ")}</p></details>
      </div>
    </section>
    {!page.informational && <LandingOrder angle={page.slug} angleName={page.name} />}
    {page.informational && <section className="lp-product-labels lp-shell" id="product-info" aria-labelledby="product-labels-title">
      <p className="lp-kicker">معلومات المنتج</p><h2 id="product-labels-title">اكتشف الملصق الكامل لكل نكهة.</h2>
      {products.map(product => <details key={product.id} className="lp-label"><summary>شوف الملصق الكامل · {product.flavor === "Orange" ? "برتقال" : product.flavor === "Citron" ? "ليمون" : "نعناع"}</summary><Image src={product.image} alt={`الملصق الكامل لـVITAL FORCE — ${product.flavor}`} width={1200} height={400} sizes="(max-width: 800px) 100vw, 80vw" /></details>)}
    </section>}
    <section className="lp-faq lp-shell" id="faq"><div><p className="lp-kicker">أسئلة المنتج</p><h2>تحبّ تعرف أكثر؟</h2></div><div>{faq.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
    <footer className="lp-footer"><div className="lp-shell"><div className="lp-brand" dir="ltr">VITAL FORCE<span>روتين نباتي يومي</span></div><p>مكمّل غذائي · مزيج من 7 مكوّنات نباتية · عبوة 400 غ</p><a href="tel:+21627200603" dir="ltr">+216 27 200 603</a><span>صفاقس، تونس · صور توضيحية مولّدة</span></div></footer>
    <div className="lp-mobile-buy"><div><strong>{page.informational ? "روتينك اليومي" : `${products[0].price} د.ت`}</strong><span>{page.informational ? "7 مكوّنات نباتية" : "+ 7 د.ت توصيل"}</span></div><a href={target}>{page.informational ? "اكتشف التركيبة" : "اختار نكهتك"}<ArrowDownLeft size={18} /></a></div>
  </main>;
}
