import { ALPHA3_TO_ALPHA2 } from "./iso3166";

/** Accepts either alpha-2 ("ES", what FaceTec's OCR sends) or alpha-3 ("ESP") and normalizes to alpha-2. */
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

/** Every ISO 3166-1 alpha-2 code this app otherwise knows about (derived from ALPHA3_TO_ALPHA2's
 * own values, so there's exactly one place that enumerates countries), sorted by display name —
 * for a real country picker instead of a free-text 2-letter box a partner could easily mistype. */
export const ALL_COUNTRIES: { code: string; name: string }[] = Array.from(new Set(Object.values(ALPHA3_TO_ALPHA2)))
  .map((code) => ({ code, name: countryName(code) || code }))
  .sort((a, b) => a.name.localeCompare(b.name));
