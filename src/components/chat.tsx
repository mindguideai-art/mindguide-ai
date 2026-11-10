"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, markRead } from "@/app/actions/messages";
import { startCall } from "@/app/actions/calls";
import { Lock, Phone, Send, ShieldCheck, Video } from "lucide-react";
import { Avatar } from "./avatar";

type Msg = { id: string; sender_id: string; body: string; created_at: string };

export function Chat({
  patientId,
  therapistId,
  meId,
  otherName,
  otherPhoto = null,
  otherSubtitle,
  initial,
  canMessage = true,
  canCall = true,
  lockedNote,
  callLocked = false,
}: {
  patientId: string;
  therapistId: string;
  meId: string;
  otherName: string;
  otherPhoto?: string | null;
  otherSubtitle?: string;
  initial: Msg[];
  /** False when the patient's plan doesn't include messaging. */
  canMessage?: boolean;
  /** False when the patient's plan doesn't include calls outside sessions. */
  canCall?: boolean;
  lockedNote?: string;
  callLocked?: boolean;
}) {
  const otherId = meId === patientId ? therapistId : patientId;
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markRead(patientId, therapistId);
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${patientId}-${therapistId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `patient_id=eq.${patientId}` },
        (payload) => {
          const m = payload.new as Msg & { therapist_id: string };
          if (m.therapist_id !== therapistId) return;
          setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
          if (m.sender_id !== meId) markRead(patientId, therapistId);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId, therapistId, meId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError("");
    const res = await sendMessage(patientId, therapistId, text);
    setSending(false);
    if (res.error) return setError(res.error);
    if (res.message) setMessages((prev) => (prev.some((p) => p.id === res.message!.id) ? prev : [...prev, res.message!]));
    setText("");
  }

  const time = (iso: string) =>
    new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

  return (
    <div className="card flex h-[calc(100dvh-11rem)] min-h-[420px] flex-col overflow-hidden p-0">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
        <Avatar name={otherName} url={otherPhoto} size={42} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{otherName}</p>
          <p className="flex items-center gap-1 truncate text-xs text-muted">
            <ShieldCheck className="size-3 text-brand-600" /> {otherSubtitle ?? "Private conversation"}
          </p>
        </div>
        {canCall && (<><form action={startCall}>
          <input type="hidden" name="other_id" value={otherId} />
          <input type="hidden" name="type" value="audio" />
          <button className="rounded-xl p-2.5 text-brand-700 transition hover:bg-brand-50" aria-label={`Voice call ${otherName}`} title="Voice call">
            <Phone className="size-5" />
          </button>
        </form>
        <form action={startCall}>
          <input type="hidden" name="other_id" value={otherId} />
          <input type="hidden" name="type" value="video" />
          <button className="rounded-xl p-2.5 text-brand-700 transition hover:bg-brand-50" aria-label={`Video call ${otherName}`} title="Video call">
            <Video className="size-5" />
          </button>
        </form></>)}
      </div>
      {callLocked && !canCall && (
        <div className="flex items-center gap-2 border-b border-line bg-sun-50 px-5 py-2 text-xs text-sun-700">
          <Lock className="size-3.5 shrink-0" />
          Calls outside booked sessions are included in the Premium and Family plans. Booked sessions can always be joined.
        </div>
      )}
      <div className="flex-1 space-y-2 overflow-y-auto bg-[linear-gradient(180deg,var(--color-mist),var(--color-surface))] px-4 py-5 sm:px-6">
        {messages.length === 0 && (
          <div className="mx-auto mt-10 max-w-xs text-center text-sm text-muted">
            <p className="font-semibold text-ink">Start the conversation</p>
            <p className="mt-1">Messages are private between you and {otherName.split(" ")[0]}.</p>
          </div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${mine ? "rounded-br-md bg-primary text-white" : "rounded-bl-md bg-surface ring-1 ring-line"}`}>
                <p data-no-translate className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                <p className={`mt-1 text-right text-[10px] ${mine ? "text-glow-100" : "text-muted"}`}>{time(m.created_at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      {canMessage ? (
        <form onSubmit={onSend} className="flex items-end gap-2 border-t border-line bg-surface p-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) onSend(e);
            }}
            rows={1}
            className="input max-h-32 resize-none"
            placeholder="Write a message…"
            aria-label="Message"
          />
          <button className="btn-primary size-11 shrink-0 !p-0" disabled={sending || !text.trim()} aria-label="Send">
            <Send className="size-4" />
          </button>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-5 py-4">
          <p className="flex items-center gap-2 text-sm text-muted"><Lock className="size-4 shrink-0 text-sun-500" /> {lockedNote ?? "Messaging isn't included in this plan."}</p>
          {meId === patientId && <a href="/patient/subscription" className="btn-accent btn-sm">Upgrade plan</a>}
        </div>
      )}
      {error && <p className="px-5 pb-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
