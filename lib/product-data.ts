export type Ingredient = {
  name: string;
  label: string;
  benefit: string;
  advantage: string;
  color: string;
  image: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stock: number;
  netWeight: string;
  flavor: string;
  image: string;
  shortDescription: string;
  highlights: string[];
  usage: string[];
  warnings: string[];
  conservation: string;
  ingredients: Ingredient[];
};

export const vitalForceIngredients: Ingredient[] = [
  { name: "Ashwagandha", label: "Racine", benefit: "Une racine au cœur de notre mélange botanique.", advantage: "Appréciée depuis longtemps dans les traditions botaniques, cette racine apporte une note terreuse et douce à la formule. Son intérêt tient à sa place singulière dans un assemblage de plantes, sans que cela préjuge de l'effet du produit fini.", color: "#caa06a", image: "/images/v2/ashwagandha.webp" },
  { name: "Curcuma", label: "Rhizome", benefit: "Un rhizome à la couleur orange intense.", advantage: "Le curcuma se distingue par sa couleur naturellement dorée et ses curcuminoïdes. Il donne du caractère au mélange et s'associe aux autres racines pour créer un profil botanique chaleureux.", color: "#f08a22", image: "/images/v2/curcuma.webp" },
  { name: "Ginseng rouge", label: "Racine", benefit: "Une racine caractéristique de la formule.", advantage: "Cette racine emblématique occupe une place importante dans les traditions asiatiques. Son profil légèrement amer et boisé apporte de la profondeur à notre sélection de plantes.", color: "#b46f3f", image: "/images/v2/ginseng_rouge.webp" },
  { name: "Maca noire", label: "Racine", benefit: "Une racine sombre, à la chair claire.", advantage: "Originaire des hauts plateaux andins, la maca noire est choisie pour son identité végétale et sa saveur douce, légèrement maltée. Elle complète l'équilibre des racines présentes dans la formule.", color: "#221f1e", image: "/images/v2/maca_noire.webp" },
  { name: "Fenugrec", label: "Graines", benefit: "De petites graines aux nuances dorées.", advantage: "Les graines de fenugrec apportent une note aromatique ronde, légèrement épicée. Utilisées aussi en cuisine, elles enrichissent la diversité des saveurs de ce mélange botanique.", color: "#d7a116", image: "/images/v2/fenugrec.webp" },
  { name: "Gingembre", label: "Rhizome", benefit: "Un rhizome à la chair jaune et fibreuse.", advantage: "Reconnaissable à son goût vif et chaleureux, le gingembre donne du relief à la préparation. Son arôme caractéristique crée un contraste avec les notes plus douces des autres ingrédients.", color: "#e8b96b", image: "/images/v2/gingembre.webp" },
  { name: "Poivre noir", label: "Grains", benefit: "La touche épicée de notre sélection botanique.", advantage: "Quelques grains suffisent à apporter une pointe de chaleur et de profondeur aromatique. Le poivre noir signe la finition épicée de l'assemblage, sans dominer ses autres plantes.", color: "#2b211f", image: "/images/v2/poivre_noir.webp" }
];

const orangeProduct: Product = {
    id: "vf-400-orange",
    slug: "vital-force-400g-orange",
    name: "VITAL FORCE Orange 400 g",
    subtitle: "Mélange de plantes naturelles - Goût orange",
    price: 165,
    compareAtPrice: 189,
    sku: "VF-ORANGE-400",
    stock: 84,
    netWeight: "400 g",
    flavor: "Orange",
    image: "/images/v2/label-originale.png",
    shortDescription:
      "Mélange botanique VITAL FORCE aux sept ingrédients de la formule, en version goût orange.",
    highlights: ["100% ingrédients naturels", "Goût orange", "Format 400 g", "Distribution Tunisie"],
    usage: [
      "Sportif: 10 g par jour.",
      "Non sportif: 5 g par jour.",
      "Mélanger dans 200 ml d'eau, de jus ou de votre boisson préférée.",
      "À prendre le matin, de préférence après les repas."
    ],
    warnings: [
      "Ne pas dépasser la dose journalière recommandée.",
      "Ce produit ne remplace pas une alimentation variée et équilibrée.",
      "Déconseillé aux femmes enceintes ou allaitantes, aux enfants de moins de 13 ans et en cas d'hyperthyroïdie."
    ],
    conservation:
      "À conserver dans un endroit sec et frais, à l'abri de la lumière et de l'humidité. Bien refermer après chaque utilisation.",
    ingredients: vitalForceIngredients
};

export const products: Product[] = [
  orangeProduct,
  {
    ...orangeProduct,
    id: "vf-400-citron",
    slug: "vital-force-400g-citron",
    name: "VITAL FORCE Citron 400 g",
    subtitle: "Mélange de plantes naturelles - Goût citron",
    compareAtPrice: undefined,
    sku: "VF-CITRON-400",
    stock: 60,
    flavor: "Citron",
    image: "/images/v2/logo.png",
    shortDescription: "Le mélange botanique VITAL FORCE aux sept ingrédients de la formule, en version goût citron.",
    highlights: ["Sept ingrédients botaniques", "Goût citron", "Format 400 g", "Distribution Tunisie"]
  },
  {
    ...orangeProduct,
    id: "vf-400-menthe",
    slug: "vital-force-400g-menthe",
    name: "VITAL FORCE Menthe 400 g",
    subtitle: "Mélange de plantes naturelles - Goût menthe",
    compareAtPrice: undefined,
    sku: "VF-MENTHE-400",
    stock: 60,
    flavor: "Menthe",
    image: "/images/v2/logo.png",
    shortDescription: "Le mélange botanique VITAL FORCE aux sept ingrédients de la formule, en version goût menthe.",
    highlights: ["Sept ingrédients botaniques", "Goût menthe", "Format 400 g", "Distribution Tunisie"]
  },

];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export const orderStatuses = ["new", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
export const paymentStatuses = ["pending", "paid", "failed", "refunded"] as const;
