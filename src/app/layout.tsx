import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LangProvider } from "@/lib/i18n/LangProvider";
import { getLang } from "@/lib/i18n/lang";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Protegey Partner",
  description: "Protegey — Continental Fraud Intelligence Engine — Partner Portal",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

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
        </ThemeProvider>
      </body>
    </html>
  );
}
