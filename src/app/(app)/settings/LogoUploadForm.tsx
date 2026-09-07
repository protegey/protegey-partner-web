"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OrganizationLogo } from "@/components/OrganizationLogo";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { uploadLogoAction, removeLogoAction } from "./actions";

export function LogoUploadForm({
  organizationName,
  hasLogo,
  canManage,
}: {
  organizationName: string;
  hasLogo: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  // Cache-bust so the <img> reflects a just-uploaded/removed logo instead of a stale browser cache.
  const [logoVersion, setLogoVersion] = useState(0);

  async function handleFileChange(file: File) {
    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadLogoAction(formData);
    setUploading(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    setMessage({ type: "success", text: "Logo updated." });
    setLogoVersion((v) => v + 1);
    router.refresh();
  }

  async function handleRemove() {
    setRemoving(true);
    const result = await removeLogoAction();
    setRemoving(false);
    setRemoveOpen(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    setLogoVersion((v) => v + 1);
    router.refresh();
  }

  return (
    <div className="flex items-start gap-4">
      <OrganizationLogo logoUrl={hasLogo ? `/api/partner-logo?v=${logoVersion}` : null} name={organizationName} size={64} />
      <div className="flex flex-col gap-2">
        <p className="text-sm text-foreground">
          This logo appears on the KYB application pages and emails you send to your own business clients.
        </p>
        {canManage ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileChange(file);
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
            >
              {uploading ? "Uploading…" : hasLogo ? "Replace logo" : "Upload logo"}
            </button>
            {hasLogo ? (
              <button
                type="button"
                onClick={() => setRemoveOpen(true)}
                className="rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                Remove
              </button>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">You don&apos;t have permission to change this.</p>
        )}
        {message ? (
          <p className={`text-xs ${message.type === "error" ? "text-destructive" : "text-primary"}`}>{message.text}</p>
        ) : null}
      </div>

      <ConfirmActionDialog
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        onConfirm={handleRemove}
        title="Remove your organization logo?"
        description="Your KYB pages and emails will show a generic icon instead."
        confirmLabel="Remove"
        pendingLabel="Removing…"
        pending={removing}
        variant="destructive"
      />
    </div>
  );
}
