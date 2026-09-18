import type { Metadata } from "next";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import { getKycEnrollments } from "./actions";
import { KycDashboardTab } from "./KycDashboardTab";
import { EnrollmentsTable } from "./EnrollmentsTable";
import { StartVerificationDialogButton } from "./StartVerificationDialogButton";
import { RefreshButton } from "./RefreshButton";

export const metadata: Metadata = {
  title: "KYC — Protegey Partner",
};

export default async function KycPage() {
  const [result, lang] = await Promise.all([getKycEnrollments(), getLang()]);

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
    </div>
  );
}
