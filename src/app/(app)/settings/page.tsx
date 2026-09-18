import { redirect } from "next/navigation";

// This route used to bundle Organization Profile, API Keys and Webhooks into one screen.
// They're now three separate pages — this stub just protects old bookmarks/links.
export default function SettingsIndexPage() {
  redirect("/settings/profile");
}
