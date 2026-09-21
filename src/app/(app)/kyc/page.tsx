import type { Metadata } from "next";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { getKycEnrollments, type DiditSessionStatus } from "./actions";
import { KycDashboardTab } from "./KycDashboardTab";
import { EnrollmentsTable } from "./EnrollmentsTable";
import { StartVerificationDialogButton } from "./StartVerificationDialogButton";
import { RefreshButton } from "./RefreshButton";
import { PaginationControls } from "@/components/PaginationControls";

export const metadata: Metadata = {
  title: "KYC — Protegey Partner",
};

export default async function KycPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const status = params.status as DiditSessionStatus | undefined;
  const [result, lang] = await Promise.all([getKycEnrollments({ page, status }), getLang()]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t(lang, "kycPageTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {t(lang, "kycPageSubtitle")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <RefreshButton />
          <StartVerificationDialogButton />
        </div>
      </div>

      <KycDashboardTab enrollments={result.data} total={result.total} />

      <EnrollmentsTable enrollments={result.data} />
      <PaginationControls page={result.page} totalPages={result.totalPages} total={result.total} href={(nextPage) => `/kyc?page=${nextPage}${status ? `&status=${encodeURIComponent(status)}` : ""}`} />
    </div>
  );
}
