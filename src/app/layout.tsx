import type { Metadata, Viewport } from "next";
import "@fontsource-variable/figtree";
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";
import { APP_NAME } from "@/lib/constants";
import { THEME_SCRIPT } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: { default: `${APP_NAME} – Talk to a licensed therapist online`, template: `%s · ${APP_NAME}` },
  description: "Private video and voice sessions with verified therapists, from anywhere in Nigeria.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b33a6" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0c1d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
