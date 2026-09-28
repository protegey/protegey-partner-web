import type { Metadata } from "next";
import { apiFetch, ApiError } from "@/lib/api";
import { KybIllustration } from "@/components/KybIllustration";
import { ReviewingIllustration } from "@/components/ReviewingIllustration";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { getMyDocuments } from "./actions";
import { DocumentUploadRow } from "./DocumentUploadRow";
import { DocumentUploadWizard } from "./DocumentUploadWizard";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const DOCUMENTS_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Documents de conformité",
    explanation:
      "Ces documents sont les tiens — ceux de TON organisation partenaire, pas ceux de tes clients. C'est la vérification que Protegey te demande pour activer ton propre compte : pièces légales, preuves d'enregistrement, etc.\n\nChaque document a un statut : en attente (à déposer), soumis (en cours de revue par Protegey), approuvé, ou rejeté (à renvoyer avec un motif donné). Tant que tout n'est pas approuvé, ton compte reste en onboarding et certaines fonctionnalités restent limitées.\n\nUne fois tous les documents approuvés, ton organisation passe au statut « active » et tu as accès à l'ensemble du produit.",
    diagram: [
      [{ label: "Documents de conformité", note: "déposés par toi, le partenaire", current: true }],
      [{ label: "Revue Protegey", note: "approbation ou rejet" }],
      [{ label: "Compte partenaire actif", note: "accès complet au produit" }],
    ],
  },
  en: {
    title: "Compliance documents",
    explanation:
      "These documents are yours — your own partner organization's, not your clients'. This is the verification Protegey asks you for to activate your own account: legal papers, registration proof, and the like.\n\nEach document has a status: pending (still to upload), submitted (under review by Protegey), approved, or rejected (send it back with the reason given). Until everything is approved, your account stays in onboarding and some features remain limited.\n\nOnce every document is approved, your organization moves to \"active\" status and you get full access to the product.",
    diagram: [
      [{ label: "Compliance documents", note: "uploaded by you, the partner", current: true }],
      [{ label: "Protegey review", note: "approval or rejection" }],
      [{ label: "Active partner account", note: "full product access" }],
    ],
  },
};

interface Partner {
  status: string;
  rejectionReason: string | null;
}

async function loadPartner(): Promise<Partner | null> {
  try {
    return await apiFetch<Partner>("/partners/me");
  } catch (error) {
    if (error instanceof ApiError) return null;
    throw error;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const [partner, lang] = await Promise.all([loadPartner(), getLang()]);
  const title =
    partner?.status === "rejected"
      ? t(lang, "documentsPageTitleRejected")
      : partner?.status !== "active"
        ? t(lang, "documentsPageTitleOnboarding")
        : t(lang, "documentsPageTitleDefault");
  return { title };
}

export default async function DocumentsPage() {
  const [documents, partner, lang] = await Promise.all([getMyDocuments(), loadPartner(), getLang()]);
  const allApproved = documents.length > 0 && documents.every((d) => d.status === "approved");
  const isRejected = partner?.status === "rejected";
  const isOnboarding = partner?.status !== "active" && !isRejected;

  // Needs the partner's attention: something is still unsubmitted or was sent back for a fix.
  const needsAction = documents.some((d) => d.status === "pending" || d.status === "rejected");
  // Nothing left for the partner to do — everything is with Protegey now.
  const isUnderReview = isOnboarding && documents.length > 0 && !needsAction;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {isUnderReview ? (
        <div className="flex flex-col items-center gap-4 pb-2 text-center">
          <ReviewingIllustration className="h-48 w-48 sm:h-56 sm:w-56" />
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">
                {allApproved ? t(lang, "documentsReviewedTitleAllApproved") : t(lang, "documentsReviewedTitleDefault")}
              </h1>
              <PageGuideButton content={DOCUMENTS_GUIDE[lang]} />
            </div>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {allApproved ? t(lang, "documentsReviewedBodyAllApproved") : t(lang, "documentsReviewedBodyDefault")}{" "}
              {t(lang, "documentsReviewedEmailNotice")}
            </p>
          </div>
        </div>
      ) : isOnboarding ? (
        <div className="flex flex-col items-center gap-4 pb-2 text-center">
          <KybIllustration className="h-48 w-48 sm:h-56 sm:w-56" />
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">{t(lang, "documentsOnboardingTitle")}</h1>
              <PageGuideButton content={DOCUMENTS_GUIDE[lang]} />
            </div>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {t(lang, "documentsOnboardingBody")}
            </p>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{t(lang, "documentsSectionTitle")}</h1>
            <PageGuideButton content={DOCUMENTS_GUIDE[lang]} />
          </div>
          <p className="text-sm text-muted-foreground">
            {t(lang, "documentsSectionSubtitle")}
          </p>
        </div>
      )}

      {partner?.status === "rejected" ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm font-semibold text-destructive">{t(lang, "dashboardApplicationRejectedTitle")}</p>
          {partner.rejectionReason ? (
            <p className="mt-1 text-sm text-destructive">{partner.rejectionReason}</p>
          ) : null}
          <p className="mt-2 text-xs text-destructive/80">
            {t(lang, "documentsRejectedResubmitNotice")}
          </p>
        </div>
      ) : null}

      {documents.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          <span className="text-destructive">*</span> {t(lang, "documentsRequiredNotice")}
        </p>
      ) : null}

      <DocumentUploadWizard documents={documents} />

      {documents.some((d) => d.status === "submitted" || d.status === "approved") ? (
        <div className="flex flex-col gap-3">
          {documents
            .filter((d) => d.status === "submitted" || d.status === "approved")
            .map((document) => (
              <DocumentUploadRow key={document.id} document={document} />
            ))}
        </div>
      ) : null}
    </div>
  );
}
