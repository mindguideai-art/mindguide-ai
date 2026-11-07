"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Phone, PhoneOff, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/avatar";
import { useTone } from "./use-tone";

type Incoming = { id: string; caller_name: string; type: "video" | "audio"; appointment_id: string | null };

/** Rings when someone calls the signed-in person, anywhere in the app. */
export function IncomingCall({ userId }: { userId: string }) {
  const [call, setCall] = useState<Incoming | null>(null);
  const [busy, setBusy] = useState(false);
  const dismissed = useRef(new Set<string>());
  const router = useRouter();
  const path = usePathname();
  const tone = useTone();

  useEffect(() => {
    if (path.startsWith("/call/")) return;
    let alive = true;
    async function check() {
      try {
        const res = await fetch("/api/calls/incoming", { cache: "no-store" });
        if (!res.ok || !alive) return;
        const json = (await res.json()) as { calls: Incoming[] };
        const next = json.calls.find((c) => !dismissed.current.has(c.id)) ?? null;
        setCall((cur) => (cur?.id === next?.id ? cur : next));
      } catch {}
    }
    check();
    const t = setInterval(check, 3000);
    const supabase = createClient();
    const channel = supabase
      .channel(`incoming-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "calls", filter: `callee_id=eq.${userId}` }, () => check())
      .subscribe();
    return () => {
      alive = false;
      clearInterval(t);
      supabase.removeChannel(channel);
    };
  }, [userId, path]);

  useEffect(() => {
    if (call) tone.ringtone();
    else tone.stop();
    return () => tone.stop();
  }, [call, tone]);

  if (!call) return null;

  async function respond(accept: boolean) {
    if (!call) return;
    setBusy(true);
    dismissed.current.add(call.id);
    await fetch(`/api/calls/${call.id}`, { method: "POST", body: JSON.stringify({ action: accept ? "accept" : "decline" }) }).catch(() => {});
    tone.stop();
    const id = call.id;
    setCall(null);
    setBusy(false);
    if (accept) router.push(`/call/${id}`);
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex justify-center p-3 sm:top-4" role="alertdialog" aria-label={`Incoming call from ${call.caller_name}`}>
      <div className="flex w-full max-w-md items-center gap-4 rounded-3xl bg-brand-950 p-4 pr-5 text-white shadow-2xl ring-1 ring-white/10 animate-fade-up">
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-brand-400/50 animate-ring" />
          <div className="relative"><Avatar name={call.caller_name} size={52} /></div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-bold">{call.caller_name}</p>
          <p className="flex items-center gap-1.5 text-sm text-glow-200">
            {call.type === "video" ? <Video className="size-4" /> : <Phone className="size-4" />}
            {call.appointment_id ? "Your session is starting" : `Incoming ${call.type === "video" ? "video" : "voice"} call`}
          </p>
        </div>
        <button disabled={busy} onClick={() => respond(false)} className="flex size-12 items-center justify-center rounded-full bg-red-500 transition hover:bg-red-600 active:scale-95" aria-label="Decline">
          <PhoneOff className="size-5" />
        </button>
        <button disabled={busy} onClick={() => respond(true)} className="flex size-12 items-center justify-center rounded-full bg-emerald-500 transition hover:bg-emerald-600 active:scale-95" aria-label="Accept">
          {call.type === "video" ? <Video className="size-5" /> : <Phone className="size-5" />}
        </button>
      </div>
    </div>
  );
}
