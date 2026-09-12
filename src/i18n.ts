export const LANGUAGES = ["en", "fr"] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "en";

interface MetadataCopy {
  readonly locale: string;
  readonly pageDescription: string;
  readonly productDescription: string;
  readonly socialDescription: string;
  readonly socialImage: string;
  readonly socialImageAlt: string;
  readonly twitterImageAlt: string;
  readonly websiteDescription: string;
}

interface TitlesCopy {
  readonly accueil: string;
  readonly contact: string;
  readonly expertises: string;
  readonly produits: string;
  readonly studio: string;
}

interface AccessibilityCopy {
  readonly brandHome: string;
  readonly exploreProductStages: string;
  readonly exploreStudio: string;
  readonly languageSelector: string;
  readonly mainNavigation: string;
  readonly perspectives: string;
  readonly skipToContent: string;
  readonly switchToEnglish: string;
  readonly switchToFrench: string;
}

interface NavigationCopy {
  readonly back: string;
  readonly backToRose: string;
  readonly brandSystem: string;
  readonly close: string;
  readonly contact: string;
  readonly products: string;
}

interface PerspectiveCopy {
  readonly action: string;
  readonly description: string;
  readonly title: string;
}

interface HomeCopy {
  readonly firstTitleLine: string;
  readonly openPerspective: string;
  readonly openRose: string;
  readonly secondTitleLine: string;
  readonly strapline: string;
  readonly titlePunctuation: string;
}

interface MobileMenuCopy {
  readonly closeRose: string;
  readonly expertisesAction: string;
  readonly productAction: string;
  readonly studioAction: string;
}

interface ProductCopy {
  readonly description: string;
  readonly documentation: string;
  readonly exploreKurobara: string;
  readonly eyebrow: string;
  readonly firstLeadLine: string;
  readonly github: string;
  readonly secondLeadLine: string;
  readonly signoff: string;
  readonly title: string;
  readonly workflowDiscover: string;
  readonly workflowEnrich: string;
  readonly workflowVerify: string;
}

interface WorkflowCopy {
  readonly discover: string;
  readonly enrich: string;
  readonly export: string;
  readonly shortlist: string;
  readonly verify: string;
}

interface ExpertisesCopy {
  readonly action: string;
  readonly automateDescription: string;
  readonly automateTitle: string;
  readonly buildDescription: string;
  readonly buildTitle: string;
  readonly designDescription: string;
  readonly designTitle: string;
  readonly eyebrow: string;
  readonly firstTitleLine: string;
  readonly secondTitleLine: string;
  readonly titlePunctuation: string;
}

interface StudioCopy {
  readonly contactAction: string;
  readonly descriptionFirstLine: string;
  readonly descriptionSecondLine: string;
  readonly eyebrow: string;
  readonly firstLeadLine: string;
  readonly firstTitleLine: string;
  readonly journalAction: string;
  readonly journalDescription: string;
  readonly journalEyebrow: string;
  readonly secondLeadLine: string;
  readonly secondTitleLine: string;
}

interface ContactCopy {
  readonly action: string;
  readonly companyLabel: string;
  readonly emailLabel: string;
  readonly error: string;
  readonly firstTitleLine: string;
  readonly lead: string;
  readonly loading: string;
  readonly mailFallback: string;
  readonly messageLabel: string;
  readonly nameLabel: string;
  readonly optional: string;
  readonly privacy: string;
  readonly rateLimit: string;
  readonly rateLimitWithDelay: string;
  readonly returnToStudio: string;
  readonly secondTitleGrow: string;
  readonly secondTitleLine: string;
  readonly send: string;
  readonly signoff: string;
  readonly success: string;
  readonly titlePunctuation: string;
}

