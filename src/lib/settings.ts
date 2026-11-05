import "server-only";
import { createAdminClient } from "@/lib/supabase/server";

export type Helpline = { name: string; phone: string };
export type Settings = {
  telegram_link: string;
  cancellation_cutoff_hours: number;
  helplines: Helpline[];
};

const DEFAULTS: Settings = {
  telegram_link: "https://t.me/+tdTz3hcagzkyNjQ0",
  cancellation_cutoff_hours: 24,
  helplines: [{ name: "Emergency services (Nigeria)", phone: "112" }],
};

export async function getSettings(): Promise<Settings> {
  const admin = createAdminClient();
  const { data } = await admin.from("settings").select("key, value");
  const out = { ...DEFAULTS } as Record<string, unknown>;
  for (const row of data ?? []) out[row.key] = row.value;
  // Ignore the placeholder link from the original setup script.
  if (typeof out.telegram_link !== "string" || /your_channel|^https:\/\/t\.me\/?$/.test(out.telegram_link)) out.telegram_link = DEFAULTS.telegram_link;
  return out as Settings;
}
