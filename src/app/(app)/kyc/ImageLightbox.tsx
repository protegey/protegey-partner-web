"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

export interface GalleryImage {
  url: string;
  label: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: GalleryImage[];
  initialIndex: number;
  onClose: () => void;
}) {
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
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, images.length]);

  function handleWheel(event: React.WheelEvent) {
    event.preventDefault();
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z - event.deltaY * 0.0025)));
  }

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
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95" onClick={onClose}>
      <div className="flex items-center justify-between px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-medium text-white">
          {current.label} <span className="text-white/50">({index + 1}/{images.length})</span>
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.5))}
            className="rounded-md p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Zoom out"
          >
            <ZoomOut className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.5))}
            className="rounded-md p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Zoom in"
          >
            <ZoomIn className="size-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
      >
        {index > 0 ? (
          <button
            type="button"
            onClick={() => setIndex((i) => i - 1)}
            className="absolute left-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Previous image"
          >
            <ChevronLeft className="size-6" />
          </button>
        ) : null}

        {/* eslint-disable-next-line @next/next/no-img-element -- external Didit-hosted asset, no local optimization needed */}
        <img
          src={current.url}
          alt={current.label}
          draggable={false}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, cursor: zoom > 1 ? "grab" : "default" }}
          className="max-h-[85vh] max-w-[90vw] select-none object-contain transition-transform duration-100"
        />

        {index < images.length - 1 ? (
          <button
            type="button"
            onClick={() => setIndex((i) => i + 1)}
            className="absolute right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Next image"
          >
            <ChevronRight className="size-6" />
          </button>
        ) : null}
      </div>

      <p className="pb-3 text-center text-xs text-white/40">Scroll to zoom · drag to pan · arrow keys to navigate · Esc to close</p>
    </div>
  );
}
