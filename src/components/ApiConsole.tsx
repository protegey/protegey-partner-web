"use client";

import { useEffect, useState } from "react";
import { Loader2, Play, KeyRound } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";

const API_KEY_STORAGE_KEY = "protegey_console_api_key";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "https://api.protegey.com";

export interface ApiConsoleField {
  name: string;
  label: string;
  type: "text" | "number" | "boolean" | "select";
  required?: boolean;
  defaultValue?: string | number | boolean;
  options?: string[];
  placeholder?: string;
}

interface ConsoleResponse {
  status: number | null;
  ok: boolean;
  body: string;
}

/** An embedded, Postman-style request console — lets a partner test a real endpoint against the
 * real backend without leaving the docs. The API key never leaves the browser (stored in
 * localStorage for convenience across reloads, sent only as a request header, never to Protegey's
 * own servers except as that same header the partner's own integration would send anyway). */
export function ApiConsole({ method, path, fields }: { method: "GET" | "POST" | "PATCH"; path: string; fields: ApiConsoleField[] }) {
  const { t } = useLang();
  const [apiKey, setApiKey] = useState("");
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.name, field.defaultValue !== undefined ? String(field.defaultValue) : ""])),
  );
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<ConsoleResponse | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(API_KEY_STORAGE_KEY);
      if (stored) setApiKey(stored);
    } catch {
      // Private browsing / storage blocked — the key just won't persist across reloads.
    }
  }, []);

  function updateApiKey(next: string) {
    setApiKey(next);
    try {
      window.localStorage.setItem(API_KEY_STORAGE_KEY, next);
    } catch {
      // Same as above — not persisting is fine, sending still works this session.
    }
  }

  function buildBody(): Record<string, unknown> {
    const body: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = values[field.name];
      if (raw === "" || raw === undefined) continue;
      if (field.type === "number") body[field.name] = Number(raw);
      else if (field.type === "boolean") body[field.name] = raw === "true";
      else body[field.name] = raw;
    }
    return body;
  }

  async function handleSend() {
    setSending(true);
    setResponse(null);
    try {
      const res = await fetch(`${BACKEND_URL}${path}`, {
        method,
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: method === "GET" ? undefined : JSON.stringify(buildBody()),
      });
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        // Not JSON — show as-is.
      }
      setResponse({ status: res.status, ok: res.ok, body: pretty });
    } catch (error) {
      setResponse({ status: null, ok: false, body: `${t("apiConsoleNetworkError")}\n${(error as Error).message}` });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Play className="size-3.5" />
        {t("apiConsoleTitle")}
      </div>

      <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
        <span className="flex items-center gap-1.5">
          <KeyRound className="size-3.5 text-muted-foreground" />
          {t("apiConsoleApiKeyLabel")}
        </span>
        <input
          type="password"
          value={apiKey}
          onChange={(event) => updateApiKey(event.target.value)}
          placeholder={t("apiConsoleApiKeyPlaceholder")}
          className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
      </label>

      <div className="grid gap-2 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.name} className="flex flex-col gap-1 text-xs font-medium text-foreground">
            {field.label}
            {field.required ? <span className="text-destructive"> *</span> : null}
            {field.type === "select" ? (
              <select
                value={values[field.name]}
                onChange={(event) => setValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
                className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                {(field.options ?? []).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : field.type === "boolean" ? (
              <select
                value={values[field.name]}
                onChange={(event) => setValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
                className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="false">false</option>
                <option value="true">true</option>
              </select>
            ) : (
              <input
                type={field.type === "number" ? "number" : "text"}
                value={values[field.name]}
                onChange={(event) => setValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
                placeholder={field.placeholder}
                className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSend}
        disabled={sending || !apiKey}
        className="flex w-fit items-center gap-2 rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
        {t("apiConsoleSendButton")} {method} {path}
      </button>
      {!apiKey ? <p className="text-xs text-muted-foreground">{t("apiConsoleNoKeyHint")}</p> : null}

      {response ? (
        <div className="flex flex-col gap-1.5">
          <p className={`text-xs font-semibold ${response.ok ? "text-emerald-600" : "text-destructive"}`}>
            {response.status !== null ? `HTTP ${response.status}` : t("apiConsoleNetworkError")}
          </p>
          <pre className="max-h-64 overflow-auto rounded-md border border-border bg-background p-3 text-xs text-foreground">{response.body}</pre>
        </div>
      ) : null}
    </div>
  );
}
