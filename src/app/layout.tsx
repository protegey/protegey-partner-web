import type { Metadata } from "next";
import Script from "next/script";
import { Inter, IBM_Plex_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppToaster } from "@/components/AppToaster";
import { LangProvider } from "@/lib/i18n/LangProvider";
import { getLang } from "@/lib/i18n/lang";
import { getSetupStatus } from "@/app/setup/actions";
import "./globals.css";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:3000";

const DEFAULT_ICONS: Metadata["icons"] = {
  icon: [
    { url: "/favicon.svg", type: "image/svg+xml" },
    { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    { url: "/favicon.ico", sizes: "any" },
  ],
  apple: "/apple-touch-icon.png",
};

/** On an on-premise deployment with a logo uploaded (setup wizard or Settings → Organization
 * Profile), the browser favicon becomes that partner's own logo instead of Protegey's generic
 * icon — same branding swap already applied to KYB emails/forms (see Partner.logoFileName's own
 * doc comment). A plain `icons:` field on the static `metadata` export can't do this (it has no
 * access to request-time state), hence generateMetadata here instead. A HEAD check against the
 * backend's own public, on-premise-only branding endpoint (OnPremiseBrandingController) decides
 * which to use — it 404s outside on-premise mode or before a logo exists, so this safely no-ops
 * back to the default everywhere else. */
async function resolveIcons(): Promise<Metadata["icons"]> {
  const setupStatus = await getSetupStatus();
  if (!setupStatus.enabled) return DEFAULT_ICONS;

  let lastModified: string | null;
  try {
    const response = await fetch(`${BACKEND_API_URL}/on-premise/branding/logo`, { method: "HEAD", cache: "no-store" });
    if (!response.ok) return DEFAULT_ICONS;
    lastModified = response.headers.get("last-modified");
  } catch {
    return DEFAULT_ICONS;
  }

  // The link the BROWSER follows, unlike the BACKEND_API_URL check above which only needs to be
  // reachable server-to-server — see protegey-partner-web's Dockerfile comment on why this one
  // env var is the exception that has to be a real, publicly-reachable URL. `?v=` is load-bearing,
  // not decorative: browsers cache a favicon far more aggressively than any Cache-Control header
  // controls, often until the browser itself restarts, regardless of how fresh the image at this
  // URL actually is. Tying the query string to Partner.updatedAt (bumped on every logo change)
  // means a new logo gets a genuinely new URL, which is what actually forces a refetch.
  const cacheBuster = lastModified ? `?v=${encodeURIComponent(lastModified)}` : "";
  return { icon: [{ url: `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/on-premise/branding/logo${cacheBuster}` }] };
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["500", "600"],
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Protegey Partner",
    description: "Protegey — Continental Fraud Intelligence Engine — Partner Portal",
    manifest: "/site.webmanifest",
    icons: await resolveIcons(),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html
      lang={lang}
      className={`${inter.variable} ${plexSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <LangProvider initialLang={lang}>{children}</LangProvider>
          <AppToaster />
        </ThemeProvider>
        <Script id="tawk-to-widget" strategy="afterInteractive">
          {`
            var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
            (function(){
            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
            s1.async=true;
            s1.src='https://embed.tawk.to/6aaeee42208490345262777f/1k2tl5d7n';
            s1.charset='UTF-8';
            s1.setAttribute('crossorigin','*');
            s0.parentNode.insertBefore(s1,s0);
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
