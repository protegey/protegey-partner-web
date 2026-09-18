import type { Lang } from "@/lib/i18n/strings";
import type { AlertRule } from "./actions";

/** Older/manually-authored rules may have no French translation yet — fall back to English rather than show blank text. */
export function ruleName(rule: AlertRule, lang: Lang): string {
  return (lang === "fr" && rule.nameFr) || rule.name;
}

export function ruleDescription(rule: AlertRule, lang: Lang): string {
  return (lang === "fr" && rule.descriptionFr) || rule.description;
}

/** The short, plain-language sentence — falls back to the (more technical) description if no explanation was ever written for this rule. */
export function ruleExplanation(rule: AlertRule, lang: Lang): string {
  if (lang === "fr") return rule.explanationFr || rule.explanation || rule.descriptionFr || rule.description;
  return rule.explanation || rule.description;
}
