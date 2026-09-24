"use client";

import { useLang } from "@/lib/i18n/LangProvider";

/**
 * Shape reported by the Protegey SDKs (`protegey_js_sdk` / `protegey_flutter_sdk`) as
 * `deviceAttributes`. Every field is optional — presence depends on platform and SDK version —
 * and unknown extra keys are preserved so future SDK fields still render in the raw dump below.
 */
export type DeviceAttributes = {
  platform?: string;
  osVersion?: string;
  deviceModel?: string;
  manufacturer?: string;
  userAgent?: string;
  screenWidth?: number;
  screenHeight?: number;
  devicePixelRatio?: number;
  timezone?: string;
  language?: string;
  appVersion?: string;
  isRooted?: boolean;
  isEmulator?: boolean;
  connectionType?: "wifi" | "cellular" | "ethernet" | "vpn" | "none" | "unknown";
  isVpnActive?: boolean;
  batteryLevel?: number;
  isCharging?: boolean;
  cpuCores?: number;
  totalMemoryMb?: number;
} & Record<string, unknown>;

const KNOWN_KEYS = [
  "platform",
  "osVersion",
  "deviceModel",
  "manufacturer",
  "userAgent",
  "screenWidth",
  "screenHeight",
  "devicePixelRatio",
  "timezone",
  "language",
  "appVersion",
  "isRooted",
  "isEmulator",
  "connectionType",
  "isVpnActive",
  "batteryLevel",
  "isCharging",
  "cpuCores",
  "totalMemoryMb",
];

function str(attrs: DeviceAttributes | null | undefined, key: string): string | null {
  const v = attrs?.[key];
  return typeof v === "string" && v.length > 0 ? v : null;
}
function num(attrs: DeviceAttributes | null | undefined, key: string): number | null {
  const v = attrs?.[key];
  return typeof v === "number" ? v : null;
}
function bool(attrs: DeviceAttributes | null | undefined, key: string): boolean {
  return attrs?.[key] === true;
}

/** ISO-2 country code (what `ipCountry` always is) rendered as a regional-indicator flag emoji. */
function flagEmoji(code: string): string {
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return "";
  return String.fromCodePoint(...[...upper].map((c) => 127397 + c.charCodeAt(0)));
}

export function CountryBadge({ ipCountry }: { ipCountry?: string | null }) {
  if (!ipCountry) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
      <span aria-hidden>{flagEmoji(ipCountry)}</span>
      {ipCountry}
    </span>
  );
}

/** e.g. "Android 14 — Samsung Galaxy S23", or null when nothing usable is present. */
export function deviceSummaryText(attrs: DeviceAttributes | null | undefined): string | null {
  const osLine = [str(attrs, "platform"), str(attrs, "osVersion")].filter(Boolean).join(" ");
  const modelLine = [str(attrs, "manufacturer"), str(attrs, "deviceModel")].filter(Boolean).join(" ");
  const parts = [osLine, modelLine].filter(Boolean);
  return parts.length > 0 ? parts.join(" — ") : null;
}

