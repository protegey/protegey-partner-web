import type { Metadata } from "next";
import { getKycEnrollments } from "./actions";
import { KycDashboardTab } from "./KycDashboardTab";
import { EnrollmentsTable } from "./EnrollmentsTable";
import { StartVerificationDialogButton } from "./StartVerificationDialogButton";
import { RefreshButton } from "./RefreshButton";

export const metadata: Metadata = {
  title: "KYC — Protegey Partner",
};

export default async function KycPage() {
  const result = await getKycEnrollments();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">KYC verification</h1>
          <p className="text-sm text-muted-foreground">
            Identity verification sessions for your end users, powered by Didit.
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
