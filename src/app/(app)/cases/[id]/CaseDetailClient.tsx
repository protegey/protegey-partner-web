"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, FileText, Share2, CheckCircle2 } from "lucide-react";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import {
  addCaseNoteAction,
  updateCaseAction,
  shareCaseSignalAction,
  type CaseOutcome,
  type CaseWithNotes,
  type SharedSignalCategory,
} from "../actions";
import type { TeamMember } from "../../team/actions";

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

const STATUS_COLOR: Record<string, string> = {
  open: "bg-amber-500/15 text-amber-600",
  investigating: "bg-blue-500/15 text-blue-600",
  closed: "bg-muted text-muted-foreground",
};

export function CaseDetailClient({
  kase: initialCase,
  teamMembers,
  sharedSignalsEnabled,
  canShareSignal,
  initialAlreadyShared,
  knownVisitorIds,
}: {
  kase: CaseWithNotes;
  teamMembers: TeamMember[];
  sharedSignalsEnabled: boolean;
  canShareSignal: boolean;
  initialAlreadyShared: boolean;
  knownVisitorIds: string[];
}) {
  const router = useRouter();
  const guard = useSessionGuard();
  const { t, lang } = useLang();
  const [kase, setKase] = useState(initialCase);
  const [noteBody, setNoteBody] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [closing, setClosing] = useState(false);
  const [outcome, setOutcome] = useState<CaseOutcome>("no_action");
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [sharingBusy, setSharingBusy] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [alreadyShared, setAlreadyShared] = useState(initialAlreadyShared);
  const [sharePhone, setSharePhone] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [shareDeviceFingerprint, setShareDeviceFingerprint] = useState("");
  const [shareCategory, setShareCategory] = useState<SharedSignalCategory>("confirmed_fraud");

  const statusLabel: Record<string, string> = {
    open: t("caseStatusOpen"),
    investigating: t("caseStatusInvestigating"),
    closed: t("caseStatusClosed"),
  };
  const outcomeLabel: Record<string, string> = {
    no_action: t("caseOutcomeNoAction"),
    false_positive: t("caseOutcomeFalsePositive"),
    sar_filed: t("caseOutcomeSarFiled"),
  };

  async function handleAddNote() {
    if (!noteBody.trim()) return;
    setAddingNote(true);
    setError(null);
    try {
      const result = await guard(() => addCaseNoteAction(kase.id, noteBody));
      if (result === null) return;
      if (isError(result)) {
        setError(result.error);
        return;
      }
      setKase((prev) => ({ ...prev, notes: [...prev.notes, result] }));
      setNoteBody("");
    } finally {
      setAddingNote(false);
    }
  }

  async function handleAssign(userId: string) {
    setUpdating(true);
    setError(null);
    try {
      const result = await guard(() => updateCaseAction(kase.id, { assignedToUserId: userId }));
      if (result === null) return;
      if (isError(result)) {
        setError(result.error);
        return;
      }
      setKase((prev) => ({ ...prev, assignedToUserId: result.assignedToUserId }));
    } finally {
      setUpdating(false);
    }
  }

  async function handleStatusChange(status: "open" | "investigating") {
    setUpdating(true);
    setError(null);
    try {
      const result = await guard(() => updateCaseAction(kase.id, { status }));
      if (result === null) return;
      if (isError(result)) {
        setError(result.error);
        return;
      }
      setKase((prev) => ({ ...prev, status: result.status }));
    } finally {
      setUpdating(false);
    }
  }

  async function handleClose() {
    setUpdating(true);
    setError(null);
    try {
      const result = await guard(() => updateCaseAction(kase.id, { status: "closed", outcome }));
      if (result === null) return;
      if (isError(result)) {
        setError(result.error);
        return;
      }
      setKase((prev) => ({ ...prev, ...result }));
      setClosing(false);
    } finally {
      setUpdating(false);
    }
  }

  const hasShareIdentifier = Boolean(sharePhone.trim() || shareEmail.trim() || shareDeviceFingerprint);

  async function handleShareSignal() {
    if (!hasShareIdentifier) return;
    setSharingBusy(true);
    setShareError(null);
    try {
      const identifiers = {
        phoneNumber: sharePhone.trim() || undefined,
        email: shareEmail.trim() || undefined,
        deviceFingerprint: shareDeviceFingerprint || undefined,
      };
      const result = await guard(() => shareCaseSignalAction(kase.id, identifiers, shareCategory));
      if (result === null) return;
      if (isError(result)) {
        setShareError(result.error);
        return;
      }
      setAlreadyShared(true);
      setSharing(false);
      setSharePhone("");
      setShareEmail("");
      setShareDeviceFingerprint("");
    } finally {
      setSharingBusy(false);
    }
  }

  const isClosed = kase.status === "closed";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <button type="button" onClick={() => router.push("/cases")} className="text-xs text-muted-foreground hover:underline">
          {t("caseBackToList")}
        </button>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">{kase.title}</h1>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[kase.status]}`}>{statusLabel[kase.status]}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("signalsColCustomer")}: {kase.externalCustomerId} · {new Date(kase.createdAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {kase.linkedAlertIds.length > 0 ? (
        <div className="rounded-md border border-border bg-card p-4">
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t("caseLinkedAlertsTitle")}</p>
          <div className="flex flex-wrap gap-2">
            {kase.linkedAlertIds.map((id) => (
              <span key={id} className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-foreground">
                {id}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-card p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("caseAssignLabel")}</label>
          <select
            value={kase.assignedToUserId ?? ""}
            disabled={isClosed || updating}
            onChange={(e) => handleAssign(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            <option value="">{t("caseUnassigned")}</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.firstName} {member.lastName}
              </option>
            ))}
          </select>
        </div>

        {!isClosed ? (
          <>
            <button
              type="button"
              disabled={updating || kase.status === "investigating"}
              onClick={() => handleStatusChange("investigating")}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("caseMarkInvestigating")}
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={() => setClosing(true)}
              className="rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {t("caseCloseButton")}
            </button>
            <Link
              href={`/sar-str/new?caseId=${kase.id}`}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <FileText className="size-4" />
              {t("caseDraftSarButton")}
            </Link>
          </>
        ) : (
          <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {t("caseClosedWithOutcome")}: <span className="font-medium text-foreground">{kase.outcome ? outcomeLabel[kase.outcome] : "—"}</span>
            </p>
            {canShareSignal && sharedSignalsEnabled && !alreadyShared ? (
              <button
                type="button"
                onClick={() => setSharing(true)}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Share2 className="size-4" />
                {t("caseShareSignalButton")}
              </button>
            ) : null}
            {alreadyShared ? (
              <p className="flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle2 className="size-4" />
                {t("caseShareSignalDone")}
              </p>
            ) : null}
          </div>
        )}
      </div>

      {isClosed && canShareSignal && !sharedSignalsEnabled ? (
        <p className="text-xs text-muted-foreground">{t("caseShareSignalDisabledHint")}</p>
      ) : null}

      {sharing ? (
        <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">{t("caseShareSignalDialogTitle")}</p>
          <p className="text-xs text-muted-foreground">{t("caseShareSignalDialogHint")}</p>
          <input
            type="tel"
            value={sharePhone}
            onChange={(e) => setSharePhone(e.target.value)}
            placeholder={t("caseShareSignalPhonePlaceholder")}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="email"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            placeholder={t("caseShareSignalEmailPlaceholder")}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          {knownVisitorIds.length > 0 ? (
            <select
              value={shareDeviceFingerprint}
              onChange={(e) => setShareDeviceFingerprint(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">{t("caseShareSignalDevicePlaceholder")}</option>
              {knownVisitorIds.map((visitorId) => (
                <option key={visitorId} value={visitorId}>
                  {visitorId}
                </option>
              ))}
            </select>
          ) : null}
          {!hasShareIdentifier ? <p className="text-xs text-muted-foreground">{t("caseShareSignalAtLeastOneHint")}</p> : null}
          <select
            value={shareCategory}
            onChange={(e) => setShareCategory(e.target.value as SharedSignalCategory)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="confirmed_fraud">{t("sharedSignalCategoryConfirmedFraud")}</option>
            <option value="identity_theft">{t("sharedSignalCategoryIdentityTheft")}</option>
            <option value="money_laundering">{t("sharedSignalCategoryMoneyLaundering")}</option>
            <option value="other">{t("sharedSignalCategoryOther")}</option>
          </select>
          {shareError ? <p className="text-sm text-destructive">{shareError}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={sharingBusy || !hasShareIdentifier}
              onClick={handleShareSignal}
              className="flex items-center gap-2 rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {sharingBusy ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("caseShareSignalConfirm")}
            </button>
            <button
              type="button"
              onClick={() => setSharing(false)}
              className="rounded-md border border-border px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t("commonCancel")}
            </button>
          </div>
        </div>
      ) : null}

      {closing ? (
        <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">{t("caseCloseDialogTitle")}</p>
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as CaseOutcome)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="no_action">{t("caseOutcomeNoAction")}</option>
            <option value="false_positive">{t("caseOutcomeFalsePositive")}</option>
            <option value="sar_filed">{t("caseOutcomeSarFiled")}</option>
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={updating}
              onClick={handleClose}
              className="flex items-center gap-2 rounded-md bg-destructive px-3.5 py-1.5 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {updating ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("caseConfirmClose")}
            </button>
            <button
              type="button"
              onClick={() => setClosing(false)}
              className="rounded-md border border-border px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t("commonCancel")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-foreground">{t("caseNotesTitle")}</p>
        {kase.notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("caseNotesEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {kase.notes.map((note) => (
              <li key={note.id} className="rounded-md border border-border bg-card p-3">
                <p className="text-sm text-foreground">{note.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}</p>
              </li>
            ))}
          </ul>
        )}

        {!isClosed ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder={t("caseNotePlaceholder")}
              rows={3}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              disabled={addingNote || !noteBody.trim()}
              onClick={handleAddNote}
              className="flex w-fit items-center gap-2 rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {addingNote ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("caseAddNoteButton")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
