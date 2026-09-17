const questions = [
  { question: "Quels goûts sont disponibles ?", answer: "VITAL FORCE 400 g existe en Orange, Citron et Menthe. La composition et les précautions figurant sur l'emballage font toujours référence. Le visuel Citron présenté ici est une maquette en attente de validation." },
  { question: "Comment préparer une portion ?", answer: "Selon les indications communiquées sur l'étiquette : 5 g par jour pour une personne non sportive ou 10 g pour une personne sportive, mélangés à 200 ml d'eau, de jus ou d'une boisson de votre choix. Respectez la dose journalière recommandée." },
  { question: "Quand le prendre ?", answer: "L'étiquette conseille une prise le matin, de préférence après un repas. En cas de doute sur votre situation personnelle, demandez conseil à un professionnel de santé." },
  { question: "Quelles précautions faut-il connaître ?", answer: "Déconseillé pendant la grossesse ou l'allaitement, aux enfants de moins de 13 ans et en cas d'hyperthyroïdie selon l'étiquette fournie. Un complément alimentaire ne remplace pas une alimentation variée et équilibrée." },
  { question: "Comment le conserver ?", answer: "Conservez le pot dans un endroit sec et frais, à l'abri de la lumière et de l'humidité. Refermez-le soigneusement après chaque utilisation." },
  { question: "Puis-je commander en ligne ?", answer: "La disponibilité de la commande est indiquée sur la fiche produit. Si le bouton de confirmation est désactivé, aucune commande ni donnée de paiement n'est enregistrée." }
];

export function ProductFaq() {
  return <section className="container-shell border-t border-forest-900/10 py-16" aria-labelledby="faq-heading">
    <p className="eyebrow">QUESTIONS FRÉQUENTES</p>
    <h2 id="faq-heading" className="mt-3 font-display text-4xl">L’essentiel, en bref.</h2>
    <div className="mt-8 max-w-3xl border-t border-forest-900/15">
      {questions.map(({ question, answer }) => <details key={question} className="group border-b border-forest-900/15 py-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold marker:content-none">{question}<span aria-hidden="true" className="text-xl font-normal group-open:rotate-45">+</span></summary>
        <p className="max-w-2xl pt-3 text-sm leading-7 text-forest-900/70">{answer}</p>
      </details>)}
    </div>
  </section>;
}
