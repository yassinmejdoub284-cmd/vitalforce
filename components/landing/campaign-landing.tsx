import Image from "next/image";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpLeft, Check, Leaf, ShieldCheck, Truck } from "lucide-react";
import { LandingOrder } from "./landing-order";
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
const campaignHooks: Record<string, string> = {
  sport: "روتينك الرياضي يستحقّ اهتمامك.",
  "daily-energy": "ابدأ نهارك بلحظة عناية ليك.",
  calm: "خفّف الإيقاع. واعمل مساحة لنفسك.",
  focus: "اعمل مساحة لتركيزك.",
  digestion: "اختيار واعٍ، وروتين على مهلك.",
  intimacy: "لحظة لكما. واهتمام يبدأ من نفسك.",
  sleep: "خصّص وقتاً للراحة والتوازن.",
  movement: "تحبّ ترجع الحركة عادة يومية؟",
  botanical: "تحبّ تعرف شنوّة في مشروبك؟"
};

export function CampaignLanding({ page }: { page: LandingPage }) {
  const isSport = page.slug === "sport";
  const motivationImages: Record<string, string> = {
    sport: "movement", "daily-energy": "focus", calm: "sleep", focus: "daily-energy",
    digestion: "botanical", intimacy: "calm", sleep: "calm", movement: "sport", botanical: "daily-energy"
  };
  const target = page.informational ? "#ingredients" : "#order";
  const cta = page.informational ? "اكتشف المكوّنات" : "اختار نكهتك واطلب";
  const faq = [
    [isSport ? "شنوّة VITAL FORCE وشنوّة دوره؟" : page.question, isSport ? "مكمّل غذائي نباتي يدخل في روتين غذائي ورياضي متوازن. موش بروتين لبناء العضلات، وما يضمنش زيادة الأداء الرياضي. ما يعوّضش التغذية المتوازنة أو التدريب." : page.answer],
    ...(isSport ? [["قدّاش تدوم العبوة؟", "عبوة ٤٠٠ غ تعطي حوالي ٤٠ استعمال بجرعة ١٠ غ يومياً حسب تعليمات الاستعمال للرياضي. اتبع الملصق ولا تتجاوز الجرعة الموصى بها."]] : []),
    ["شنوّة الفرق بين النكهات؟", "نفس المزيج بثلاث نكهات: برتقال، ليمون ونعناع. راجع ملصق كل نكهة للتفاصيل."],
    ["شكون يلزمو ينتبه قبل الاستعمال؟", "حسب الملصق: غير منصوح به للحامل والمرضع وللأطفال دون ١٣ سنة وفي حالة فرط نشاط الغدة الدرقية. إذا تتناول أدوية، لديك مرض مزمن أو اضطراب في الغدة الدرقية، استشر مختصاً صحياً قبل الاستعمال."],
    ...(!page.informational ? [["كيفاش يتمّ الطلب؟", "اختار النكهة والكمية وافتح رسالة واتساب الجاهزة. أرسلها بنفسك؛ الفريق يؤكّد التوفر والعنوان والتوصيل بـ٧ د.ت. فتح واتساب وحده لا يؤكّد الطلب."]] : [])
  ];
  return <main className={`lp-page lp-visual-page${isSport ? " lp-sport-conversion" : ""}`} style={{ "--lp-accent": page.color } as React.CSSProperties}>
    <div className="lp-announcement">{page.informational ? "روتين نباتي للحياة اليومية" : <>توصيل في تونس <span>•</span> الدفع عند الاستلام بعد تأكيد الطلب</>}</div>
    <header className="lp-header lp-shell">
      <Link href="/lp" className="lp-brand" dir="ltr">VITAL FORCE<span>روتين نباتي يومي</span></Link>
      <a href={target} className="lp-header-cta">{page.informational ? "اكتشف التركيبة" : "اطلب توا"}<ArrowDownLeft size={17} /></a>
    </header>
    <section className={`lp-visual-hero lp-shell${page.visualImage ? " lp-has-poster" : ""}`} aria-labelledby="lp-title">
      <div className="lp-campaign-art">
        <h1 id="lp-title" className={page.visualImage ? "lp-visually-hidden" : "lp-art-headline"}>{campaignHooks[page.slug]}</h1>
        <Image src={page.visualImage ?? page.image} alt={page.imageAlt} width={page.visualImage ? 1024 : 1280} height={page.visualImage ? 1536 : 853} preload sizes="(max-width: 800px) 100vw, 55vw" className={page.visualImage ? "lp-campaign-poster" : "lp-campaign-photo"} />
      </div>
      <div className="lp-visual-offer">
        <p className="lp-kicker">{page.name}</p>
        <h2 dir="ltr">{isSport ? <>VITAL <em>FORCE</em></> : <>VITAL<br /><em>FORCE</em></>}</h2>
        <p className="lp-visual-tagline">{isSport ? <>خلّي العناية بروحك<br />جزء من روتينك.</> : <>٧ مكوّنات نباتية.<br />روتين بسيط بطعمك.</>}</p>
        {isSport && <p className="lp-sport-description">مكمّل غذائي يجمع ٧ مكوّنات نباتية في مزيج واحد، بثلاث نكهات تختار منها.</p>}
        <div className="lp-ingredient-pills">{page.featured.map(index => <span key={index}>{arabicIngredientNames[index]}</span>)}</div>
        {!page.informational && <>
          <div className="lp-hero-offer"><strong>{products[0].price}<small>د.ت</small></strong><span>٤٠٠ غ · التوصيل ٧ د.ت<br />برتقال · ليمون · نعناع</span></div>
        </>}
        {isSport && <div className="lp-value-strip"><strong>حوالي ٤٠ استعمال</strong><span>{(products[0].price / 40).toFixed(2)} د.ت للاستعمال · بجرعة ١٠ غ حسب الملصق</span></div>}
        <p className="lp-visual-evidence">{page.benefitCaption ?? "٧ مكوّنات نباتية، بثلاث نكهات لروتينك اليومي."}</p>
        <a href={target} className="lp-primary">{cta}<ArrowDownLeft size={20} /></a>
        <p className="lp-micro"><ShieldCheck size={15} />{page.informational ? "مكوّنات واضحة · لحظة عناية يومية" : "الدفع عند الاستلام · ١٧٠ د.ت بالتوصيل لعبوة واحدة"}</p>
      </div>
    </section>
    {!page.informational && <div className="lp-proof lp-shell"><div><Leaf /><span><strong>٧ مكوّنات</strong>تركيبة نباتية واضحة</span></div><div><Truck /><span><strong>توصيل في تونس</strong>٧ د.ت للطلب</span></div><div><ShieldCheck /><span><strong>الدفع عند الاستلام</strong>بعد التأكيد مع الفريق</span></div></div>}
    <section className="lp-motivation lp-shell" aria-labelledby="motivation-title">
      <div className="lp-motivation-photo"><Image src={`/images/landing/${motivationImages[page.slug]}-lifestyle-v2.webp`} alt={`صورة توضيحية لعادات يومية متوازنة — ${page.name}`} width={1280} height={853} sizes="(max-width: 800px) 100vw, 50vw" /><span>لحظة عناية، كل نهار</span></div>
      <div><p className="lp-kicker">روتين يتماشى مع حياتك</p><h2 id="motivation-title">{page.storyTitle}</h2><p>{page.story}</p><ul>{page.habits.map(habit => <li key={habit}><Check size={18} aria-hidden="true" />{habit}</li>)}</ul><a href={target} className="lp-text-link">{cta}<ArrowDownLeft size={18} /></a></div>
    </section>
    {!page.informational && <section className="lp-preparation lp-shell" aria-labelledby="preparation-title">
      <p className="lp-kicker">من العلبة لروتينك</p><h2 id="preparation-title">تحضير واضح. نكهة على ذوقك.</h2>
      <div className="lp-preparation-grid">{[
        ["usage-dose-scoop.jpg", "١", "حدّد الجرعة", isSport ? "للرياضي: ١٠ غ يومياً حسب الملصق. قيس بالوزن؛ حجم الملعقة وحده ما يحدّدش الجرعة." : "حسب الملصق: ٥ غ يومياً لغير الرياضي و١٠ غ للرياضي. قيس بالوزن؛ حجم الملعقة وحده ما يحدّدش الجرعة."],
        ["usage-mix-scoop.jpg", "٢", "زيد مشروبك", "اخلط في ٢٠٠ مل ماء، عصير أو مشروبك المفضّل."],
        ["usage-ready-scoop.jpg", "٣", "اخلط واستعمل", "حسب الملصق: في الصباح، من الأفضل بعد الأكل. ما تتجاوزش الجرعة الموصى بها."]
      ].map(([image, number, title, text]) => <article key={number}><Image src={`/images/${image}`} alt={`صورة توضيحية: ${title}`} width={1448} height={1086} sizes="(max-width: 600px) 100vw, 33vw" /><div><span>{number}</span><h3>{title}</h3><p>{text}</p></div></article>)}</div>
      <p className="lp-preparation-note">صور توضيحية مولّدة؛ اتبع تعليمات الملصق. العرض يخصّ العبوة؛ أدوات التحضير الظاهرة ليست ضمن العرض.</p>
      <a href="#order" className="lp-text-link">اختار بين البرتقال، الليمون والنعناع<ArrowDownLeft size={18} /></a>
    </section>}
    <section className="lp-ingredients-section lp-visual-ingredients" id="ingredients">
      <div className="lp-shell">
        <div className="lp-section-heading"><div><p className="lp-kicker">من الصورة للمكوّن</p><h2>شنوّة فيه؟</h2></div><p>تعرّف على المكوّنات المرتبطة بهذه الزاوية.</p></div>
        <div className="lp-ingredient-grid">{page.featured.map(index => <article key={index} className="lp-ingredient-card">
          <div><Image src={vitalForceIngredients[index].image} alt={arabicIngredientNames[index]} width={360} height={360} sizes="(max-width: 600px) 75vw, 30vw" /></div>
          <h3>{arabicIngredientNames[index]}</h3><p>{page.ingredientSummaries?.[index] ?? ingredientFacts[index]}</p>
          <details className="lp-ingredient-detail"><summary>الأبحاث والملاءمة</summary><p>{page.ingredientNotes?.[index] ?? vitalForceIngredients[index].advantageAr}</p><a href={page.references?.[index] ?? ingredientReferences[index]} target="_blank" rel="noopener noreferrer">اقرأ المرجع<ArrowUpLeft size={14} /></a></details>
        </article>)}</div>
        <p className="lp-evidence-note">تعرّف أكثر على أبحاث كل مكوّن من الروابط أعلاه. الصور توضيحية مولّدة.</p>
        <details className="lp-full-formula"><summary>شوف التركيبة الكاملة</summary><p>{arabicIngredientNames.join(" · ")}</p></details>
      </div>
    </section>
    {!page.informational && <LandingOrder angle={page.slug} angleName={page.name} />}
    <section className="lp-faq lp-shell" id="faq"><div><p className="lp-kicker">أسئلة المنتج</p><h2>تحبّ تعرف أكثر؟</h2></div><div>{faq.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
    <footer className="lp-footer"><div className="lp-shell"><div className="lp-brand" dir="ltr">VITAL FORCE<span>روتين نباتي يومي</span></div><p>مكمّل غذائي · مزيج من ٧ مكوّنات نباتية · عبوة ٤٠٠ غ</p><a href="tel:+21627200603" dir="ltr">+216 27 200 603</a><span>صفاقس، تونس · صور توضيحية مولّدة</span></div></footer>
    <div className="lp-mobile-buy"><div><strong>{page.informational ? "روتينك اليومي" : `${products[0].price} د.ت`}</strong><span>{page.informational ? "٧ مكوّنات نباتية" : "+ ٧ د.ت توصيل"}</span></div><a href={target}>{page.informational ? "اكتشف التركيبة" : "اختار نكهتك"}<ArrowDownLeft size={18} /></a></div>
  </main>;
}
