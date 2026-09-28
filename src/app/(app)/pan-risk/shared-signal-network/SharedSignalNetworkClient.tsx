"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Search, ShieldAlert, ShieldCheck, ChevronRight } from "lucide-react";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { Pagination } from "@/components/Pagination";
import { checkSharedSignalAction, type CheckSharedSignalResult, type SharedSignalCategory, type SharedSignalReportSummary } from "./actions";
import type { PaginatedResult } from "../../transactions/actions";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

export const SHARED_SIGNAL_NETWORK_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Réseau de signaux partagés",
    explanation:
      "Quand tu fermes un Dossier en confirmant une fraude, tu peux choisir de partager les identifiants du fraudeur — téléphone, email, empreinte d'appareil — dans un pool commun que les autres partenaires Protegey peuvent interroger. Ton identité et les détails de ton dossier ne sont jamais révélés : seule la catégorie (fraude confirmée, usurpation d'identité, blanchiment, autre) et la date sont visibles.\n\nCette page a deux parties : la liste en bas montre ce que TOI tu as partagé au réseau. L'outil de vérification en haut te permet d'interroger le pool en temps réel avant d'intégrer un nouveau client — utile avant l'onboarding pour voir si son numéro ou son email a déjà été signalé ailleurs.\n\nLe partage est réciproque : tu profites des signalements des autres partenaires, et eux des tiens.",
    diagram: [
      [{ label: "Dossier fermé", note: "fraude confirmée, partagé" }],
      [{ label: "Réseau de signaux partagés", note: "pool anonymisé entre partenaires", current: true }],
      [{ label: "Vérification", note: "interrogée avant l'onboarding d'un nouveau client" }],
    ],
    diagramCaption: "Jamais l'identité du partenaire qui a signalé, ni les détails de son dossier — seulement catégorie + date.",
  },
  en: {
    title: "Shared Signal Network",
    explanation:
      "When you close a Case confirming fraud, you can choose to share the fraudster's identifiers — phone, email, device fingerprint — into a shared pool other Protegey partners can query. Your identity and case details are never revealed: only the category (confirmed fraud, identity theft, money laundering, other) and the date are visible.\n\nThis page has two parts: the list below shows what YOU have shared to the network. The check tool above lets you query the pool in real time before onboarding a new customer — useful to see if their phone or email was already flagged elsewhere.\n\nSharing is reciprocal: you benefit from other partners' reports, and they benefit from yours.",
    diagram: [
      [{ label: "Case closed", note: "confirmed fraud, shared" }],
      [{ label: "Shared Signal Network", note: "anonymized cross-partner pool", current: true }],
      [{ label: "Check tool", note: "queried before onboarding a new customer" }],
    ],
    diagramCaption: "Never the reporting partner's identity or case details — only category + date.",
  },
};

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

const CATEGORY_KEY: Record<SharedSignalCategory, string> = {
  confirmed_fraud: "sharedSignalCategoryConfirmedFraud",
  identity_theft: "sharedSignalCategoryIdentityTheft",
  money_laundering: "sharedSignalCategoryMoneyLaundering",
  other: "sharedSignalCategoryOther",
};

const IDENTITY_TYPE_KEY: Record<string, string> = {
  phone: "sharedSignalIdentityTypePhone",
  email: "sharedSignalIdentityTypeEmail",
  device_fingerprint: "sharedSignalIdentityTypeDevice",
};

