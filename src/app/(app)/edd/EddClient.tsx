"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2 } from "lucide-react";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import type { TeamMember } from "../team/actions";
import { updateEddReview, type EddChecklist, type EddReview, type EddStatus } from "./actions";

const statuses: EddStatus[] = ["pending", "in_review", "approved", "rejected"];
const statusColors: Record<EddStatus, string> = {
  pending: "bg-amber-500/15 text-amber-600",
  in_review: "bg-blue-500/15 text-blue-600",
  approved: "bg-emerald-500/15 text-emerald-600",
  rejected: "bg-destructive/15 text-destructive",
};
const checklistKeys: (keyof EddChecklist)[] = ["identityVerified", "sourceOfFundsReviewed", "sourceOfWealthReviewed", "businessPurposeVerified", "seniorApproval"];

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

function dateInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function checklistValue(review: EddReview): EddChecklist {
  return review.checklist ?? { identityVerified: false, sourceOfFundsReviewed: false, sourceOfWealthReviewed: false, businessPurposeVerified: false, seniorApproval: false };
}

export function EddClient({ result, initialStatus, teamMembers }: { result: { data: EddReview[]; total: number; page: number; totalPages: number }; initialStatus: EddStatus | "all"; teamMembers: TeamMember[] }) {
  const { t, lang } = useLang();
  const guard = useSessionGuard();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [reviews, setReviews] = useState(result.data);
  const [filter, setFilter] = useState(initialStatus);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const locale = lang === "fr" ? "fr-FR" : "en-US";

  function changeFilter(value: string) {
    setFilter(value as EddStatus | "all");
    const query = value === "all" ? "" : `?status=${encodeURIComponent(value)}`;
    startTransition(() => router.push(`/edd${query}`));
  }

  async function save(review: EddReview, form: HTMLFormElement) {
    const data = new FormData(form);
    const checklist = checklistKeys.reduce((current, key) => ({ ...current, [key]: data.get(`checklist.${key}`) === "on" }), {} as EddChecklist);
    setSavingId(review.id);
    setError(null);
    try {
      const result = await guard(() => updateEddReview(review.id, {
        status: String(data.get("status")) as EddStatus,
        assignedToUserId: String(data.get("assignedToUserId") || "") || null,
        dueAt: String(data.get("dueAt") || "") ? new Date(String(data.get("dueAt"))).toISOString() : null,
        notes: String(data.get("notes") || "") || null,
        checklist,
      }));
      if (result === null) return;
      if (isError(result)) { setError(result.error); return; }
      setReviews((current) => current.map((item) => item.id === review.id ? result : item));
      setEditingId(null);
    } finally {
      setSavingId(null);
    }
  }

  const fields = (review: EddReview, compact = false) => {
    const assignee = teamMembers.find((member) => member.id === review.assignedToUserId);
    const checklist = checklistValue(review);
    const completedChecks = checklistKeys.filter((key) => checklist[key]).length;
    return (
      <>
        <div className={compact ? "grid gap-2 sm:grid-cols-2" : "grid gap-2 text-xs text-muted-foreground sm:grid-cols-4"}>
          <span>{t("eddAssignedTo")}: <strong className="font-medium text-foreground">{assignee ? `${assignee.firstName} ${assignee.lastName}` : t("eddUnassigned")}</strong></span>
          <span>{t("eddDueDate")}: <strong className="font-medium text-foreground">{review.dueAt ? new Date(review.dueAt).toLocaleString(locale) : "—"}</strong></span>
          <span>{t("eddCreatedAt")}: <strong className="font-medium text-foreground">{new Date(review.createdAt).toLocaleDateString(locale)}</strong></span>
          {review.notes ? <span className="whitespace-pre-wrap">{t("eddNotes")}: <strong className="font-medium text-foreground">{review.notes}</strong></span> : null}
          <span>{t("eddChecklist")}: <strong className="font-medium text-foreground">{completedChecks}/{checklistKeys.length} {t("eddChecklistComplete")}</strong></span>
        </div>
        {editingId === review.id ? (
          <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void save(review, event.currentTarget); }}>
            <label className="flex flex-col gap-1 text-xs font-medium text-foreground">{t("eddStatus")}
              <select name="status" defaultValue={review.status} className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-normal">
                {statuses.map((status) => <option key={status} value={status}>{t(`eddStatus_${status}` as never)}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-foreground">{t("eddAssignedTo")}
              <select name="assignedToUserId" defaultValue={review.assignedToUserId ?? ""} className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-normal">
                <option value="">{t("eddUnassigned")}</option>
                {teamMembers.filter((member) => member.isActive).map((member) => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-foreground">{t("eddDueDate")}<input name="dueAt" type="datetime-local" defaultValue={dateInputValue(review.dueAt)} className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-normal" /></label>
            <label className="flex flex-col gap-1 text-xs font-medium text-foreground sm:col-span-2">{t("eddNotes")}<textarea name="notes" rows={3} defaultValue={review.notes ?? ""} className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-normal" /></label>
            <fieldset className="rounded-md border border-border p-3 sm:col-span-2"><legend className="px-1 text-xs font-semibold text-foreground">{t("eddChecklist")}</legend><div className="grid gap-2 sm:grid-cols-2">{checklistKeys.map((key) => <label key={key} className="flex items-center gap-2 text-xs font-normal text-foreground"><input name={`checklist.${key}`} type="checkbox" defaultChecked={checklist[key]} className="size-4 rounded border-border" />{t(`eddChecklist_${key}` as never)}</label>)}</div><p className="mt-2 text-xs text-muted-foreground">{completedChecks}/{checklistKeys.length} {t("eddChecklistComplete")}</p></fieldset>
            <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setEditingId(null)} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">{t("commonCancel")}</button><button disabled={savingId === review.id} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">{savingId === review.id ? <Loader2 className="size-3.5 animate-spin" /> : null}{t("eddSaveReview")}</button></div>
          </form>
        ) : <button type="button" onClick={() => setEditingId(review.id)} className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"><CalendarClock className="size-3.5" />{t("eddReview")}</button>}
      </>
    );
  };

  return <div className="mx-auto flex max-w-6xl flex-col gap-6">
    <div><h1 className="text-xl font-semibold text-foreground">{t("eddPageTitle")}</h1><p className="text-sm text-muted-foreground">{t("eddPageSubtitle")}</p></div>
    <div className="flex items-end gap-3"><label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">{t("eddStatus")}<select value={filter} onChange={(event) => changeFilter(event.target.value)} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"><option value="all">{t("eddAllStatuses")}</option>{statuses.map((status) => <option key={status} value={status}>{t(`eddStatus_${status}` as never)}</option>)}</select></label></div>
    {error ? <p className="text-sm text-destructive">{error}</p> : null}
    <div className="flex flex-col gap-3 md:hidden">{reviews.length === 0 ? <p className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">{t("eddEmpty")}</p> : reviews.map((review) => <div key={review.id} className="rounded-md border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-foreground">{review.externalCustomerId}</p><p className="mt-0.5 text-xs text-muted-foreground">{t(`eddTrigger_${review.trigger}` as never)}</p></div><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColors[review.status]}`}>{t(`eddStatus_${review.status}` as never)}</span></div><div className="mt-3 rounded-md border border-border bg-muted/20 p-3">{fields(review, true)}</div></div>)}</div>
    <div className="hidden overflow-x-auto rounded-md border border-border bg-card md:block"><table className="w-full text-left text-sm"><thead className="border-b border-border text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">{t("eddCustomer")}</th><th className="px-4 py-3 font-medium">{t("eddTrigger")}</th><th className="px-4 py-3 font-medium">{t("eddStatus")}</th><th className="px-4 py-3 font-medium">{t("eddDetails")}</th></tr></thead><tbody className="divide-y divide-border">{reviews.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">{t("eddEmpty")}</td></tr> : reviews.map((review) => <tr key={review.id} className="align-top"><td className="px-4 py-3 font-medium text-foreground">{review.externalCustomerId}</td><td className="px-4 py-3 text-muted-foreground">{t(`eddTrigger_${review.trigger}` as never)}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColors[review.status]}`}>{t(`eddStatus_${review.status}` as never)}</span></td><td className="min-w-96 px-4 py-3"><div className="rounded-md border border-border bg-muted/20 p-3">{fields(review)}</div></td></tr>)}</tbody></table></div>
  </div>;
}
