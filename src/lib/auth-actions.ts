"use server";

import { redirect } from "next/navigation";
import { clearSessionCookies } from "@/lib/session";

export async function logoutAction() {
  await clearSessionCookies();
  redirect("/login");
}
