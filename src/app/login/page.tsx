import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./LoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Sign in — Protegey Partner",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-svh bg-background">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-8 p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col items-center gap-4">
              <Logo />
              <div className="space-y-1 text-center">
                <h1 className="text-xl font-semibold text-foreground">Partner sign in</h1>
                <p className="text-sm text-muted-foreground">Continental Fraud Intelligence Engine</p>
              </div>
            </div>

            <div className="rounded-md border border-border bg-card p-6 shadow-sm">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>

      <div className="relative hidden lg:block lg:w-1/2">
        <Image src="/images/login-hero.jpg" alt="" fill priority sizes="50vw" className="object-cover" />
      </div>
    </div>
  );
}
