"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n/LangProvider";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import type { StringKey } from "@/lib/i18n/strings";
import { createPepDesignationAction, reviewPepDesignationAction, type PepCategory, type PepDesignation, type PepStatus } from "./actions";

const statuses: PepStatus[] = ["possible_match", "confirmed", "false_positive", "cleared", "expired"];
const categories: PepCategory[] = ["domestic", "foreign", "international_organisation", "family_member", "close_associate"];

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

export function PepClient({ designations, initialStatus }: { designations: PepDesignation[]; initialStatus: PepStatus | "all" }) {
  const { t } = useLang();
  const guard = useSessionGuard();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ externalCustomerId: "", status: "possible_match" as PepStatus, category: "domestic" as PepCategory, role: "", jurisdiction: "", source: "", notes: "" });

  function filterChanged(value: string) {
    setStatusFilter(value as PepStatus | "all");
    const query = value === "all" ? "" : `?status=${encodeURIComponent(value)}`;
    startTransition(() => router.push(`/pep${query}`));
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const result = await guard(() => createPepDesignationAction({ ...form, role: form.role || undefined, jurisdiction: form.jurisdiction || undefined, notes: form.notes || undefined }));
    if (result === null) return;
    if (isError(result)) { setError(result.error); toast.error(result.error); return; }
    setForm({ externalCustomerId: "", status: "possible_match", category: "domestic", role: "", jurisdiction: "", source: "", notes: "" });
    toast.success(t("pepCreatedToast"));
    startTransition(() => router.refresh());
  }

  async function review(designation: PepDesignation, status: PepStatus, notes: string) {
    setError(null);
    const result = await guard(() => reviewPepDesignationAction(designation.id, { status, notes }));
    if (result === null) return;
    if (isError(result)) { setError(result.error); toast.error(result.error); return; }
    toast.success(t("pepReviewedToast"));
    startTransition(() => router.refresh());
  }

  const field = (name: keyof typeof form, label: string, placeholderKey?: StringKey, required = false) => (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <input required={required} value={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} placeholder={placeholderKey ? t(placeholderKey) : undefined} className="rounded-md border border-border bg-background px-3 py-2 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("pepPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("pepPageSubtitle")}</p>
      </div>

      <form onSubmit={create} className="rounded-md border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">{t("pepCreateTitle")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {field("externalCustomerId", t("pepCustomerId"), "pepCustomerIdPlaceholder", true)}
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">{t("pepStatus")}
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PepStatus }))} className="rounded-md border border-border bg-background px-3 py-2 text-sm font-normal text-foreground">{statuses.map((value) => <option key={value} value={value}>{t(`pepStatus_${value}` as never)}</option>)}</select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">{t("pepCategory")}
            <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as PepCategory }))} className="rounded-md border border-border bg-background px-3 py-2 text-sm font-normal text-foreground">{categories.map((value) => <option key={value} value={value}>{t(`pepCategory_${value}` as never)}</option>)}</select>
          </label>
          {field("role", t("pepRole"), "pepRolePlaceholder")}{field("jurisdiction", t("pepJurisdiction"), "pepJurisdictionPlaceholder")}{field("source", t("pepSource"), "pepSourcePlaceholder", true)}
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground sm:col-span-2">{t("pepNotes")}<textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder={t("pepNotesPlaceholder")} className="min-h-20 rounded-md border border-border bg-background px-3 py-2 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring" /></label>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">{error ? <p className="text-sm text-destructive">{error}</p> : <span />}{<button disabled={isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{t("pepCreateButton")}</button>}</div>
      </form>

      <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-foreground">{t("pepListTitle")}</h2><select value={statusFilter} onChange={(event) => filterChanged(event.target.value)} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"><option value="all">{t("pepAllStatuses")}</option>{statuses.map((value) => <option key={value} value={value}>{t(`pepStatus_${value}` as never)}</option>)}</select></div>
      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full text-left text-sm"><thead className="border-b border-border text-xs text-muted-foreground"><tr>{["pepCustomerId", "pepCategory", "pepRole", "pepJurisdiction", "pepSource", "pepStatus", "pepNotes", "pepReview"].map((key) => <th key={key} className="whitespace-nowrap px-4 py-3 font-medium">{t(key as never)}</th>)}</tr></thead><tbody className="divide-y divide-border">{designations.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">{t("pepEmpty")}</td></tr> : designations.map((designation) => <PepRow key={designation.id} designation={designation} onReview={review} t={t} />)}</tbody></table>
      </div>
    </div>
  );
}

function PepRow({ designation, onReview, t }: { designation: PepDesignation; onReview: (designation: PepDesignation, status: PepStatus, notes: string) => Promise<void>; t: (key: never) => string }) {
  const [status, setStatus] = useState(designation.status);
  const [notes, setNotes] = useState(designation.notes ?? "");
  return <tr className="align-top"><td className="px-4 py-3 font-medium text-foreground">{designation.externalCustomerId}</td><td className="px-4 py-3 text-muted-foreground">{t(`pepCategory_${designation.category}` as never)}</td><td className="px-4 py-3 text-muted-foreground">{designation.role ?? "-"}</td><td className="px-4 py-3 text-muted-foreground">{designation.jurisdiction ?? "-"}</td><td className="px-4 py-3 text-muted-foreground">{designation.source}</td><td className="px-4 py-3"><select value={status} onChange={(event) => setStatus(event.target.value as PepStatus)} className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground">{statuses.map((value) => <option key={value} value={value}>{t(`pepStatus_${value}` as never)}</option>)}</select></td><td className="min-w-48 px-4 py-3"><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t("pepNotesPlaceholder" as never)} className="min-h-16 w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground" /></td><td className="px-4 py-3"><button type="button" onClick={() => onReview(designation, status, notes)} className="whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">{t("pepReviewButton" as never)}</button></td></tr>;
}
