"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Lang } from "./i18n";

// ISO 3166-1 alpha-2 codes — names are resolved via Intl.DisplayNames below, so this list
// never needs to carry (or translate) country names itself.
const COUNTRY_CODES = [
  "AF","AL","DZ","AD","AO","AG","AR","AM","AU","AT","AZ","BS","BH","BD","BB","BY","BE","BZ","BJ","BT",
  "BO","BA","BW","BR","BN","BG","BF","BI","CV","KH","CM","CA","CF","TD","CL","CN","CO","KM","CG","CD",
  "CR","CI","HR","CU","CY","CZ","DK","DJ","DM","DO","EC","EG","SV","GQ","ER","EE","SZ","ET","FJ","FI",
  "FR","GA","GM","GE","DE","GH","GR","GD","GT","GN","GW","GY","HT","HN","HU","IS","IN","ID","IR","IQ",
  "IE","IL","IT","JM","JP","JO","KZ","KE","KI","KP","KR","KW","KG","LA","LV","LB","LS","LR","LY","LI",
  "LT","LU","MG","MW","MY","MV","ML","MT","MH","MR","MU","MX","FM","MD","MC","MN","ME","MA","MZ","MM",
  "NA","NR","NP","NL","NZ","NI","NE","NG","MK","NO","OM","PK","PW","PA","PG","PY","PE","PH","PL","PT",
  "QA","RO","RU","RW","KN","LC","VC","WS","SM","ST","SA","SN","RS","SC","SL","SG","SK","SI","SB","SO",
  "ZA","SS","ES","LK","SD","SR","SE","CH","SY","TW","TJ","TZ","TH","TL","TG","TO","TT","TN","TR","TM",
  "TV","UG","UA","AE","GB","US","UY","UZ","VU","VA","VE","VN","YE","ZM","ZW",
];

function flagEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export function CountrySelect({
  value,
  onChange,
  lang,
  placeholder,
}: {
  value: string | null | undefined;
  onChange: (code: string) => void;
  lang: Lang;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const countries = useMemo(() => {
    const displayNames = new Intl.DisplayNames([lang], { type: "region" });
    return COUNTRY_CODES.map((code) => ({ code, name: displayNames.of(code) ?? code })).sort((a, b) =>
      a.name.localeCompare(b.name, lang),
    );
  }, [lang]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return countries;
    return countries.filter((c) => c.name.toLowerCase().includes(term));
  }, [countries, search]);

  const selected = value ? countries.find((c) => c.code === value) : undefined;

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-left text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <span>{flagEmoji(selected.code)}</span>
            <span>{selected.name}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {open ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg">
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full border-b border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
          />
          <div className="max-h-56 overflow-y-auto">
            {filtered.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  onChange(country.code);
                  setOpen(false);
                  setSearch("");
                }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted ${
                  country.code === value ? "bg-primary/10 text-primary" : "text-foreground"
                }`}
              >
                <span>{flagEmoji(country.code)}</span>
                <span>{country.name}</span>
              </button>
            ))}
            {filtered.length === 0 ? <p className="px-3 py-2 text-sm text-muted-foreground">—</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
