/**
 * Friendly "please submit your KYB documents" illustration — our shield
 * mascot happily stamping a folder of paperwork. Purely decorative, no
 * external assets, so it themes with the page instead of shipping a raster.
 */
export function KybIllustration({ className = "h-56 w-56" }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 240" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* soft backdrop blob */}
      <ellipse cx="140" cy="210" rx="90" ry="14" fill="currentColor" className="text-foreground/5" />

      {/* floating sparkles */}
      <path d="M226 46l3.5 8.5L238 58l-8.5 3.5L226 70l-3.5-8.5L214 58l8.5-3.5z" fill="#FBBF24" />
      <path d="M48 74l2.5 6L57 82.5l-6 2.5L48.5 91l-2.5-6L40 82.5l6-2.5z" fill="#0CB99E" />
      <circle cx="230" cy="110" r="4" fill="#0CB99E" />
      <circle cx="42" cy="140" r="3.5" fill="#FBBF24" />

      {/* floating checklist card, top right */}
      <g transform="translate(178,28) rotate(12)">
        <rect x="0" y="0" width="46" height="58" rx="6" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" />
        <rect x="8" y="10" width="30" height="4" rx="2" fill="#0B1741" opacity="0.15" />
        <rect x="8" y="20" width="22" height="4" rx="2" fill="#0B1741" opacity="0.15" />
        <circle cx="12" cy="34" r="5" fill="#0CB99E" />
        <path d="M9.5 34l1.8 2 3.2-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="21" y="32" width="17" height="4" rx="2" fill="#0B1741" opacity="0.15" />
      </g>

      {/* floating id card, bottom left */}
      <g transform="translate(46,150) rotate(-10)">
        <rect x="0" y="0" width="42" height="30" rx="5" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" />
        <circle cx="10" cy="15" r="5.5" fill="#0B1741" opacity="0.15" />
        <rect x="20" y="9" width="16" height="3.4" rx="1.7" fill="#0B1741" opacity="0.15" />
        <rect x="20" y="16" width="12" height="3.4" rx="1.7" fill="#0B1741" opacity="0.15" />
      </g>

      {/* mascot: rounded shield body */}
      <g>
        <path
          d="M140 44c22 0 40 8 52 14 0 52-18 84-52 100-34-16-52-48-52-100 12-6 30-14 52-14z"
          fill="#0CB99E"
        />
        <path
          d="M140 44c22 0 40 8 52 14 0 52-18 84-52 100V44z"
          fill="#0AA88F"
        />
        {/* face */}
        <circle cx="122" cy="98" r="6" fill="#0B1741" />
        <circle cx="158" cy="98" r="6" fill="#0B1741" />
        <circle cx="119" cy="96" r="1.8" fill="#FFFFFF" />
        <circle cx="155" cy="96" r="1.8" fill="#FFFFFF" />
        <path d="M120 116c8 8 32 8 40 0" stroke="#0B1741" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        {/* blush */}
        <ellipse cx="108" cy="108" rx="6" ry="3.5" fill="#0B1741" opacity="0.12" />
        <ellipse cx="172" cy="108" rx="6" ry="3.5" fill="#0B1741" opacity="0.12" />
      </g>

      {/* arm + clipboard held up front */}
      <g transform="translate(96,150)">
        <rect x="0" y="0" width="60" height="46" rx="6" fill="#FFFFFF" stroke="#0B1741" strokeWidth="2.5" />
        <rect x="18" y="-6" width="24" height="10" rx="4" fill="#0B1741" />
        <rect x="10" y="12" width="40" height="4.5" rx="2.25" fill="#0B1741" opacity="0.15" />
        <rect x="10" y="21" width="28" height="4.5" rx="2.25" fill="#0B1741" opacity="0.15" />
        <circle cx="16" cy="35" r="6.5" fill="#0CB99E" />
        <path d="M12.5 35l2.4 2.6 4.6-5.2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
