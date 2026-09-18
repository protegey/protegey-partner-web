"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { useLang } from "@/lib/i18n/LangProvider";
import type { StringKey } from "@/lib/i18n/strings";

// Illustrative sample data — not connected to real signal/alert volume yet.
const TRANSACTIONS_DATA: { dayKey: StringKey; volume: number }[] = [
  { dayKey: "dashboardDayMon", volume: 420 },
  { dayKey: "dashboardDayTue", volume: 512 },
  { dayKey: "dashboardDayWed", volume: 478 },
  { dayKey: "dashboardDayThu", volume: 610 },
  { dayKey: "dashboardDayFri", volume: 734 },
  { dayKey: "dashboardDaySat", volume: 690 },
  { dayKey: "dashboardDaySun", volume: 812 },
];

const ALERTS_DATA: { severityKey: StringKey; count: number; color: string }[] = [
  { severityKey: "dashboardSeverityLow", count: 34, color: "#0CB99E" },
  { severityKey: "dashboardSeverityMedium", count: 21, color: "#FBBF24" },
  { severityKey: "dashboardSeverityHigh", count: 9, color: "#F97316" },
  { severityKey: "dashboardSeverityCritical", count: 3, color: "#EF4444" },
];

const AXIS_COLOR = "#94a3b8";

export function DashboardCharts() {
  const { t } = useLang();
  const transactionsData = TRANSACTIONS_DATA.map((d) => ({ day: t(d.dayKey), volume: d.volume }));
  const alertsData = ALERTS_DATA.map((d) => ({ severity: t(d.severityKey), count: d.count, color: d.color }));

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-border bg-card p-5">
        <p className="text-xs font-medium text-muted-foreground">{t("dashboardTxMonitoredTitle")}</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">4,256</p>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={transactionsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0CB99E" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0CB99E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
              <XAxis dataKey="day" tick={{ fill: AXIS_COLOR, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: AXIS_COLOR, fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              />
              <Area type="monotone" dataKey="volume" stroke="#0CB99E" strokeWidth={2} fill="url(#volumeFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <p className="text-xs font-medium text-muted-foreground">{t("dashboardAlertsSeverityTitle")}</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">67</p>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={alertsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
              <XAxis dataKey="severity" tick={{ fill: AXIS_COLOR, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: AXIS_COLOR, fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {alertsData.map((entry) => (
                  <Cell key={entry.severity} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
