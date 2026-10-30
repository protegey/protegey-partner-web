"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { downloadCsv } from "@/lib/csv";
import type { AuthExpired } from "@/lib/api";

/**
 * "Export as CSV" toolbar button, reused by every list page — opens a confirmation popup (per
 * the product requirement that export is never a silent one-click action), then calls the
 * page's own export Server Action (already carrying its current filters) and downloads the
 * result. The action exports every row matching the active filters, not just the page on
 * screen — same scope the backend `.../export` endpoints implement.
 */
export function ExportCsvButton({
  filename,
  onExport,
}: {
  /** e.g. "alerts-export.csv" — only used as a client-side fallback; the backend's own
   * Content-Disposition filename isn't available here since the text already arrived as a
   * string, not a Response. */
  filename: string;
  onExport: () => Promise<string | { error: string } | AuthExpired>;
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setPending(true);
    setError(null);
    try {
      const result = await onExport();
      if (typeof result === "string") {
        downloadCsv(filename, result);
        setOpen(false);
      } else if ("authExpired" in result) {
        // Same silent no-op as every other authExpired check in the app — the session-refresh
        // middleware handles redirecting to login on the next navigation.
        setOpen(false);
      } else {
        setError(result.error);
      }
    } catch {
      setError(t("exportCsvError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <Download className="size-3.5" />
        {t("exportCsvButtonLabel")}
      </button>
      <ConfirmActionDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setError(null);
        }}
        onConfirm={handleConfirm}
        title={t("exportCsvConfirmTitle")}
        description={t("exportCsvConfirmDescription")}
        confirmLabel={t("exportCsvConfirmAction")}
        pendingLabel={t("exportCsvPending")}
        pending={pending}
      >
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </ConfirmActionDialog>
    </>
  );
}
