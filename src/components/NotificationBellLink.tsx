import Link from "next/link";
import { Bell } from "lucide-react";

export function NotificationBellLink({ unreadCount, ariaLabel }: { unreadCount: number; ariaLabel: string }) {
  return (
    <Link
      href="/notifications"
      aria-label={ariaLabel}
      className="relative flex size-8 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-muted"
    >
      <Bell className="size-4" />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
