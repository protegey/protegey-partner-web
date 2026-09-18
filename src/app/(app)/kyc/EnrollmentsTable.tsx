import { ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion } from "lucide-react";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";
import type { Lang, StringKey } from "@/lib/i18n/strings";
import type { KycEnrollment, DiditSessionStatus } from "./actions";
import { KycDetailButton } from "./KycDetailButton";
import { countryFlag, countryName } from "./country";

const STATUS_CONFIG: Record<DiditSessionStatus, { key: StringKey; color: string; icon: typeof ShieldCheck }> = {
  "Not Started": { key: "kycStatusNotStarted", color: "text-muted-foreground", icon: ShieldQuestion },
  "In Progress": { key: "kycStatusInProgress", color: "text-amber-600", icon: ShieldAlert },
  "Awaiting User": { key: "kycStatusAwaitingUser", color: "text-amber-600", icon: ShieldAlert },
  "In Review": { key: "kycStatusInReview", color: "text-amber-600", icon: ShieldAlert },
  Approved: { key: "kycStatusApproved", color: "text-primary", icon: ShieldCheck },
  Declined: { key: "kycStatusDeclined", color: "text-destructive", icon: ShieldX },
  Resubmitted: { key: "kycStatusResubmitted", color: "text-amber-600", icon: ShieldAlert },
  Abandoned: { key: "kycStatusAbandoned", color: "text-muted-foreground", icon: ShieldX },
  Expired: { key: "kycStatusExpired", color: "text-muted-foreground", icon: ShieldX },
  "Kyc Expired": { key: "kycStatusKycExpired", color: "text-destructive", icon: ShieldX },
};

function StatusBadge({ status, lang }: { status: DiditSessionStatus; lang: Lang }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG["Not Started"];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${config.color}`}>
      <Icon className="size-3.5" />
      {t(lang, config.key)}
    </span>
  );
}

function ScoreCell({ score }: { score: number | null }) {
  if (score == null) return <span className="text-muted-foreground">—</span>;
  return <span className="text-foreground">{score.toFixed(0)}%</span>;
}

function AmlCell({ riskScore, totalHits, lang }: { riskScore: number | null; totalHits: number | null; lang: Lang }) {
  if (!totalHits) return <span className="text-xs text-muted-foreground">{t(lang, "kycAmlClear")}</span>;
  const color = (riskScore ?? 0) >= 66 ? "text-destructive" : (riskScore ?? 0) >= 33 ? "text-amber-600" : "text-foreground";
  return (
    <span className={`text-xs font-medium ${color}`}>
      {totalHits} {totalHits > 1 ? t(lang, "kycAmlHitPlural") : t(lang, "kycAmlHitSingular")}
      {riskScore != null ? ` · ${t(lang, "kycAmlRiskPrefix")} ${riskScore.toFixed(0)}` : ""}
    </span>
  );
}

export async function EnrollmentsTable({ enrollments }: { enrollments: KycEnrollment[] }) {
  const lang = await getLang();
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 font-medium">{t(lang, "kycColName")}</th>
            <th className="px-4 py-2.5 font-medium">{t(lang, "kycColStatus")}</th>
            <th className="px-4 py-2.5 font-medium">{t(lang, "kycColCountry")}</th>
            <th className="px-4 py-2.5 font-medium">{t(lang, "kycColDocument")}</th>
            <th className="px-4 py-2.5 font-medium">{t(lang, "kycColLiveness")}</th>
            <th className="px-4 py-2.5 font-medium">{t(lang, "kycColFaceMatch")}</th>
            <th className="px-4 py-2.5 font-medium">{t(lang, "kycColAml")}</th>
            <th className="px-4 py-2.5 font-medium">{t(lang, "kycColStarted")}</th>
            <th className="px-4 py-2.5 font-medium">{t(lang, "kycColDetails")}</th>
            <th className="px-4 py-2.5 font-medium text-right">{t(lang, "kycColLink")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {enrollments.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-4 py-6 text-center text-muted-foreground">
                {t(lang, "kycNoSessions")}
              </td>
            </tr>
          ) : (
            enrollments.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2.5 font-medium text-foreground">{e.fullName ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={e.status} lang={lang} />
                </td>
                <td className="px-4 py-2.5 text-foreground">
                  {e.country ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span>{countryFlag(e.country)}</span>
                      {countryName(e.country)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{e.documentType ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <ScoreCell score={e.livenessScore} />
                </td>
                <td className="px-4 py-2.5">
                  <ScoreCell score={e.faceMatchScore} />
                </td>
                <td className="px-4 py-2.5">
                  <AmlCell riskScore={e.amlRiskScore} totalHits={e.amlTotalHits} lang={lang} />
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2.5">
                  <KycDetailButton enrollmentId={e.id} fullName={e.fullName} />
                </td>
                <td className="px-4 py-2.5 text-right">
                  {e.sessionUrl ? (
                    <a href={e.sessionUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary hover:underline">
                      {t(lang, "kycLinkOpen")}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
