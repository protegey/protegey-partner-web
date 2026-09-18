"use client";

import { ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useLang } from "@/lib/i18n/LangProvider";
import type { TransactionStats } from "../transactions/actions";

const AXIS_COLOR = "#94a3b8";
const DECISION_COLORS: Record<string, string> = { clear: "#0CB99E", review: "#FBBF24", blocked: "#EF4444" };

export function DashboardCharts({ stats }: { stats: TransactionStats }) {
  const { t, lang } = useLang();

  const decisionLabel: Record<string, string> = {
    clear: t("txDecisionClear"),
    review: t("txDecisionReview"),
    blocked: t("txDecisionBlocked"),
  };

  if (stats.totalCount === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">{t("dashboardNoTxYet")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-md border border-border bg-card p-5 lg:col-span-2">
        <p className="text-xs font-medium text-muted-foreground">{t("dashboardChartVolumeTitle")}</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">{stats.totalCount.toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}</p>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.volumeByDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0CB99E" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0CB99E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
              <XAxis dataKey="date" tick={{ fill: AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: AXIS_COLOR, fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#0CB99E" strokeWidth={2} fill="url(#volumeFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <p className="text-xs font-medium text-muted-foreground">{t("dashboardChartDecisionTitle")}</p>
        <div className="mt-2 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={stats.decisionBreakdown} dataKey="count" nameKey="decision" innerRadius={40} outerRadius={65} paddingAngle={2}>
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
              <Legend formatter={(value: string) => decisionLabel[value] ?? value} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
