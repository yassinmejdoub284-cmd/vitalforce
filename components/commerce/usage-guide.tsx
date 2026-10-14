import Image from "next/image";
import { vitalForceDosage, type Product } from "@/lib/product-data";

const steps = [
  { title: "Dosez", detail: `1 scoop = ${vitalForceDosage.scoopGrams} g. Sportif : ${vitalForceDosage.sportScoops} scoops (${vitalForceDosage.sportScoops * vitalForceDosage.scoopGrams} g) par jour. Non sportif : ${vitalForceDosage.nonSportScoops} scoop (${vitalForceDosage.nonSportScoops * vitalForceDosage.scoopGrams} g) par jour.`, detailAr: `كل scoop فيها ${vitalForceDosage.scoopGrams} g. الرياضي: ${vitalForceDosage.sportScoops} scoops، يعني ${vitalForceDosage.sportScoops * vitalForceDosage.scoopGrams} g في النهار. غير الرياضي: scoop واحدة، يعني ${vitalForceDosage.nonSportScoops * vitalForceDosage.scoopGrams} g في النهار.`, image: "/images/usage-dose-scoop.jpg", alt: "Pot VITAL FORCE Orange avec une mesurette transparente remplie de poudre botanique" },
  { title: "Mélangez", detail: "Versez dans 200 ml d'eau, de jus ou de votre boisson préférée, puis remuez.", image: "/images/usage-mix-scoop.jpg", alt: "Mesurette transparente versant la poudre VITAL FORCE dans 200 ml d'eau" },
  { title: "Dégustez", detail: "À prendre le matin, de préférence après un repas.", image: "/images/usage-ready-scoop.jpg", alt: "Boisson botanique préparée avec le pot VITAL FORCE et sa mesurette" }
];

export function UsageGuide({ product, showPrecautions = false }: { product: Product; showPrecautions?: boolean }) {
  return <section id="rituel" className="container-shell usage-guide">
    <div className="section-heading"><div><p className="eyebrow">LE MODE D’EMPLOI</p><h2>Votre rituel,<br /><em>en trois gestes.</em></h2></div><p>Une préparation simple à intégrer à votre journée. Respectez toujours les indications figurant sur l’étiquette.</p></div>
    <div className="usage-guide-grid">{steps.map((step, index) => <article className="usage-guide-step" key={step.title}>
      <div className={`usage-guide-image usage-guide-image-${index}`}><Image src={step.image} alt={step.alt} fill quality={90} sizes="(max-width: 700px) calc(100vw - 28px), (max-width: 1200px) 31vw, 390px" /></div>
      <div className="usage-guide-copy"><span>0{index + 1}</span><div><h3>{step.title}</h3><p>{step.detail}</p>{step.detailAr && <p lang="ar" dir="rtl">{step.detailAr}</p>}</div></div>
    </article>)}</div>
    {showPrecautions && <details className="precautions usage-guide-precautions"><summary>Précautions et conservation</summary>{product.warnings.map((warning) => <p key={warning}>{warning}</p>)}<p>{product.conservation}</p></details>}
    <p className="usage-guide-note">Photos d’illustration générées. Ne pas dépasser la dose journalière recommandée. Un complément alimentaire ne remplace pas une alimentation variée et équilibrée.</p>
  </section>;
}
