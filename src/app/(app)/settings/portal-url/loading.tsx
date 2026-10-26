import { LoadingSpinner } from "@/components/LoadingSpinner";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";

export default async function Loading() {
  const lang = await getLang();
  return <LoadingSpinner className="min-h-[60vh]" label={t(lang, "commonLoading")} />;
}
