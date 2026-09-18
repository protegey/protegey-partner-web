"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lang, StringKey } from "./strings";
import { t as translate } from "./strings";
import { setLangAction } from "./actions";

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: StringKey) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

/**
 * Wraps the app once, near the root, seeded with the lang cookie read server-side (see
 * `getLang`). Client components read/update language through `useLang()`; Server Components
 * (e.g. page.tsx files that render translated titles) call `getLang()`/`t()` directly since
 * they can't use context. `setLang` persists to the cookie AND refreshes the router so
 * server-rendered text picks up the change on the same click, not just on next navigation.
 */
export function LangProvider({ initialLang, children }: { initialLang: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const router = useRouter();

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      setLangAction(next)
        .then(() => router.refresh())
        .catch(() => {});
    },
    [router],
  );

  const value = useMemo<LangContextValue>(
    () => ({ lang, setLang, t: (key: StringKey) => translate(lang, key) }),
    [lang, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
