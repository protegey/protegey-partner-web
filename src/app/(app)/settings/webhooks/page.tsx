import type { Metadata } from "next";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { getSessionUser } from "@/lib/session";
import { requirePageAccess } from "@/lib/requirePageAccess";
import { getWebhookSummary, getWebhookDeliveries } from "./actions";
import { WebhookCard } from "./WebhookCard";
import { WebhookDeliveriesSection } from "./WebhookDeliveriesSection";
import { PaginationControls } from "@/components/PaginationControls";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const WEBHOOKS_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Webhooks",
    explanation:
      "Un webhook, c'est Protegey qui t'appelle — l'inverse de la clé API. Tu donnes une URL de ton backend, et Protegey y envoie une requête à chaque fois qu'un événement important se produit : un statut KYC qui change, une alerte créée, une alerte qui change de statut, ou une transaction bloquée.\n\nChaque requête est signée avec une clé secrète (HMAC-SHA256) pour que tu puisses vérifier qu'elle vient bien de Protegey et pas d'un tiers. Si une livraison échoue, Protegey retente automatiquement — jusqu'à 5 tentatives étalées sur environ 3 heures — avant d'abandonner ; chaque tentative est visible dans l'historique ci-dessous.",
  },
  en: {
    title: "Webhooks",
    explanation:
      "A webhook is Protegey calling you — the mirror image of the API key. You give it a URL on your backend, and Protegey sends it a request every time something important happens: a KYC status change, an alert created, an alert changing status, or a blocked transaction.\n\nEvery request is signed with a secret key (HMAC-SHA256) so you can verify it really came from Protegey and not a third party. If a delivery fails, Protegey automatically retries — up to 5 attempts spread over about 3 hours — before giving up; every attempt is visible in the history below.",
  },
};

export const metadata: Metadata = {
  title: "Webhooks — Protegey Partner",
};

export default async function WebhooksPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const [user, lang, { page: pageParam }] = await Promise.all([getSessionUser(), getLang(), searchParams]);
  const denied = requirePageAccess(user, "partners.manage_integrations", lang);
  if (denied) return denied;

  const page = Math.max(1, Number(pageParam) || 1);
  const canManageSettings = user?.permissions.includes("partners.manage_integrations") ?? false;
  const [credentials, deliveries] = await Promise.all([getWebhookSummary(), getWebhookDeliveries(page)]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">{t(lang, "navWebhooks")}</h1>
          <PageGuideButton content={WEBHOOKS_GUIDE[lang]} />
        </div>
        <p className="text-sm text-muted-foreground">{t(lang, "settingsWebhookDescription")}</p>
      </div>

      <WebhookCard credentials={credentials} canManage={canManageSettings} />

      <WebhookDeliveriesSection deliveries={deliveries.data} />
      <PaginationControls page={deliveries.page} totalPages={deliveries.totalPages} total={deliveries.total} href={(nextPage) => `/settings/webhooks?page=${nextPage}`} />
    </div>
  );
}
