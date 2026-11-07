"use client";
import { useEffect, useState, useTransition } from "react";
import { fetchSlots } from "@/app/actions/patient";
import type { Slot } from "@/lib/slots";

function nextDays(n: number) {
  const out: { ymd: string; label: string; weekday: string }[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.now() + i * 86400000);
    out.push({
      ymd: new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(d),
      label: new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", day: "numeric", month: "short" }).format(d),
      weekday: new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", weekday: "short" }).format(d),
    });
  }
  return out;
}

/** Lets a patient choose a day and a free time slot. Writes the choice to a hidden `starts_at` input. */
export function SlotPicker({ therapistId, ignoreAppointmentId }: { therapistId: string; ignoreAppointmentId?: string }) {
  const days = nextDays(21);
  const [day, setDay] = useState(days[0].ymd);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [picked, setPicked] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => {
    start(async () => setSlots(await fetchSlots(therapistId, day, ignoreAppointmentId)));
  }, [day, therapistId, ignoreAppointmentId]);

  return (
    <div>
      <input type="hidden" name="starts_at" value={picked} required />
      <p className="label">Choose a day</p>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {days.map((d) => (
          <button
            type="button"
            key={d.ymd}
            onClick={() => {
              setPicked("");
              setDay(d.ymd);
            }}
            className={`flex min-w-[4.5rem] shrink-0 flex-col items-center whitespace-nowrap rounded-xl border px-3 py-2 text-sm transition ${
              day === d.ymd ? "border-brand-700 bg-primary text-white" : "border-line bg-surface hover:border-brand-300"
            }`}
          >
            <span className={`text-xs ${day === d.ymd ? "text-glow-100" : "text-muted"}`}>{d.weekday}</span>
            <span className="font-semibold">{d.label}</span>
          </button>
        ))}
      </div>
      <p className="label mt-4">Available times (Lagos time)</p>
      {pending ? (
        <p className="text-sm text-muted">Loading times…</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-muted">No times available on this day. Try another day.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {slots.map((s) => (
            <button
              type="button"
              key={s.startsAt}
              onClick={() => setPicked(s.startsAt)}
              className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                picked === s.startsAt ? "border-sun-400 bg-sun-400 text-white" : "border-line bg-surface hover:border-brand-300"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
