"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { Pagination } from "@/components/Pagination";
import { StatsCards } from "./StatsCards";
import { SanctionsTable } from "./SanctionsTable";
import type { SanctionsEntity, SanctionsStats } from "./actions";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const SANCTIONS_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Sanctions",
    explanation:
      "Cette page est le registre de toutes les correspondances de criblage déjà trouvées — pendant une vérification KYC, une soumission KYB, ou une recherche manuelle — contre les listes de sanctions et de personnes politiquement exposées (PPE). Ce n'est pas un outil de recherche : c'est l'historique de ce qui a déjà été détecté.\n\nChaque entrée montre le nom, le type (personne/entreprise), la source de la liste, les alias connus, et si l'inscription est active ou levée (« délistée »).\n\nPour chercher un nouveau nom avant d'intégrer quelqu'un, utilise plutôt la page Recherche sanctions.",
    diagram: [
      [
        { label: "Vérification KYC", note: "approuvée" },
        { label: "Soumission KYB" },
        { label: "Recherche sanctions", note: "avec client rattaché" },
      ],
      [{ label: "Sanctions", note: "registre des correspondances trouvées", current: true }],
    ],
  },
  en: {
    title: "Sanctions",
    explanation:
      "This page is the record of every screening match already found — during a KYC verification, a KYB submission, or a manual search — against sanctions and Politically Exposed Person (PEP) lists. It's not a search tool: it's the history of what's already been detected.\n\nEach entry shows the name, type (person/business), the list source, known aliases, and whether the listing is active or lifted (\"delisted\").\n\nTo look up a new name before onboarding someone, use the Sanctions Search page instead.",
    diagram: [
      [
        { label: "KYC verification", note: "approved" },
        { label: "KYB submission" },
        { label: "Sanctions search", note: "with customer attached" },
      ],
      [{ label: "Sanctions", note: "record of matches found", current: true }],
    ],
  },
};

export function SanctionsClient({
  sanctions,
  page,
  totalPages,
  total,
  stats,
  initialType,
  initialSource,
  initialSearch,
  initialIncludeDelisted,
}: {
  sanctions: SanctionsEntity[];
  page: number;
  totalPages: number;
  total: number;
  stats: SanctionsStats;
  initialType: string;
  initialSource: string;
  initialSearch: string;
  initialIncludeDelisted: boolean;
}) {
  const router = useRouter();
  const { t, lang } = useLang();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [type, setType] = useState(initialType);
  const [source, setSource] = useState(initialSource);
  const [includeDelisted, setIncludeDelisted] = useState(initialIncludeDelisted);

  function applyFilters(newPage: number = 1) {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (search) params.set("search", search);
    if (type !== "all") params.set("type", type);
    if (source !== "all") params.set("source", source);
    if (includeDelisted) params.set("delisted", "true");
    startTransition(() => {
      router.push(`/sanctions?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{t("sanctionsPageTitle")}</h1>
            <PageGuideButton content={SANCTIONS_GUIDE[lang]} />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("sanctionsPageSubtitle")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/sanctions/search"
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Search className="size-4" />
            {t("sanctionsSearchToolLink")}
          </Link>
        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("sanctionsSearchLabel")}</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder={t("sanctionsSearchPlaceholder")}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("sanctionsColType")}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">{t("sanctionsTypeAll")}</option>
            <option value="person">{t("sanctionsTypePerson")}</option>
            <option value="business">{t("sanctionsTypeBusiness")}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("sanctionsColSource")}</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">{t("sanctionsTypeAll")}</option>
            <option value="nigsac">NIGSAC</option>
            <option value="ofac">OFAC</option>
            <option value="eu">EU</option>
            <option value="un">UN</option>
            <option value="au">AU</option>
            <option value="custom">{t("sanctionsSourceCustom")}</option>
          </select>
        </div>
        <label className="flex items-center gap-2 pb-1.5 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={includeDelisted}
            onChange={(e) => setIncludeDelisted(e.target.checked)}
            className="rounded border-border"
          />
          {t("sanctionsIncludeDelisted")}
        </label>
        <button
          type="button"
          onClick={() => applyFilters()}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t("sanctionsApplyButton")}
        </button>
      </div>

      <SanctionsTable sanctions={sanctions} total={total} />

      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={applyFilters} />
    </div>
  );
}
