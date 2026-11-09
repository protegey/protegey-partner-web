/**
 * Protegey's own default brand colors — shown on a partner's client-facing pages (the KYB
 * application form) whenever that partner hasn't set their own. Also mirrored (not imported;
 * separate deployments) in `protegey-facetec-web`'s own theme files and in
 * `settings/profile/BrandColorsForm.tsx` — each repo/surface keeps its own copy of the same 3
 * values rather than sharing a package across repos for just this.
 */
export const DEFAULT_BRAND_COLORS = { primary: "#0cb99e", secondary: "#0b1741", tertiary: "#ff6b00" };

export interface BrandColors {
  primary: string | null;
  secondary: string | null;
  tertiary: string | null;
}

/** Plain white or Protegey's own dark navy, whichever reads better on top of `hex` — same
 * perceptual-luminance approach as WCAG's relative luminance, simplified since this only ever
 * has to choose between these two fixed foregrounds, not guarantee a specific contrast ratio. */
export function pickForegroundColor(hex: string): string {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) return "#ffffff";
  const value = parseInt(match[1], 16);
  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0b1741" : "#ffffff";
}

/** CSS custom properties to spread onto a wrapping element's `style` — every client-facing page
 * that needs to reflect a partner's brand colors sets these once at the top and lets its own
 * buttons/accents reference `var(--brand-primary)` etc. instead of this app's own (shared with
 * the authenticated admin side) `--primary` token, which must never change per-partner. */
export function brandColorStyleVars(colors: BrandColors | null | undefined): Record<string, string> {
  const primary = colors?.primary ?? DEFAULT_BRAND_COLORS.primary;
  const secondary = colors?.secondary ?? DEFAULT_BRAND_COLORS.secondary;
  const tertiary = colors?.tertiary ?? DEFAULT_BRAND_COLORS.tertiary;
  return {
    "--brand-primary": primary,
    "--brand-primary-foreground": pickForegroundColor(primary),
    "--brand-secondary": secondary,
    "--brand-secondary-foreground": pickForegroundColor(secondary),
    "--brand-tertiary": tertiary,
    "--brand-tertiary-foreground": pickForegroundColor(tertiary),
  };
}
