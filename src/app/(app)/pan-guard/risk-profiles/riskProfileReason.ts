import type { StringKey } from "@/lib/i18n/strings";
import type { EntityRiskProfile, RiskProfileCategory } from "./actions";

const CATEGORY_LABEL_KEY: Record<RiskProfileCategory, StringKey> = {
  behavioral: "riskProfileCategoryBehavioral",
  network: "riskProfileCategoryNetwork",
  contextual: "riskProfileCategoryContextual",
  historical: "riskProfileCategoryHistorical",
};

/**
 * One plain-language sentence explaining why a score is what it is — shared by the list and
 * detail pages so the two never drift into saying something different about the same profile.
 * Built from the two fields a non-technical reader actually needs: which dimension dominates,
 * and what the most recent real event was — never the raw weight/decay math.
 */
export function riskProfileReason(profile: Pick<EntityRiskProfile, "topCategory" | "contributions">, t: (key: StringKey) => string): string {
  if (!profile.topCategory || profile.contributions.length === 0) {
    return t("riskProfileReasonNone");
  }
  const mostRecent = profile.contributions[profile.contributions.length - 1];
  return t("riskProfileReasonTemplate")
    .replace("{category}", t(CATEGORY_LABEL_KEY[profile.topCategory]))
    .replace("{count}", String(profile.contributions.length))
    .replace("{reason}", mostRecent.reason);
}
