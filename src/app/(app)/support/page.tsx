import type { Metadata } from "next";
import Link from "next/link";
import { Mail, BookOpen } from "lucide-react";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";

export const metadata: Metadata = {
  title: "Support — Protegey Partner",
};

const SUPPORT_EMAIL = "support@protegey.com";

export default async function SupportPage() {
  const lang = await getLang();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t(lang, "supportPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t(lang, "supportPageSubtitle")}</p>
      </div>

      <div className="rounded-md border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t(lang, "supportEmailCardTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t(lang, "supportEmailCardBody")}</p>
          </div>
        </div>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Mail className="size-4" />
          {t(lang, "supportEmailButton")}
        </a>
      </div>

      <div className="rounded-md border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BookOpen className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t(lang, "supportDocsCardTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t(lang, "supportDocsCardBody")}</p>
          </div>
        </div>
        <Link
          href="/documentation"
          className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <BookOpen className="size-4" />
          {t(lang, "supportDocsButton")}
        </Link>
      </div>
    </div>
  );
}