export interface Copy {
  readonly accessibility: AccessibilityCopy;
  readonly contact: ContactCopy;
  readonly expertises: ExpertisesCopy;
  readonly home: HomeCopy;
  readonly metadata: MetadataCopy;
  readonly mobileMenu: MobileMenuCopy;
  readonly navigation: NavigationCopy;
  readonly perspectives: {
    readonly expertises: PerspectiveCopy;
    readonly produits: PerspectiveCopy;
    readonly studio: PerspectiveCopy;
  };
  readonly product: ProductCopy;
  readonly studio: StudioCopy;
  readonly titles: TitlesCopy;
  readonly workflow: WorkflowCopy;
}

const en: Copy = {
  accessibility: {
    brandHome: "Kurobara Systems, home",
    exploreProductStages: "Explore the product stages",
    exploreStudio: "Explore the studio",
    languageSelector: "Language",
    mainNavigation: "Main navigation",
    perspectives: "Perspectives",
    skipToContent: "Skip to content",
    switchToEnglish: "Switch to English",
    switchToFrench: "Switch to French",
  },
  contact: {
    action: "Email Léandre instead",
    companyLabel: "Company",
    emailLabel: "Email",
    error: "Your message could not be sent. Please try again or use email.",
    firstTitleLine: "An idea",
    lead: "Write me a few lines.",
    loading: "Sending your message...",
    mailFallback: "Prefer email?",
    messageLabel: "Message",
    nameLabel: "Name",
    optional: "optional",
    privacy:
      "Your details are used only to reply. You will not be added to a mailing list.",
    rateLimit: "Too many attempts. Please wait before trying again.",
    rateLimitWithDelay:
      "Too many attempts. Please try again in {delay} seconds.",
    returnToStudio: "Back to the studio",
    secondTitleGrow: "to life",
    secondTitleLine: "to bring",
    send: "Send message",
    signoff: "A simple first conversation.",
    success: "Message sent. Reference: {reference}",
    titlePunctuation: "?",
  },
  expertises: {
    action: "Let's talk about your project",
    automateDescription: "Connect the tools. Streamline operations.",
    automateTitle: "Automate",
    buildDescription: "Build useful software.",
    buildTitle: "Build",
    designDescription: "Clarify the need. Shape the product.",
    designTitle: "Design",
    eyebrow: "Expertise",
    firstTitleLine: "From idea",
    secondTitleLine: "to reality",
    titlePunctuation: ".",
  },
  home: {
    firstTitleLine: "Ideas",
    openPerspective: "Open a perspective.",
    openRose: "Open the rose",
    secondTitleLine: "take shape",
    strapline: "Products, AI, automation.",
    titlePunctuation: ".",
  },
  metadata: {
    locale: "en_US",
    pageDescription:
      "Independent digital product and systems studio. Products, AI, automation. By Léandre.",
    productDescription:
      "Open source B2B prospecting. From market criteria to an actionable list.",
    socialDescription:
      "Products, AI, automation. An independent studio by Léandre.",
    socialImage: "https://kurobara.systems/assets/social/og-studio-en.jpg",
    socialImageAlt:
      "Kurobara Systems. Ideas take shape. A geometric black rose on an ivory background.",
    twitterImageAlt: "The geometric rose of Kurobara Systems.",
    websiteDescription: "Independent digital product and systems studio.",
  },
  mobileMenu: {
    closeRose: "Close the rose",
    expertisesAction: "Discover the expertise",
    productAction: "Explore the product",
    studioAction: "Enter the studio",
  },
  navigation: {
    back: "Back",
    backToRose: "Back to the rose",
    brandSystem: "SYSTEMS",
    close: "Close",
    contact: "Contact",
    products: "Products",
  },
  perspectives: {
    expertises: {
      action: "Discover",
      description: "Design. Automate.\nBuild.",
      title: "Expertise",
    },
    produits: {
      action: "Explore",
      description: "Kurobara\nOpen source B2B prospecting",
      title: "Products",
    },
    studio: {
      action: "Enter",
      description: "Independent. By Léandre.",
      title: "The studio",
    },
  },
  product: {
    description: "From market criteria to an actionable list.",
    documentation: "Documentation",
    exploreKurobara: "Explore Kurobara",
    eyebrow: "Open source product",
    firstLeadLine: "B2B prospecting,",
    github: "GitHub",
    secondLeadLine: "open source.",
    signoff: "Your keys. Your infrastructure.",
    title: "Kurobara",
    workflowDiscover: "Discover",
    workflowEnrich: "Enrich",
    workflowVerify: "Verify",
  },
  studio: {
    contactAction: "Talk with Léandre",
    descriptionFirstLine: "I am Léandre. I design products",
    descriptionSecondLine: "and digital systems.",
    eyebrow: "The studio",
    firstLeadLine: "For your projects.",
    firstTitleLine: "Independent.",
    journalAction: "Read my journal",
    journalDescription: "Ideas, experiments, behind the scenes.",
    journalEyebrow: "Beyond the studio",
    secondLeadLine: "And mine.",
    secondTitleLine: "And committed.",
  },
  titles: {
    accueil: "Kurobara Systems - Ideas take shape.",
    contact: "Contact - Kurobara Systems",
    expertises: "Expertise - Kurobara Systems",
    produits: "Kurobara - Open source B2B prospecting",
    studio: "The studio - Kurobara Systems",
  },
  workflow: {
    discover: "Discover: find companies based on your market criteria.",
    enrich: "Enrich: add company and contact data from your providers.",
    export: "Export: retrieve structured data for your tools.",
    shortlist: "Shortlist: build a list of relevant companies.",
    verify: "Verify: check professional addresses before export.",
  },
};

