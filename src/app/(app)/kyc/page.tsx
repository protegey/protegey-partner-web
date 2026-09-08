import type { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard, ScanFace, ClipboardCheck } from "lucide-react";
import { KycDashboardTab } from "./KycDashboardTab";
import { EnrollmentsTable } from "./EnrollmentsTable";

export const metadata: Metadata = {
  title: "KYC — Protegey Partner",
};

type KycTab = "dashboard" | "3d-liveness" | "standard-kyc";

const TABS: { value: KycTab; label: string; icon: React.ReactNode }[] = [
  { value: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
  { value: "3d-liveness", label: "3D Liveness", icon: <ScanFace className="size-4" /> },
  { value: "standard-kyc", label: "Standard KYC", icon: <ClipboardCheck className="size-4" /> },
];

function tabHref(tab: string): string {
  return `/kyc?tab=${tab}`;
}

export default async function KycPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const activeTab: KycTab = tab === "3d-liveness" ? "3d-liveness" : tab === "standard-kyc" ? "standard-kyc" : "dashboard";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">eKYC Review</h1>
          <p className="text-sm text-muted-foreground">
            Enrollment and identity verification data collected through Pan-ID™.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          0 enrolled
        </span>
      </div>

      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={tabHref(t.value)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium ${
              activeTab === t.value
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
            {t.value !== "dashboard" ? (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                0
              </span>
            ) : null}
          </Link>
        ))}
      </div>

      {activeTab === "dashboard" ? <KycDashboardTab /> : null}
      {activeTab === "3d-liveness" ? (
        <EnrollmentsTable subtitle="Users reviewed via FaceTec 3D liveness and face-match data." />
      ) : null}
      {activeTab === "standard-kyc" ? (
        <EnrollmentsTable subtitle="Users reviewed via document / standard KYC data." />
      ) : null}
    </div>
  );
}
