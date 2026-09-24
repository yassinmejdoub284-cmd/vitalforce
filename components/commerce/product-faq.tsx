const questions = [
  { question: "Quels goûts sont disponibles ?", answer: "VITAL FORCE 400 g existe en Orange, Citron et Menthe. La composition, le mode d’utilisation et les précautions figurant sur l’étiquette de chaque goût font toujours référence." },
  { question: "Comment préparer une portion ?", answer: "Selon les indications communiquées sur l'étiquette : 5 g par jour pour une personne non sportive ou 10 g pour une personne sportive, mélangés à 200 ml d'eau, de jus ou d'une boisson de votre choix. Respectez la dose journalière recommandée." },
  { question: "Quand le prendre ?", answer: "L'étiquette conseille une prise le matin, de préférence après un repas. En cas de doute sur votre situation personnelle, demandez conseil à un professionnel de santé." },
  { question: "Quelles précautions faut-il connaître ?", answer: "Déconseillé pendant la grossesse ou l'allaitement, aux enfants de moins de 13 ans et en cas d'hyperthyroïdie selon l'étiquette fournie. Un complément alimentaire ne remplace pas une alimentation variée et équilibrée." },
  { question: "Comment le conserver ?", answer: "Conservez le pot dans un endroit sec et frais, à l'abri de la lumière et de l'humidité. Refermez-le soigneusement après chaque utilisation." },
  { question: "Puis-je commander en ligne ?", answer: "La disponibilité de la commande est indiquée sur la fiche produit. Si le bouton de confirmation est désactivé, aucune commande ni donnée de paiement n'est enregistrée." }
];

export function ProductFaq() {
  return <section className="container-shell faq-section" aria-labelledby="faq-heading">
    <div className="faq-heading"><p className="eyebrow">QUESTIONS FRÉQUENTES</p><h2 id="faq-heading">Avant de commander.</h2><p>Tout ce qu’il faut savoir sur le produit, son utilisation et sa conservation.</p></div>
    <div className="faq-list">
      {questions.map(({ question, answer }) => <details key={question}>
        <summary>{question}<span aria-hidden="true">+</span></summary>
        <p>{answer}</p>
      </details>)}
    </div>
  </section>;
}
