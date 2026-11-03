"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";

export interface GalleryImage {
  url: string;
  label: string;
}

/** `url` is already a fully-loaded `data:` URI (the base64 image came down with the enrollment
 * detail fetch) — no extra request needed, a plain anchor click triggers the browser's own
 * download handling. */
export function downloadGalleryImage(image: GalleryImage): void {
  const link = document.createElement("a");
  link.href = image.url;
  link.download = `${image.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}.jpg`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

export function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: GalleryImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const { t } = useLang();
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [index]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setIndex((i) => Math.min(i + 1, images.length - 1));
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    }
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, images.length]);

  // Deliberately no scroll/trackpad-to-zoom: a wheel listener's preventDefault() is unreliable
  // across browsers (often treated as passive), so a scroll gesture here could still leak through
  // and scroll the page behind this overlay instead of being blocked — confusing and, with a
  // two-finger trackpad swipe, easy to trigger by accident. Zoom is explicit (buttons) only.

  function handleMouseDown(event: React.MouseEvent) {
    if (zoom <= 1) return;
    dragRef.current = { startX: event.clientX, startY: event.clientY, origX: pan.x, origY: pan.y };
  }

  function handleMouseMove(event: React.MouseEvent) {
    if (!dragRef.current) return;
    setPan({
      x: dragRef.current.origX + (event.clientX - dragRef.current.startX),
      y: dragRef.current.origY + (event.clientY - dragRef.current.startY),
    });
  }

  function stopDragging() {
    dragRef.current = null;
  }

  const current = images[index];
  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex animate-fade-in items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      style={{ overscrollBehavior: "contain" }}
      onClick={onClose}
    >
      {/* The actual card — sized to the image's own space, not edge-to-edge, so it reads as a
          focused popup rather than taking over the whole screen. */}
      <div
        className="relative flex max-h-[min(640px,90vh)] w-fit max-w-[min(720px,92vw)] flex-col overflow-hidden rounded-xl bg-neutral-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
          <p className="truncate text-sm font-medium text-white">
            {current.label} <span className="text-white/50">({index + 1}/{images.length})</span>
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
              disabled={zoom <= MIN_ZOOM}
              className="rounded-md p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
              aria-label={t("zoomOutAria")}
            >
              <ZoomOut className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
              disabled={zoom >= MAX_ZOOM}
              className="rounded-md p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
              aria-label={t("zoomInAria")}
            >
              <ZoomIn className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => downloadGalleryImage(current)}
              className="rounded-md p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={t("kycDownloadImageAria")}
            >
              <Download className="size-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={t("close")}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div
          className="relative flex flex-1 items-center justify-center overflow-hidden bg-black/40"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
        >
          {index > 0 ? (
            <button
              type="button"
              onClick={() => setIndex((i) => i - 1)}
              className="absolute left-2 z-10 rounded-full bg-black/40 p-1.5 text-white transition-colors hover:bg-black/60"
              aria-label={t("kycLightboxPrevAria")}
            >
              <ChevronLeft className="size-5" />
            </button>
          ) : null}

          {/* eslint-disable-next-line @next/next/no-img-element -- base64 data: URI, not a remote asset Next can optimize */}
          <img
            src={current.url}
            alt={current.label}
            draggable={false}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, cursor: zoom > 1 ? "grab" : "default" }}
            className="max-h-[min(560px,80vh)] max-w-full select-none object-contain transition-transform duration-100"
          />

          {index < images.length - 1 ? (
            <button
              type="button"
              onClick={() => setIndex((i) => i + 1)}
              className="absolute right-2 z-10 rounded-full bg-black/40 p-1.5 text-white transition-colors hover:bg-black/60"
              aria-label={t("kycLightboxNextAria")}
            >
              <ChevronRight className="size-5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
