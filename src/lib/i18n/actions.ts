"use server";

import { cookies } from "next/headers";
import type { Lang } from "./strings";
import { LANG_COOKIE } from "./lang";

export async function setLangAction(lang: Lang): Promise<void> {
  const store = await cookies();
  store.set(LANG_COOKIE, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
