/**
 * "Your documents are being reviewed, sit tight" illustration — the same shield
 * mascot as KybIllustration, now relaxed with a warm drink while an hourglass
 * does the waiting for it. Deliberately different pose from the submission
 * illustration so partners can tell the state changed at a glance.
 */
export function ReviewingIllustration({ className = "h-56 w-56" }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 240" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <ellipse cx="140" cy="210" rx="90" ry="14" fill="currentColor" className="text-foreground/5" />

      {/* floating hourglass, top right */}
      <g transform="translate(196,36) rotate(8)">
        <path
          d="M2 2h28v2c0 8-6 11-6 14 0-3 0-3 0 0 0 3 6 6 6 14v2H2v-2c0-8 6-11 6-14 0 3 0 3 0 0 0-3-6-6-6-14V2z"
          fill="#FFFFFF"
          stroke="#0B1741"
          strokeWidth="2"
        />
        <path d="M6 5h20c-1 6-5 9-10 11-5-2-9-5-10-11z" fill="#FBBF24" opacity="0.7" />
        <rect x="0" y="0" width="32" height="3" rx="1.5" fill="#0B1741" />
        <rect x="0" y="33" width="32" height="3" rx="1.5" fill="#0B1741" />
      </g>

      {/* sparkles */}
      <path d="M52 56l2.5 6L61 64.5l-6 2.5L52.5 73l-2.5-6L44 64.5l6-2.5z" fill="#0CB99E" />
      <circle cx="228" cy="120" r="3.5" fill="#FBBF24" />
      <circle cx="44" cy="150" r="3" fill="#0CB99E" />

      {/* checklist card, softly resolved (all checks ticked) */}
      <g transform="translate(44,120) rotate(-10)">
        <rect x="0" y="0" width="48" height="58" rx="6" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(8, ${14 + i * 14})`}>
            <circle cx="5" cy="0" r="5" fill="#0CB99E" />
            <path d="M2.5 0l1.8 2 3.2-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="14" y="-2" width="24" height="4" rx="2" fill="#0B1741" opacity="0.15" />
          </g>
        ))}
      </g>

      {/* mascot: rounded shield body, relaxed */}
      <g>
        <path
          d="M140 44c22 0 40 8 52 14 0 52-18 84-52 100-34-16-52-48-52-100 12-6 30-14 52-14z"
          fill="#0CB99E"
        />
        <path d="M140 44c22 0 40 8 52 14 0 52-18 84-52 100V44z" fill="#0AA88F" />
        {/* relaxed closed eyes */}
        <path d="M114 98c3-3 9-3 12 0" stroke="#0B1741" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M154 98c3-3 9-3 12 0" stroke="#0B1741" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* content smile */}
        <path d="M122 114c8 6 28 6 36 0" stroke="#0B1741" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <ellipse cx="108" cy="106" rx="6" ry="3.5" fill="#0B1741" opacity="0.12" />
        <ellipse cx="172" cy="106" rx="6" ry="3.5" fill="#0B1741" opacity="0.12" />
      </g>

      {/* mug of tea, held up front, with little steam curls */}
      <g transform="translate(112,148)">
        <path d="M6 32c2-16 46-16 48 0-2 14-46 14-48 0z" fill="#FFFFFF" stroke="#0B1741" strokeWidth="2.5" />
        <path d="M54 18c6-2 10 2 8 8-2 5-7 6-10 5" fill="none" stroke="#0B1741" strokeWidth="2.5" />
        <path d="M22 8c1-4-2-6-1-9M32 6c1-4-2-6-1-9M42 8c1-4-2-6-1-9" stroke="#0CB99E" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.8" />
      </g>
    </svg>
  );
}
