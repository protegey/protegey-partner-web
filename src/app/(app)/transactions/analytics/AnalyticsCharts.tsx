"use client";

import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useLang } from "@/lib/i18n/LangProvider";
import type { TransactionStats } from "../actions";

const AXIS_COLOR = "#94a3b8";
const DECISION_COLORS: Record<string, string> = { clear: "#0CB99E", review: "#FBBF24", blocked: "#EF4444" };
const DIRECTION_COLORS: Record<string, string> = { CREDIT: "#0CB99E", DEBIT: "#60A5FA" };

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function AnalyticsCharts({ stats }: { stats: TransactionStats }) {
  const { t, lang } = useLang();
  const locale = lang === "fr" ? "fr-FR" : "en-US";

  const decisionLabel: Record<string, string> = {
    clear: t("txDecisionClear"),
    review: t("txDecisionReview"),
    blocked: t("txDecisionBlocked"),
  };
  const directionLabel: Record<string, string> = { CREDIT: t("txDirectionIn"), DEBIT: t("txDirectionOut") };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("txAnalyticsPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("txAnalyticsPageSubtitle")}</p>
        <p className="mt-1 text-xs font-medium uppercase text-muted-foreground">{t("txWindowLabel")}</p>
      </div>

      {stats.totalCount === 0 ? (
        <p className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">{t("txNoDataYet")}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label={t("txStatTotal")} value={stats.totalCount.toLocaleString(locale)} />
            <StatCard label={t("txStatVolume")} value={stats.totalVolume.toLocaleString(locale)} />
            <StatCard label={t("txStatFlaggedPercent")} value={`${stats.flaggedPercent}%`} />
            <StatCard label={t("txStatAvgRisk")} value={String(stats.averageRiskScore)} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-md border border-border bg-card p-5 lg:col-span-2">
              <p className="mb-3 text-sm font-semibold text-foreground">{t("txChartVolumeTitle")}</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.volumeByDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="txVolumeFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0CB99E" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#0CB99E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
                    <XAxis dataKey="date" tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: AXIS_COLOR, fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="count" stroke="#0CB99E" strokeWidth={2} fill="url(#txVolumeFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-md border border-border bg-card p-5">
              <p className="mb-3 text-sm font-semibold text-foreground">{t("txChartDecisionTitle")}</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.decisionBreakdown}
                      dataKey="count"
                      nameKey="decision"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {stats.decisionBreakdown.map((entry) => (
                        <Cell key={entry.decision} fill={DECISION_COLORS[entry.decision] ?? "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                      formatter={(value, _name, entry) => {
                        const key = String((entry.payload as { decision?: string }).decision ?? "");
                        return [value, decisionLabel[key] ?? key];
                      }}
                    />
                    <Legend formatter={(value: string) => decisionLabel[value] ?? value} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-md border border-border bg-card p-5">
              <p className="mb-3 text-sm font-semibold text-foreground">{t("txChartDirectionTitle")}</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.directionBreakdown} dataKey="count" nameKey="direction" innerRadius={35} outerRadius={60} paddingAngle={2}>
                      {stats.directionBreakdown.map((entry) => (
                        <Cell key={entry.direction} fill={DIRECTION_COLORS[entry.direction] ?? "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                      formatter={(value, _name, entry) => {
                        const key = String((entry.payload as { direction?: string }).direction ?? "");
                        return [value, directionLabel[key] ?? key];
                      }}
                    />
                    <Legend formatter={(value: string) => directionLabel[value] ?? value} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-md border border-border bg-card p-5 lg:col-span-2">
              <p className="mb-3 text-sm font-semibold text-foreground">{t("txTopRulesTitle")}</p>
              {stats.topRules.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("txTopRulesEmpty")}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {stats.topRules.map((rule) => (
                    <div key={rule.code} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-foreground">{(lang === "fr" && rule.nameFr) || rule.name}</span>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">{rule.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
