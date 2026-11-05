import type { Metadata, Viewport } from "next";
import "@fontsource-variable/figtree";
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: { default: `${APP_NAME} – Talk to a licensed therapist online`, template: `%s · ${APP_NAME}` },
  description: "Private video and voice sessions with verified therapists, from anywhere in Nigeria.",
};

export const viewport: Viewport = { themeColor: "#3b33a6" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
