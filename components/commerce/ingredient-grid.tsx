import Image from "next/image";
import { vitalForceIngredients } from "@/lib/product-data";
export function IngredientGrid() {
  return <section id="ingredients" className="container-shell ingredient-section">
    <div className="section-heading"><div><p className="eyebrow">À L’ORIGINE DE LA FORMULE</p><h2>La nature a<br/><em>de belles ressources.</em></h2></div><p>Sept ingrédients réunis dans un seul mélange.<br/>Découvrez les racines, rhizomes et graines<br/>qui composent VITAL FORCE.</p></div>
    <div className="ingredient-gallery">{vitalForceIngredients.map((ingredient, i) => <article className="ingredient-tile" key={ingredient.name}>
      <div className="ingredient-photo"><span>0{i + 1}</span><Image src={ingredient.image} alt={ingredient.name} width={360} height={360}/></div>
      <p className="ingredient-kind">{ingredient.label}</p><h3>{ingredient.name}</h3><p className="ingredient-advantage">{ingredient.advantage}</p>
    </article>)}</div>
    <p className="ingredient-note">Visuels d’illustration générés. Ces descriptions présentent les plantes et leurs qualités sensorielles, pas des effets démontrés du produit fini. Se référer à l’étiquette pour la composition et les précautions d’emploi.</p>
  </section>;
}
