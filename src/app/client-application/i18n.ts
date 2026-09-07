export type Lang = "en" | "fr";

const STRINGS = {
  languageToggle: { en: "FR", fr: "EN" },
  heading: { en: "Business Application", fr: "Dossier d'entreprise" },
  subheadingSubmitted: {
    en: "Thanks — your application is being reviewed.",
    fr: "Merci — votre dossier est en cours d'examen.",
  },
  subheadingApproved: { en: "Your application was approved.", fr: "Votre dossier a été approuvé." },
  subheadingRejected: { en: "This application was not approved.", fr: "Ce dossier n'a pas été approuvé." },
  subheadingMoreInfo: {
    en: "A few more details are needed before we can continue.",
    fr: "Quelques informations supplémentaires sont nécessaires avant de continuer.",
  },
  subheadingPending: {
    en: "Please complete every section below, then submit.",
    fr: "Veuillez compléter toutes les sections ci-dessous, puis soumettre.",
  },
  moreInfoNoteLabel: { en: "What's needed:", fr: "Ce qui est nécessaire :" },

  sectionGeneralInfo: { en: "General Information", fr: "Informations générales" },
  sectionBusinessDescription: { en: "Business Description", fr: "Description de l'activité" },
  sectionPaymentServices: { en: "Payment Services", fr: "Services de paiement" },
  sectionDisclosures: { en: "Disclosure Questions", fr: "Questions de divulgation" },
  sectionDocument: { en: "Supporting Document", fr: "Document justificatif" },

  legalName: { en: "Legal name", fr: "Dénomination légale" },
  tradingName: { en: "Trading name (if applicable)", fr: "Nom commercial (le cas échéant)" },
  tradingAddress: { en: "Trading address", fr: "Adresse commerciale" },
  mailingAddress: { en: "Mailing address (if different)", fr: "Adresse postale (si différente)" },
  legalStatus: { en: "Legal status (e.g. limited company)", fr: "Statut juridique (ex. société à responsabilité limitée)" },
  incorporationDate: { en: "Date of incorporation", fr: "Date de constitution" },
  registrationNumber: { en: "Registered number", fr: "Numéro d'immatriculation" },
  website: { en: "Website", fr: "Site internet" },
  phone: { en: "Business phone number", fr: "Téléphone professionnel" },
  contactPerson: { en: "Contact person", fr: "Personne à contacter" },
  owners: { en: "Owners / individuals with ownership interest", fr: "Propriétaires / personnes détenant une participation" },
  ownerName: { en: "Name", fr: "Nom" },
  ownerTaxpayerNumber: { en: "Taxpayer number / TIN", fr: "Numéro de contribuable / TIN" },
  ownerDob: { en: "Date of birth / incorporation", fr: "Date de naissance / constitution" },
  ownerAddress: { en: "Address", fr: "Adresse" },
  ownerOwnershipPercent: { en: "Ownership %", fr: "Pourcentage de propriété" },
  ownerNonEu: { en: "Non-EU entity or citizen", fr: "Entité ou citoyen non européen" },
  addOwner: { en: "Add owner", fr: "Ajouter un propriétaire" },
  removeOwner: { en: "Remove", fr: "Retirer" },

  yearsInOperation: { en: "Years in operation", fr: "Années d'activité" },
  countriesOfOperation: { en: "Countries where you do business", fr: "Pays où vous exercez votre activité" },
  hasShellBankRelationships: { en: "Do you have relationships with shell banks?", fr: "Entretenez-vous des relations avec des banques fictives ?" },
  shellBankDetails: { en: "Details", fr: "Détails" },
  primaryBusinessFocus: { en: "Primary focus of your business", fr: "Objectif principal de votre activité" },
  mainRevenueActivity: { en: "Activity that generates most revenue", fr: "Activité qui génère le plus de revenus" },
  estimatedMonthlyTransactionCount: { en: "Estimated monthly transaction count", fr: "Nombre estimé de transactions mensuelles" },
  estimatedMonthlyTransactionValue: { en: "Estimated monthly transaction value", fr: "Valeur estimée des transactions mensuelles" },

  yearsProvidingPaymentServices: { en: "Years providing payment services", fr: "Années de prestation de services de paiement" },
  focusType: { en: "Are payment services your...", fr: "Les services de paiement sont-ils..." },
  focusPrimary: { en: "Primary business focus", fr: "Objectif principal de l'activité" },
  focusConvenience: { en: "For customer convenience only", fr: "Pour la commodité des clients uniquement" },
  focusSupplement: { en: "Supplement to business income", fr: "Supplément au revenu de l'entreprise" },
  servicesOffered: { en: "Payment services offered", fr: "Services de paiement fournis" },
  serviceMoneyRemittance: { en: "Money remittance", fr: "Envoi d'argent" },
  serviceBillPayment: { en: "Bill payment", fr: "Paiement de factures" },
  serviceOther: { en: "Other", fr: "Autre" },
  otherServiceDetails: { en: "Please specify", fr: "Veuillez préciser" },
  usesAgents: { en: "Do you have agents (non-employees) offering payment services?", fr: "Avez-vous des agents (non-employés) offrant des services de paiement ?" },
  totalAgents: { en: "Total number of agents", fr: "Nombre total d'agents" },
  agentsOutsideCountryDetails: { en: "Agents located outside your country (details)", fr: "Agents situés en dehors de votre pays (détails)" },
  isAffiliateOfOtherFi: {
    en: "Are you an agency, branch or subsidiary of another financial institution?",
    fr: "Êtes-vous une agence, succursale ou filiale d'une autre institution financière ?",
  },
  affiliateType: { en: "Type of affiliation", fr: "Type d'affiliation" },
  affiliateName: { en: "Name of affiliate / parent company", fr: "Nom de la société affiliée / mère" },
  affiliateLicensingCountry: { en: "Licensing country of affiliate", fr: "Pays de licence de la société affiliée" },

  licenseDeniedSuspendedRevoked: {
    en: "Has any authority ever denied, suspended or revoked your license or registration?",
    fr: "Une autorité a-t-elle déjà refusé, suspendu ou révoqué votre licence ou enregistrement ?",
  },
  bankruptcy: { en: "Have you or any officer ever filed for bankruptcy?", fr: "Avez-vous ou un dirigeant déjà fait faillite ?" },
  criminalConviction: {
    en: "Has your business or any officer ever been convicted of an offence?",
    fr: "Votre entreprise ou un dirigeant a-t-il déjà été condamné pour une infraction ?",
  },
  amlCivilOrCriminalProceedings: {
    en: "Have you been involved in civil or criminal proceedings related to AML regulations?",
    fr: "Avez-vous été impliqué dans une procédure civile ou pénale liée à la réglementation anti-blanchiment ?",
  },
  yes: { en: "Yes", fr: "Oui" },
  no: { en: "No", fr: "Non" },
  detailsIfYes: { en: "If yes, please provide details", fr: "Si oui, veuillez fournir des détails" },

  documentInstructions: {
    en: "Upload one supporting document (PDF, JPEG or PNG, max 10MB).",
    fr: "Téléversez un document justificatif (PDF, JPEG ou PNG, 10 Mo maximum).",
  },
  documentUploaded: { en: "Uploaded:", fr: "Téléversé :" },
  replaceDocument: { en: "Replace", fr: "Remplacer" },
  uploadDocument: { en: "Upload", fr: "Téléverser" },
  uploading: { en: "Uploading…", fr: "Téléversement…" },

  saveProgress: { en: "Save progress", fr: "Enregistrer" },
  saving: { en: "Saving…", fr: "Enregistrement…" },
  saved: { en: "Progress saved.", fr: "Progression enregistrée." },
  submit: { en: "Submit application", fr: "Soumettre le dossier" },
  submitting: { en: "Submitting…", fr: "Envoi en cours…" },
  invalidToken: {
    en: "This application link is invalid or has expired.",
    fr: "Ce lien de dossier est invalide ou a expiré.",
  },
} as const;

export type StringKey = keyof typeof STRINGS;

export function t(lang: Lang, key: StringKey): string {
  return STRINGS[key][lang];
}
