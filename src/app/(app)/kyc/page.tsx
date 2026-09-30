import type { Metadata } from "next";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { getKycEnrollments, type DiditSessionStatus } from "./actions";
import { KycDashboardTab } from "./KycDashboardTab";
import { EnrollmentsTable } from "./EnrollmentsTable";
import { StartVerificationDialogButton } from "./StartVerificationDialogButton";
import { PaginationControls } from "@/components/PaginationControls";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";
import { getSessionUser } from "@/lib/session";
import { requirePageAccess } from "@/lib/requirePageAccess";

const KYC_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "KYC — Vérification d'identité",
    explanation:
      "Ici tu vérifies que tes utilisateurs finaux sont bien qui ils prétendent être. Deux façons de démarrer une session : un lien envoyé au client (il prend une photo de sa pièce d'identité et un selfie), ou une vérification biométrique directement intégrée dans ton appli.\n\nChaque session passe par des statuts (non démarrée, en cours, en attente du client, en revue, approuvée, refusée…) et se termine avec des scores : score de vivacité (est-ce une vraie personne devant la caméra ?), score de correspondance faciale (le selfie correspond-il à la pièce d'identité ?), et un score de risque AML avec le nombre de correspondances trouvées sur les listes de sanctions.\n\nQuand une vérification est approuvée, elle déclenche automatiquement le moteur de règles d'identité (Pan Studio) — par exemple pour détecter si le même document d'identité est déjà utilisé par un autre client — ce qui peut créer une alerte.",
    diagram: [
      [{ label: "Vérification d'identité", note: "lien hébergé ou biométrie intégrée" }],
      [{ label: "KYC", note: "statuts + scores de vivacité/correspondance/AML", current: true }],
      [{ label: "Règles d'identité", note: "Pan Studio, si approuvé" }],
      [{ label: "Alerte", note: "ex : document dupliqué" }],
    ],
  },
  en: {
    title: "KYC — Identity verification",
    explanation:
      "This is where you verify your end users really are who they claim to be. Two ways to start a session: a link sent to the customer (they take a photo of their ID and a selfie), or a biometric check built directly into your app.\n\nEvery session moves through statuses (not started, in progress, awaiting user, in review, approved, declined…) and ends with scores: a liveness score (is a real person in front of the camera?), a face-match score (does the selfie match the ID?), and an AML risk score with how many hits were found on sanctions lists.\n\nWhen a verification is approved, it automatically triggers the identity rule engine (Pan Studio) — for example to catch the same ID document already being used by another customer — which can create an alert.",
    diagram: [
      [{ label: "Identity verification", note: "hosted link or built-in biometrics" }],
      [{ label: "KYC", note: "statuses + liveness/match/AML scores", current: true }],
      [{ label: "Identity rules", note: "Pan Studio, if approved" }],
      [{ label: "Alert", note: "e.g. duplicate document" }],
    ],
  },
};

export const metadata: Metadata = {
  title: "KYC — Protegey Partner",
};

export default async function KycPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, "partners.manage_kyc", lang);
  if (denied) return denied;

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const status = params.status as DiditSessionStatus | undefined;
  const result = await getKycEnrollments({ page, status });

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{t(lang, "kycPageTitle")}</h1>
            <PageGuideButton content={KYC_GUIDE[lang]} />
          </div>
          <p className="text-sm text-muted-foreground">
            {t(lang, "kycPageSubtitle")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StartVerificationDialogButton />
        </div>
      </div>

      <KycDashboardTab enrollments={result.data} total={result.total} />

      <EnrollmentsTable enrollments={result.data} />
      <PaginationControls page={result.page} totalPages={result.totalPages} total={result.total} href={(nextPage) => `/kyc?page=${nextPage}${status ? `&status=${encodeURIComponent(status)}` : ""}`} />
    </div>
  );
}
