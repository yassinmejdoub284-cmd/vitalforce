import Image from "next/image";
import { vitalForceIngredients } from "@/lib/product-data";

const sources = [
  { name: "Ashwagandha", href: "https://www.nccih.nih.gov/health/ashwagandha" },
  { name: "Curcuma", href: "https://www.nccih.nih.gov/health/turmeric" },
  { name: "Ginseng", href: "https://www.nccih.nih.gov/health/asian-ginseng" },
  { name: "Maca", href: "https://pubmed.ncbi.nlm.nih.gov/27548190/" },
  { name: "Fenugrec", href: "https://pubmed.ncbi.nlm.nih.gov/19353539/" },
  { name: "Gingembre", href: "https://www.nccih.nih.gov/health/ginger" },
  { name: "Poivre noir", href: "https://www.nccih.nih.gov/health/turmeric" }
];
export function IngredientGrid() {
  return <section id="ingredients" className="container-shell ingredient-section">
    <div className="section-heading"><div><p className="eyebrow">À L’ORIGINE DE LA FORMULE</p><h2>La nature a<br/><em>de belles ressources.</em></h2></div><p>Sept ingrédients réunis dans un seul mélange.<br/>Découvrez les racines, rhizomes et graines<br/>qui composent VITAL FORCE.</p></div>
    <div className="ingredient-gallery">{vitalForceIngredients.map((ingredient, i) => <article className="ingredient-tile" key={ingredient.name}>
      <div className="ingredient-photo"><span>0{i + 1}</span><Image src={ingredient.image} alt={`${ingredient.name}, ${ingredient.label.toLowerCase()}`} width={360} height={360} sizes="(max-width: 480px) 85vw, (max-width: 1050px) 43vw, 30vw" loading="lazy"/></div>
      <p className="ingredient-kind">{ingredient.label}</p><h3>{ingredient.name}</h3><p className="ingredient-advantage" lang="fr">{ingredient.advantage}</p><p className="ingredient-advantage-ar" lang="ar" dir="rtl">{ingredient.advantageAr}</p>
    </article>)}</div>
    <p className="ingredient-note">Photos d’ingrédients générées à titre d’illustration. Les recherches citées portent sur des ingrédients ou préparations spécifiques, pas sur l'efficacité du produit fini. Se référer à l’étiquette pour la composition et les précautions d’emploi.</p>
    <div className="ingredient-sources"><span>Études et références / المراجع:</span>{sources.map((source) => <a key={source.name} href={source.href} target="_blank" rel="noopener noreferrer">{source.name}</a>)}</div>
  </section>;
}
