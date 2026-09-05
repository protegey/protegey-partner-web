"use client";

import { useEffect, useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

export function DocumentPreviewDialog({
  open,
  onClose,
  fileName,
  fileUrl,
  mimeType,
}: {
  open: boolean;
  onClose: () => void;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
}) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!open) return;
    setZoom(1);
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const isImage = mimeType?.startsWith("image/");
  const isPdf = mimeType === "application/pdf";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-md border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="truncate text-sm font-medium text-foreground">{fileName}</p>
          <div className="flex shrink-0 items-center gap-1">
            {isImage ? (
              <>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
                  disabled={zoom <= MIN_ZOOM}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
                  disabled={zoom >= MAX_ZOOM}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  disabled={zoom === 1}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="size-4" />
                </button>
                <div className="mx-1 h-4 w-px bg-border" />
              </>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close preview"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-muted/30 p-2">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fileUrl}
              alt={fileName}
              style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
              className="mx-auto max-h-full w-auto object-contain transition-transform duration-150"
            />
          ) : isPdf ? (
            <iframe src={fileUrl} title={fileName} className="h-full w-full rounded-sm border-0" />
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Preview isn&rsquo;t available for this file type.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