export function SharedSignalNetworkClient({
  result,
  page,
  initialCategory,
}: {
  result: PaginatedResult<SharedSignalReportSummary>;
  page: number;
  initialCategory: string;
}) {
  const router = useRouter();
  const guard = useSessionGuard();
  const { t, lang } = useLang();
  const [, startTransition] = useTransition();
  const [category, setCategory] = useState(initialCategory);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [device, setDevice] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<CheckSharedSignalResult | null>(null);
  const hasIdentifier = Boolean(phone.trim() || email.trim() || device.trim());

  const categoryLabel = (category: SharedSignalCategory) => t(CATEGORY_KEY[category] as Parameters<typeof t>[0]);
  const identityTypeLabel = (type: string) => t((IDENTITY_TYPE_KEY[type] ?? "sharedSignalIdentityTypePhone") as Parameters<typeof t>[0]);

  async function handleCheck() {
    if (!hasIdentifier) return;
    setChecking(true);
    setCheckError(null);
    setCheckResult(null);
    try {
      const outcome = await guard(() =>
        checkSharedSignalAction({
          phoneNumber: phone.trim() || undefined,
          email: email.trim() || undefined,
          deviceFingerprint: device.trim() || undefined,
        }),
      );
      if (outcome === null) return;
      if (isError(outcome)) {
        setCheckError(outcome.error);
        toast.error(outcome.error);
        return;
      }
      setCheckResult(outcome);
      toast.success(t("sharedSignalCheckCompleteToast"));
    } finally {
      setChecking(false);
    }
  }

  function applyFilters(newPage: number = 1) {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (category !== "all") params.set("category", category);
    startTransition(() => router.push(`/pan-risk/shared-signal-network?${params.toString()}`));
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">{t("sharedSignalNetworkPageTitle")}</h1>
          <PageGuideButton content={SHARED_SIGNAL_NETWORK_GUIDE[lang]} />
        </div>
        <p className="text-sm text-muted-foreground">{t("sharedSignalNetworkPageSubtitle")}</p>
      </div>

      <section className="flex flex-col gap-4 rounded-md border border-border bg-card p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{t("sharedSignalCheckTitle")}</p>
          <p className="text-xs text-muted-foreground">{t("sharedSignalCheckHint")}</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("caseShareSignalPhonePlaceholder")}
            className="w-48 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("caseShareSignalEmailPlaceholder")}
            className="w-48 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={device}
            onChange={(e) => setDevice(e.target.value)}
            placeholder={t("caseShareSignalDevicePlaceholder")}
            className="w-48 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={handleCheck}
            disabled={!hasIdentifier || checking}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Search className="size-3.5" />
            {checking ? t("commonLoading") : t("sharedSignalCheckButton")}
          </button>
        </div>
        {!hasIdentifier ? <p className="text-xs text-muted-foreground">{t("caseShareSignalAtLeastOneHint")}</p> : null}
        {checkError ? <p className="text-sm text-destructive">{checkError}</p> : null}
        {checkResult ? (
          <div
            className={`flex items-start gap-3 rounded-md border p-3 text-sm ${
              checkResult.flagged ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
            }`}
          >
            {checkResult.flagged ? <ShieldAlert className="mt-0.5 size-4 shrink-0" /> : <ShieldCheck className="mt-0.5 size-4 shrink-0" />}
            <div>
              <p className="font-medium">{checkResult.flagged ? t("sharedSignalCheckFlagged") : t("sharedSignalCheckClean")}</p>
              {checkResult.flagged && checkResult.category ? (
                <p className="text-xs opacity-90">
                  {categoryLabel(checkResult.category)} · {t("sharedSignalCheckReportedDaysAgo").replace("{n}", String(checkResult.reportedDaysAgo ?? 0))}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{t("sharedSignalReportsTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("sharedSignalReportsHint")}</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">{t("sharedSignalFilterCategoryLabel")}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">{t("txFilterAllOption")}</option>
                <option value="confirmed_fraud">{t("sharedSignalCategoryConfirmedFraud")}</option>
                <option value="identity_theft">{t("sharedSignalCategoryIdentityTheft")}</option>
                <option value="money_laundering">{t("sharedSignalCategoryMoneyLaundering")}</option>
                <option value="other">{t("sharedSignalCategoryOther")}</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => applyFilters()}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              {t("txFilterApply")}
            </button>
          </div>
        </div>

        {result.data.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-md border border-border p-10 text-center">
            <ShieldCheck className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t("sharedSignalReportsEmpty")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">{t("signalsColWhen")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("sharedSignalColIdentityType")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("sharedSignalColCategory")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("sharedSignalColReportId")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("sharedSignalColSourceCase")}</th>
                  <th className="px-4 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.data.map((report) => (
                  <tr key={report.id} className="transition-colors hover:bg-muted/50">
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                      {new Date(report.reportedAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
                    </td>
                    <td className="px-4 py-2.5 text-foreground">{identityTypeLabel(report.identityType)}</td>
                    <td className="px-4 py-2.5 text-foreground">{categoryLabel(report.category)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{report.id}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <Link href={`/cases/${report.sourceCaseId}`} className="flex flex-col hover:underline">
                        <span className="font-mono font-medium text-foreground">{report.externalCustomerId ?? "—"}</span>
                        {report.sourceCaseTitle ? <span className="text-muted-foreground">{report.sourceCaseTitle}</span> : null}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/pan-risk/shared-signal-network/${report.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        {t("sharedSignalViewDetail")}
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} totalPages={result.totalPages} total={result.total} onPageChange={applyFilters} />
      </section>
    </div>
  );
}
