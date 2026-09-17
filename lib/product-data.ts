export type Ingredient = {
  name: string;
  label: string;
  benefit: string;
  advantage: string;
  advantageAr: string;
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
  { name: "Ashwagandha", label: "Racine", benefit: "Une racine au cœur de notre mélange botanique.", advantage: "L'ashwagandha est étudiée pour son intérêt potentiel dans la gestion du stress et la qualité du sommeil. Certaines préparations ont donné des résultats encourageants dans des essais cliniques.", advantageAr: "تُدرس الأشواغاندا لما قد تقدّمه في التعامل مع التوتر وتحسين جودة النوم. وقد أظهرت بعض مستحضراتها نتائج مشجّعة في دراسات سريرية.", color: "#caa06a", image: "/images/v2/ashwagandha.webp" },
  { name: "Curcuma", label: "Rhizome", benefit: "Un rhizome à la couleur orange intense.", advantage: "Le curcuma apporte des curcuminoïdes, étudiés pour leur activité antioxydante. Certaines préparations font aussi l'objet de recherches prometteuses sur le confort articulaire.", advantageAr: "يوفّر الكركم مركّبات الكركمينويد التي تُدرس لنشاطها المضاد للأكسدة. وتُبحث بعض مستحضراته أيضاً لدورها المحتمل في راحة المفاصل.", color: "#f08a22", image: "/images/v2/curcuma.webp" },
  { name: "Ginseng rouge", label: "Racine", benefit: "Une racine caractéristique de la formule.", advantage: "Le ginseng rouge est étudié pour son intérêt potentiel sur la fatigue générale et certaines capacités d'attention. Ses ginsénosides sont au cœur des recherches sur cette plante.", advantageAr: "يُدرس الجينسنغ الأحمر لما قد يقدّمه في ما يتعلّق بالتعب العام وبعض جوانب الانتباه. وتُعدّ مركّبات الجينسينوسيد محور الأبحاث حول هذا النبات.", color: "#b46f3f", image: "/images/v2/ginseng_rouge.webp" },
  { name: "Maca noire", label: "Racine", benefit: "Une racine sombre, à la chair claire.", advantage: "La maca noire suscite l'intérêt pour la vitalité et le bien-être ressentis. Des essais préliminaires sur ses extraits ont notamment étudié l'énergie et l'humeur rapportées par les participants.", advantageAr: "تحظى الماكا السوداء باهتمام في الأبحاث المتعلّقة بالإحساس بالنشاط والعافية. وقد تناولت دراسات أولية لمستخلصاتها الطاقة والمزاج كما وصفهما المشاركون.", color: "#221f1e", image: "/images/v2/maca_noire.webp" },
  { name: "Fenugrec", label: "Graines", benefit: "De petites graines aux nuances dorées.", advantage: "Les graines de fenugrec contiennent des fibres. Celles-ci ont été étudiées pour leur contribution possible à la sensation de satiété après un repas.", advantageAr: "تحتوي بذور الحلبة على ألياف دُرست لدورها المحتمل في الإحساس بالشبع بعد تناول الطعام.", color: "#d7a116", image: "/images/v2/fenugrec.webp" },
  { name: "Gingembre", label: "Rhizome", benefit: "Un rhizome à la chair jaune et fibreuse.", advantage: "Le gingembre est étudié pour le confort digestif. Certaines préparations ont montré un intérêt dans la recherche sur plusieurs formes de nausées.", advantageAr: "يُدرس الزنجبيل لارتباطه بالراحة الهضمية. وقد أظهرت بعض مستحضراته نتائج مشجّعة في الأبحاث حول أنواع معيّنة من الغثيان.", color: "#e8b96b", image: "/images/v2/gingembre.webp" },
  { name: "Poivre noir", label: "Grains", benefit: "La touche épicée de notre sélection botanique.", advantage: "Le poivre noir contient de la pipérine. Associée au curcuma dans certaines préparations étudiées, elle peut favoriser l'absorption de la curcumine.", advantageAr: "يحتوي الفلفل الأسود على البيبيرين. وعند مزجه بالكركم في بعض المستحضرات المدروسة، قد يساعد على امتصاص الكركمين.", color: "#2b211f", image: "/images/v2/poivre_noir.webp" }
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
    image: "/images/v2/etiquette-orange.png",
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
    image: "/images/v2/etiquette-citron-maquette.png",
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
    image: "/images/v2/etiquette-menthe.png",
    shortDescription: "Le mélange botanique VITAL FORCE aux sept ingrédients de la formule, en version goût menthe.",
    highlights: ["Sept ingrédients botaniques", "Goût menthe", "Format 400 g", "Distribution Tunisie"]
  },

];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export const orderStatuses = ["new", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
export const paymentStatuses = ["pending", "paid", "failed", "refunded"] as const;
