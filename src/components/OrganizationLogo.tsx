import { Building2 } from "lucide-react";

/**
 * Shows a partner's own uploaded logo, or a generic, brand-neutral placeholder icon
 * when they haven't set one — never Protegey's own logo/branding.
 */
export function OrganizationLogo({
  logoUrl,
  name,
  size = 40,
}: {
  logoUrl: string | null;
  name: string;
  size?: number;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-md border border-border object-cover"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground"
      aria-label={`${name} logo placeholder`}
    >
      <Building2 style={{ width: size * 0.5, height: size * 0.5 }} />
    </div>
  );
}
