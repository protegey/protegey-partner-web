import { ALPHA3_TO_ALPHA2 } from "./iso3166";

/** Accepts either alpha-2 ("ES") or alpha-3 ("ESP", what Didit sends) and normalizes to alpha-2. */
function toAlpha2(code: string): string | null {
  const upper = code.toUpperCase();
  if (upper.length === 2) return upper;
  if (upper.length === 3) return ALPHA3_TO_ALPHA2[upper] ?? null;
  return null;
}

export function countryFlag(code: string | null | undefined): string {
  if (!code) return "";
  const alpha2 = toAlpha2(code);
  if (!alpha2) return "";
  return String.fromCodePoint(...[...alpha2].map((c) => 127397 + c.charCodeAt(0)));
}

export function countryName(code: string | null | undefined): string {
  if (!code) return "";
  const alpha2 = toAlpha2(code);
  if (!alpha2) return code;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(alpha2) ?? code;
  } catch {
    return code;
  }
}
