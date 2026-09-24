"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { describeEvent, eventHref, type NotificationEvent } from "@/lib/events";
import { getNotifications, markNotificationsSeen } from "@/app/(app)/notifications/actions";

const POLL_INTERVAL_MS = 20_000;

export function NotificationBellLink({ ariaLabel }: { ariaLabel: string }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await getNotifications(1);
      setItems(result.data.slice(0, 8));
      setUnreadCount(result.unreadCount);
    } catch {
      // A missed poll must never surface as an error to the user — it'll retry on the next tick.
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      setUnreadCount(0);
      await markNotificationsSeen();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={ariaLabel}
        className="relative flex size-8 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-muted"
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-80 rounded-md border border-border bg-card shadow-xl">
          <div className="border-b border-border px-3.5 py-2.5">
            <p className="text-sm font-semibold text-foreground">{t("notificationsPageTitle")}</p>
          </div>
          {items.length === 0 ? (
            <p className="px-3.5 py-6 text-center text-sm text-muted-foreground">{t("notificationsEmpty")}</p>
          ) : (
            <div className="flex max-h-96 flex-col divide-y divide-border overflow-y-auto">
              {items.map((event) => {
                const href = eventHref(event);
                const content = (
                  <>
                    <p className="text-sm text-foreground">{describeEvent(lang, event)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}</p>
                  </>
                );
                return href ? (
                  <Link key={event.id} href={href} onClick={() => setOpen(false)} className="block px-3.5 py-2.5 transition-colors hover:bg-muted">
                    {content}
                  </Link>
                ) : (
                  <div key={event.id} className="px-3.5 py-2.5">
                    {content}
                  </div>
                );
              })}
            </div>
          )}
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-border px-3.5 py-2.5 text-center text-xs font-medium text-primary hover:underline"
          >
            {t("notificationsViewAll")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
