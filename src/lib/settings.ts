import "server-only";
import { createAdminClient } from "@/lib/supabase/server";

export type Helpline = { name: string; phone: string };
export type Settings = {
  telegram_link: string;
  cancellation_cutoff_hours: number;
  helplines: Helpline[];
  /** Fixed pay per completed session for every therapist (₦). 0 means each therapist's own fee is used. */
  therapist_payout: number;
  /** Price in naira of a one-off first session for people who haven't had a plan yet. 0 switches it off. */
  first_session_price: number;
};

const DEFAULTS: Settings = {
  telegram_link: "https://t.me/+tdTz3hcagzkyNjQ0",
  cancellation_cutoff_hours: 24,
  therapist_payout: 0,
  helplines: [
    { name: "Emergency services (police, fire, ambulance)", phone: "112" },
    { name: "Lagos State emergency line", phone: "767" },
    { name: "SURPIN suicide prevention line (24 hours, free)", phone: "0800 078 7746" },
    { name: "Mentally Aware Nigeria Initiative (MANI)", phone: "0809 111 6264" },
    { name: "She Writes Woman (24 hours, free)", phone: "0800 800 2000" },
    { name: "Cece Yara child helpline (children and teens, free)", phone: "0800 800 8001" },
  ],
  first_session_price: 5000,
};

export async function getSettings(): Promise<Settings> {
  const admin = createAdminClient();
  const { data } = await admin.from("settings").select("key, value");
  const out = { ...DEFAULTS } as Record<string, unknown>;
  for (const row of data ?? []) out[row.key] = row.value;
  // Ignore the placeholder link from the original setup script.
  if (typeof out.telegram_link !== "string" || /your_channel|^https:\/\/t\.me\/?$/.test(out.telegram_link)) out.telegram_link = DEFAULTS.telegram_link;
  out.therapist_payout = Math.max(0, Math.round(Number(out.therapist_payout) || 0));
  return out as Settings;
}