/** Warning/danger-tinted pills for the boolean risk flags, matching the badge pattern used on alerts/sanctions. */
export function DeviceRiskBadges({ attributes }: { attributes?: DeviceAttributes | null }) {
  const { t } = useLang();
  if (!attributes) return null;
  const badges: { key: string; label: string; color: string }[] = [];
  if (bool(attributes, "isRooted")) {
    badges.push({ key: "rooted", label: t("deviceAttrRooted"), color: "bg-destructive/15 text-destructive" });
  }
  if (bool(attributes, "isEmulator")) {
    badges.push({ key: "emulator", label: t("deviceAttrEmulator"), color: "bg-orange-500/15 text-orange-600" });
  }
  if (bool(attributes, "isVpnActive") || attributes.connectionType === "vpn") {
    badges.push({ key: "vpn", label: t("deviceAttrVpnActive"), color: "bg-amber-500/15 text-amber-600" });
  }
  if (bool(attributes, "isCharging")) {
    badges.push({ key: "charging", label: t("deviceAttrCharging"), color: "bg-muted text-muted-foreground" });
  }
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((b) => (
        <span key={b.key} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${b.color}`}>
          {b.label}
        </span>
      ))}
    </div>
  );
}

/** Compact always-visible cell: device summary line + risk badges. Used directly in table rows. */
export function DeviceSummaryCell({ attributes }: { attributes?: DeviceAttributes | null }) {
  const { t } = useLang();
  const summary = deviceSummaryText(attributes);
  return (
    <div className="flex flex-col gap-1">
      {summary ? (
        <p className="text-xs font-medium text-foreground">{summary}</p>
      ) : (
        <p className="text-xs text-muted-foreground">{t("deviceSignalsNoEnrichedData")}</p>
      )}
      <DeviceRiskBadges attributes={attributes} />
    </div>
  );
}

function formatValue(v: unknown, lang: "en" | "fr"): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? (lang === "fr" ? "Oui" : "Yes") : lang === "fr" ? "Non" : "No";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

/**
 * Full detail block for an expanded row/drawer: country + risk badges, secondary
 * network/battery/context info, then a raw key/value dump of every reported attribute
 * (known keys first, then anything the SDK reports that this UI doesn't explicitly know about
 * yet). `ipHash` is shown labeled as a correlation fingerprint — never as an IP address.
 */
export function DeviceAttributesDetails({
  attributes,
  ipCountry,
  ipHash,
  ip,
  phoneNumber,
}: {
  attributes?: DeviceAttributes | null;
  ipCountry?: string | null;
  ipHash?: string | null;
  ip?: string | null;
  phoneNumber?: string | null;
}) {
  const { t, lang } = useLang();

  if (!attributes && !ipCountry && !ipHash && !ip && !phoneNumber) {
    return <p className="text-xs text-muted-foreground">{t("deviceSignalsNoEnrichedData")}</p>;
  }

  const connectionType = str(attributes, "connectionType");
  const batteryLevel = num(attributes, "batteryLevel");
  const timezone = str(attributes, "timezone");
  const language = str(attributes, "language");
  const appVersion = str(attributes, "appVersion");
  const screenWidth = num(attributes, "screenWidth");
  const screenHeight = num(attributes, "screenHeight");

  const rawKeys = attributes
    ? [...KNOWN_KEYS.filter((k) => attributes[k] !== undefined), ...Object.keys(attributes).filter((k) => !KNOWN_KEYS.includes(k))]
    : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {ipCountry ? <CountryBadge ipCountry={ipCountry} /> : null}
        <DeviceRiskBadges attributes={attributes} />
      </div>

      {connectionType || batteryLevel !== null || timezone || language || appVersion || (screenWidth && screenHeight) || phoneNumber ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
          {phoneNumber ? (
            <span className="text-muted-foreground">
              {t("deviceAttrPhoneNumber")}: <span className="font-mono text-foreground">{phoneNumber}</span>
            </span>
          ) : null}
          {connectionType ? (
            <span className="text-muted-foreground">
              {t("deviceAttrConnectionType")}: <span className="text-foreground">{connectionType}</span>
            </span>
          ) : null}
          {batteryLevel !== null ? (
            <span className="text-muted-foreground">
              {t("deviceAttrBatteryLevel")}: <span className="text-foreground">{batteryLevel}%</span>
            </span>
          ) : null}
          {timezone ? (
            <span className="text-muted-foreground">
              {t("deviceAttrTimezone")}: <span className="text-foreground">{timezone}</span>
            </span>
          ) : null}
          {language ? (
            <span className="text-muted-foreground">
              {t("deviceAttrLanguage")}: <span className="text-foreground">{language}</span>
            </span>
          ) : null}
          {appVersion ? (
            <span className="text-muted-foreground">
              {t("deviceAttrAppVersion")}: <span className="text-foreground">{appVersion}</span>
            </span>
          ) : null}
          {screenWidth && screenHeight ? (
            <span className="text-muted-foreground">
              {t("deviceAttrScreen")}: <span className="text-foreground">{screenWidth}×{screenHeight}</span>
            </span>
          ) : null}
        </div>
      ) : null}

      {rawKeys.length > 0 ? (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t("deviceAttrRawTitle")}</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-md border border-border bg-muted/20 p-2.5 text-xs sm:grid-cols-3">
            {rawKeys.map((key) => (
              <div key={key} className="flex flex-col">
                <dt className="text-[10px] uppercase text-muted-foreground">{key}</dt>
                <dd className="truncate text-foreground" title={formatValue(attributes?.[key], lang)}>
                  {formatValue(attributes?.[key], lang)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {ip ? (
        <p className="text-[11px] text-muted-foreground">
          {t("deviceAttrIpLabel")}: <span className="font-mono text-foreground">{ip}</span>
        </p>
      ) : ipHash ? (
        <p className="text-[11px] text-muted-foreground">
          {t("deviceAttrIpHashLabel")}: <span className="font-mono">{ipHash.slice(0, 20)}…</span>
        </p>
      ) : null}
    </div>
  );
}
