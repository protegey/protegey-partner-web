"use client";

import type { Lang } from "./i18n";

export function LanguageToggle({ lang, onChange }: { lang: Lang; onChange: (lang: Lang) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(lang === "en" ? "fr" : "en")}
      aria-label="Toggle language"
      className="flex size-8 items-center justify-center rounded-md border border-border text-xs font-semibold text-foreground transition-colors hover:bg-muted"
    >
      {lang === "en" ? "FR" : "EN"}
    </button>
  );
}
