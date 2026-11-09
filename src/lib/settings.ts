import "server-only";
import { createAdminClient } from "@/lib/supabase/server";

export type Helpline = { name: string; phone: string };
export type Settings = {
  telegram_link: string;
  cancellation_cutoff_hours: number;
  helplines: Helpline[];
  /** Price in naira of one pay-as-you-go session. */
  single_session_price: number;
};

const DEFAULTS: Settings = {
  telegram_link: "https://t.me/+tdTz3hcagzkyNjQ0",
  cancellation_cutoff_hours: 24,
  helplines: [
    { name: "Emergency services (police, fire, ambulance)", phone: "112" },
    { name: "Lagos State emergency line", phone: "767" },
    { name: "SURPIN suicide prevention line (24 hours, free)", phone: "0800 078 7746" },
    { name: "Mentally Aware Nigeria Initiative (MANI)", phone: "0809 111 6264" },
    { name: "She Writes Woman (24 hours, free)", phone: "0800 800 2000" },
    { name: "Cece Yara child helpline (children and teens, free)", phone: "0800 800 8001" },
  ],
  single_session_price: 7500,
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
