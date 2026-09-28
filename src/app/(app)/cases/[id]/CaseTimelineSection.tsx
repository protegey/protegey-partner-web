"use client";

import { History } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { describeEvent, type NotificationEvent } from "@/lib/events";

export function CaseTimelineSection({ events }: { events: NotificationEvent[] }) {
  const { t, lang } = useLang();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-foreground">{t("caseTimelineTitle")}</p>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("caseTimelineEmpty")}</p>
      ) : (
        <ol className="flex flex-col gap-4 border-l border-border pl-4">
          {events.map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute -left-[21px] top-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary/15">
                <History className="size-2.5 text-primary" />
              </span>
              <p className="text-sm text-foreground">{describeEvent(lang, event)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
