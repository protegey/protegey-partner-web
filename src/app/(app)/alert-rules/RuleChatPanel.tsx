"use client";

import { useId, useState } from "react";
import { Loader2, MessageCircle, Send, Sparkles } from "lucide-react";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { generateAlertRule, type AlertRule } from "./actions";
import { ruleExplanation, ruleName } from "./localize";

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; kind: "success"; rule: AlertRule }
  | { id: string; role: "assistant"; kind: "declined"; reason: string };

/**
 * Pan-Studio, rebuilt as a chat: you describe a rule like you're texting a colleague, and each
 * reply is either the new draft rule (shown right there in the conversation) or a plain
 * explanation of why it couldn't be created. Every proposal still lands as a draft in the list
 * on the right — nothing here ever turns a rule on by itself.
 */
export function RuleChatPanel({ onGenerated }: { onGenerated: (rule: AlertRule) => void }) {
  const guard = useSessionGuard();
  const { lang, t } = useLang();
  const inputId = useId();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [tooShort, setTooShort] = useState(false);

  async function send(text: string) {
    const trimmed = text.trim();
    if (trimmed.length < 10) {
      setTooShort(true);
      return;
    }
    setTooShort(false);
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: trimmed }]);
    setDraft("");
    setPending(true);
    try {
      const result = await guard(() => generateAlertRule(trimmed));
      if (result === null) return;
      if (isError(result)) {
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", kind: "declined", reason: result.error }]);
        return;
      }
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", kind: "success", rule: result }]);
      onGenerated(result);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-md border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="size-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">{t("chatPanelTitle")}</p>
      </div>
      <p className="border-b border-border px-4 py-2.5 text-xs text-muted-foreground">{t("chatPanelIntro")}</p>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <MessageCircle className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t("chatEmptyState")}</p>
            <div className="mt-1 rounded-md border border-dashed border-border bg-muted/40 p-3 text-left">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">{t("chatExampleLabel")}</p>
              <div className="mt-1 flex flex-col gap-2">
                {[t("chatExampleText"), t("chatExampleText2"), t("chatExampleText3"), t("chatExampleText4"), t("chatExampleText5"), t("chatExampleText6")].map((example, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <p className="text-sm text-foreground">{example}</p>
                    <button
                      type="button"
                      onClick={() => send(example)}
                      className="shrink-0 rounded-md border border-primary px-2 py-0.5 text-[10px] font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                      {t("chatUseExample")}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => {
              if (message.role === "user") {
                return (
                  <div key={message.id} className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                    {message.text}
                  </div>
                );
              }
              if (message.kind === "declined") {
                return (
                  <div key={message.id} className="mr-auto max-w-[85%] rounded-2xl rounded-tl-sm border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-sm text-destructive">
                    <span className="font-semibold">{t("chatDeclinedPrefix")}</span> {message.reason}
                  </div>
                );
              }
              return (
                <div key={message.id} className="mr-auto max-w-[85%] rounded-2xl rounded-tl-sm border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-sm">
                  <p className="font-semibold text-foreground">
                    {t("chatSuccessPrefix")} {ruleName(message.rule, lang)}
                  </p>
                  <p className="mt-1 text-foreground/90">{ruleExplanation(message.rule, lang)}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">{t("chatSuccessHint")}</p>
                </div>
              );
            })}
            {pending ? (
              <div className="mr-auto flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border bg-muted/40 px-3.5 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                {t("chatSending")}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        {tooShort ? <p className="mb-2 text-xs text-destructive">{t("chatTooShort")}</p> : null}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(draft);
          }}
          className="flex items-end gap-2"
        >
          <label htmlFor={inputId} className="sr-only">
            {t("chatInputPlaceholder")}
          </label>
          <textarea
            id={inputId}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(draft);
              }
            }}
            rows={2}
            placeholder={t("chatInputPlaceholder")}
            className="w-full flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={pending || draft.trim().length === 0}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {t("chatSend")}
          </button>
        </form>
        <p className="mt-2 text-[11px] text-muted-foreground">{t("chatOnlyMonitoring")}</p>
      </div>
    </div>
  );
}
