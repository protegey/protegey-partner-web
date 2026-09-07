/**
 * Brand-neutral success graphic for the public KYB form — deliberately plain
 * (theme tokens only, no Protegey mascot/colors), since this page presents as the
 * inviting partner's own process, not Protegey's.
 */
export function SuccessIllustration({ className = "h-24 w-24" }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="48" cy="48" r="48" className="fill-primary/10" />
      <circle cx="48" cy="48" r="34" className="fill-primary/15" />
      <path
        d="M33 49.5l10 10 20-22"
        className="stroke-primary"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
