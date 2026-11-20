// Only these public interface labels can reach the live dashboard.
export const sections = {
  page: "Contenu de la page", header: "En-tête", hero: "Présentation", offer: "Prix et offre",
  proof: "Livraison et garanties", catalog: "Catalogue", campaigns: "Choix du parcours",
  product: "Fiche produit", benefits: "Bénéfices", story: "Routine", ingredients: "Ingrédients",
  labels: "Étiquette du produit", reviews: "Avis clients", faq: "Questions fréquentes",
  order: "Formulaire de commande", flavor: "Choix du goût", quantity: "Quantité",
  delivery: "Informations de livraison", total: "Récapitulatif", cart: "Panier",
  viewer: "Vue 3D", confirmation: "Confirmation", footer: "Pied de page"
} as const;

export const actions = {
  visit: "Arrivée sur la page", area: "Clic dans la section", link: "Lien", button: "Bouton",
  details: "Détails dépliables", faq: "Question fréquente", order: "Aller au formulaire",
  flavor: "Choix du goût", quantity: "Modifier la quantité", bundle: "Offre deux pots",
  orange: "Choisir Orange", citron: "Choisir Citron", menthe: "Choisir Menthe",
  increase: "Augmenter la quantité", decrease: "Diminuer la quantité",
  submit: "Envoyer la commande", whatsapp: "Ouvrir WhatsApp", reviewPhoto: "Photo d’un avis",
  ingredients: "Voir les ingrédients", product: "Ouvrir un produit", checkout: "Passer commande",
  field: "Champ du formulaire", reference: "Voir la référence"
} as const;

export type Section = keyof typeof sections;
export type Action = keyof typeof actions;
export type LiveStep = { path: string; section: Section; action: Action; at: number };
export type LiveActivity = {
  view: string; at: number; path: string; foreground: boolean; section: Section;
  seconds: number; scroll: number; steps: LiveStep[];
};

export const storefrontPath = /^\/(?:|lp(?:\/[a-z0-9-]{1,80})?|products(?:\/[a-z0-9-]{1,120})?|cart|checkout|viewer|confirmation)$/;
export const maxSteps = 8;