const fr: Copy = {
  accessibility: {
    brandHome: "Kurobara Systems, accueil",
    exploreProductStages: "Explorer les étapes du produit",
    exploreStudio: "Explorer le studio",
    languageSelector: "Langue",
    mainNavigation: "Navigation principale",
    perspectives: "Les perspectives",
    skipToContent: "Aller au contenu",
    switchToEnglish: "Passer en anglais",
    switchToFrench: "Passer en français",
  },
  contact: {
    action: "Écrire plutôt à Léandre",
    companyLabel: "Entreprise",
    emailLabel: "E-mail",
    error:
      "Votre message n’a pas pu être envoyé. Réessayez ou utilisez l’e-mail.",
    firstTitleLine: "Une idée",
    lead: "Écrivez-moi quelques lignes.",
    loading: "Envoi de votre message...",
    mailFallback: "Vous préférez l’e-mail ?",
    messageLabel: "Message",
    nameLabel: "Nom",
    optional: "facultatif",
    privacy:
      "Vos coordonnées servent uniquement à vous répondre. Vous ne serez inscrit à aucune liste de diffusion.",
    rateLimit: "Trop de tentatives. Patientez avant de réessayer.",
    rateLimitWithDelay: "Trop de tentatives. Réessayez dans {delay} secondes.",
    returnToStudio: "Retour au studio",
    secondTitleGrow: "grandir",
    secondTitleLine: "à faire",
    send: "Envoyer le message",
    signoff: "Un premier échange, simplement.",
    success: "Message envoyé. Référence : {reference}",
    titlePunctuation: " ?",
  },
  expertises: {
    action: "Parlons de votre projet",
    automateDescription: "Relier les outils. Fluidifier les opérations.",
    automateTitle: "Automatiser",
    buildDescription: "Construire des logiciels utiles.",
    buildTitle: "Développer",
    designDescription: "Clarifier le besoin. Dessiner le produit.",
    designTitle: "Concevoir",
    eyebrow: "Expertises",
    firstTitleLine: "De l’idée",
    secondTitleLine: "à l’usage",
    titlePunctuation: ".",
  },
  home: {
    firstTitleLine: "Les idées",
    openPerspective: "Ouvrez une perspective.",
    openRose: "Ouvrir la rose",
    secondTitleLine: "prennent forme",
    strapline: "Produits, IA, automatisation.",
    titlePunctuation: ".",
  },
  metadata: {
    locale: "fr_FR",
    pageDescription:
      "Studio indépendant de produits et de systèmes numériques. Produits, IA, automatisation. Par Léandre.",
    productDescription:
      "La prospection B2B en open source. Des critères de marché à une liste exploitable.",
    socialDescription:
      "Produits, IA, automatisation. Un studio indépendant par Léandre.",
    socialImage: "https://kurobara.systems/assets/social/og-studio-fr.jpg",
    socialImageAlt:
      "Kurobara Systems. Les idées prennent forme. Une rose géométrique noire sur fond ivoire.",
    twitterImageAlt: "La rose géométrique de Kurobara Systems.",
    websiteDescription:
      "Studio indépendant de produits et de systèmes numériques.",
  },
  mobileMenu: {
    closeRose: "Refermer la rose",
    expertisesAction: "Découvrir les expertises",
    productAction: "Explorer le produit",
    studioAction: "Entrer dans le studio",
  },
  navigation: {
    back: "Retour",
    backToRose: "Retour à la rose",
    brandSystem: "SYSTEMS",
    close: "Fermer",
    contact: "Contact",
    products: "Produits",
  },
  perspectives: {
    expertises: {
      action: "Découvrir",
      description: "Concevoir. Automatiser.\nDévelopper.",
      title: "Expertises",
    },
    produits: {
      action: "Explorer",
      description: "Kurobara\nProspection B2B open source",
      title: "Produits",
    },
    studio: {
      action: "Entrer",
      description: "Indépendant. Par Léandre.",
      title: "Le studio",
    },
  },
  product: {
    description: "Des critères de marché à une liste exploitable.",
    documentation: "Documentation",
    exploreKurobara: "Explorer Kurobara",
    eyebrow: "Produit open source",
    firstLeadLine: "La prospection B2B,",
    github: "GitHub",
    secondLeadLine: "en open source.",
    signoff: "Vos clés. Votre infrastructure.",
    title: "Kurobara",
    workflowDiscover: "Découvrir",
    workflowEnrich: "Enrichir",
    workflowVerify: "Vérifier",
  },
  studio: {
    contactAction: "Échanger avec Léandre",
    descriptionFirstLine: "Je suis Léandre. Je conçois des produits",
    descriptionSecondLine: "et des systèmes numériques.",
    eyebrow: "Le studio",
    firstLeadLine: "Pour vos projets.",
    firstTitleLine: "Indépendant.",
    journalAction: "Lire mon journal",
    journalDescription: "Les idées, les essais, les coulisses.",
    journalEyebrow: "À côté du studio",
    secondLeadLine: "Et pour les miens.",
    secondTitleLine: "Et impliqué.",
  },
  titles: {
    accueil: "Kurobara Systems - Les idées prennent forme.",
    contact: "Contact - Kurobara Systems",
    expertises: "Expertises - Kurobara Systems",
    produits: "Kurobara - La prospection B2B en open source",
    studio: "Le studio - Kurobara Systems",
  },
  workflow: {
    discover:
      "Découvrir : trouver des entreprises à partir de vos critères de marché.",
    enrich:
      "Enrichir : compléter les entreprises et les contacts avec vos fournisseurs.",
    export: "Exporter : récupérer les données structurées pour vos outils.",
    shortlist: "Sélectionner : constituer une liste d’entreprises pertinentes.",
    verify:
      "Vérifier : contrôler les adresses professionnelles avant l’export.",
  },
};

export const translations: Readonly<Record<Language, Copy>> = { en, fr };

export const readLanguage = (search: string): Language => {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  );
  return params.get("lang") === "fr" ? "fr" : DEFAULT_LANGUAGE;
};

export const languageSearch = (search: string, language: Language): string => {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  );
  if (language === "fr") {
    params.set("lang", "fr");
  } else {
    params.delete("lang");
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
};
