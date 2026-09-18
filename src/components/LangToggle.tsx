"use client";

import { useLang } from "@/lib/i18n/LangProvider";

/** Same visual language as ThemeToggle — sits right next to it in the sidebar footer. */
export function LangToggle() {
  const { lang, setLang, t } = useLang();

  return (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "fr" : "en")}
      aria-label={t("languageToggleAria")}
      className="flex size-8 items-center justify-center rounded-md border border-border text-xs font-semibold text-foreground transition-colors hover:bg-muted"
    >
      {lang === "en" ? "FR" : "EN"}
    </button>
  );
}
