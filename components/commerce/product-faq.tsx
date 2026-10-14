import { vitalForceDosage } from "@/lib/product-data";

const questions = [
  { question: "Quels goûts sont disponibles ?", answer: "VITAL FORCE 400 g existe en Orange, Citron et Menthe. La composition, le mode d’utilisation et les précautions figurant sur l’étiquette de chaque goût font toujours référence." },
  { question: "Comment préparer une portion ?", answer: `1 scoop = ${vitalForceDosage.scoopGrams} g. Pour un sportif : ${vitalForceDosage.sportScoops} scoops (${vitalForceDosage.sportScoops * vitalForceDosage.scoopGrams} g) par jour. Pour un non-sportif : ${vitalForceDosage.nonSportScoops} scoop (${vitalForceDosage.nonSportScoops * vitalForceDosage.scoopGrams} g) par jour. Mélangez dans 200 ml d'eau, de jus ou de votre boisson préférée. Respectez la dose journalière recommandée.`, answerAr: `كل scoop فيها ${vitalForceDosage.scoopGrams} g. الرياضي ياخو ${vitalForceDosage.sportScoops} scoops، يعني ${vitalForceDosage.sportScoops * vitalForceDosage.scoopGrams} g في النهار. غير الرياضي ياخو scoop واحدة، يعني ${vitalForceDosage.nonSportScoops * vitalForceDosage.scoopGrams} g في النهار. اخلطها في 200 ml ماء، عصير أو مشروبك المفضّل.` },
  { question: "Quand le prendre ?", answer: "L'étiquette conseille une prise le matin, de préférence après un repas. En cas de doute sur votre situation personnelle, demandez conseil à un professionnel de santé." },
  { question: "Quelles précautions faut-il connaître ?", answer: "Déconseillé pendant la grossesse ou l'allaitement, aux enfants de moins de 13 ans et en cas d'hyperthyroïdie selon l'étiquette fournie. Un complément alimentaire ne remplace pas une alimentation variée et équilibrée." },
  { question: "Comment le conserver ?", answer: "Conservez le pot dans un endroit sec et frais, à l'abri de la lumière et de l'humidité. Refermez-le soigneusement après chaque utilisation." },
  { question: "Puis-je commander en ligne ?", answer: "La disponibilité de la commande est indiquée sur la fiche produit. Si le bouton de confirmation est désactivé, aucune commande ni donnée de paiement n'est enregistrée." }
];

export function ProductFaq() {
  return <section className="container-shell faq-section" aria-labelledby="faq-heading">
    <div className="faq-heading"><p className="eyebrow">QUESTIONS FRÉQUENTES</p><h2 id="faq-heading">Avant de commander.</h2><p>Tout ce qu’il faut savoir sur le produit, son utilisation et sa conservation.</p></div>
    <div className="faq-list">
      {questions.map(({ question, answer, answerAr }) => <details key={question}>
        <summary>{question}<span aria-hidden="true">+</span></summary>
        <p>{answer}</p>
        {answerAr && <p lang="ar" dir="rtl">{answerAr}</p>}
      </details>)}
    </div>
  </section>;
}
