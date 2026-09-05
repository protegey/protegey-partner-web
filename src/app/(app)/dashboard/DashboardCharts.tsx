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

// Illustrative sample data — not connected to real signal/alert volume yet.
const TRANSACTIONS_DATA = [
  { day: "Mon", volume: 420 },
  { day: "Tue", volume: 512 },
  { day: "Wed", volume: 478 },
  { day: "Thu", volume: 610 },
  { day: "Fri", volume: 734 },
  { day: "Sat", volume: 690 },
  { day: "Sun", volume: 812 },
];

const ALERTS_DATA = [
  { severity: "Low", count: 34, color: "#0CB99E" },
  { severity: "Medium", count: 21, color: "#FBBF24" },
  { severity: "High", count: 9, color: "#F97316" },
  { severity: "Critical", count: 3, color: "#EF4444" },
];

const AXIS_COLOR = "#94a3b8";

export function DashboardCharts() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-border bg-card p-5">
        <p className="text-xs font-medium text-muted-foreground">Transactions monitored — last 7 days</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">4,256</p>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={TRANSACTIONS_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
        <p className="text-xs font-medium text-muted-foreground">Alerts by severity — last 30 days</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">67</p>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ALERTS_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
              <XAxis dataKey="severity" tick={{ fill: AXIS_COLOR, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: AXIS_COLOR, fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {ALERTS_DATA.map((entry) => (
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
