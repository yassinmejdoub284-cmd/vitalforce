import type { Product } from "@/lib/product-data";

const steps = [
  { title: "Dosez", detail: "10 g par jour pour un sportif, ou 5 g par jour pour un non-sportif.", image: "Pesée d'une portion de poudre botanique sur une balance" },
  { title: "Mélangez", detail: "Versez dans 200 ml d'eau, de jus ou de votre boisson préférée, puis remuez.", image: "Préparation de la poudre dans un verre d'eau" },
  { title: "Dégustez", detail: "À prendre le matin, de préférence après un repas.", image: "Boisson botanique préparée sur une table le matin" }
];

export function UsageGuide({ product, showPrecautions = false }: { product: Product; showPrecautions?: boolean }) {
  return <section id="rituel" className="container-shell usage-guide">
    <div className="section-heading"><div><p className="eyebrow">LE MODE D’EMPLOI</p><h2>Votre rituel,<br /><em>en trois gestes.</em></h2></div><p>Une préparation simple à intégrer à votre journée. Respectez toujours les indications figurant sur l’étiquette.</p></div>
    <div className="usage-guide-grid">{steps.map((step, index) => <article className="usage-guide-step" key={step.title}>
      <div className={`usage-guide-image usage-guide-image-${index}`} role="img" aria-label={step.image} />
      <div className="usage-guide-copy"><span>0{index + 1}</span><div><h3>{step.title}</h3><p>{step.detail}</p></div></div>
    </article>)}</div>
    {showPrecautions && <details className="precautions usage-guide-precautions"><summary>Précautions et conservation</summary>{product.warnings.map((warning) => <p key={warning}>{warning}</p>)}<p>{product.conservation}</p></details>}
    <p className="usage-guide-note">Photos d’illustration générées. Ne pas dépasser la dose journalière recommandée. Un complément alimentaire ne remplace pas une alimentation variée et équilibrée.</p>
  </section>;
}
