"use client";

import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { Pagination } from "@/components/Pagination";
import { describeEvent } from "@/lib/events";
import type { NotificationsPage } from "./actions";

export function NotificationsClient({ result, page }: { result: NotificationsPage; page: number }) {
  const router = useRouter();
  const { t, lang } = useLang();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("notificationsPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("notificationsPageSubtitle")}</p>
      </div>

      {result.data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-border p-10 text-center">
          <Bell className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("notificationsEmpty")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {result.data.map((event) => (
            <div key={event.id} className="rounded-md border border-border bg-card p-3.5">
              <p className="text-sm text-foreground">{describeEvent(lang, event)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}</p>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={result.totalPages} total={result.total} onPageChange={(next) => router.push(`/notifications?page=${next}`)} />
    </div>
  );
}
