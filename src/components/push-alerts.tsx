"use client";
import { useEffect, useState } from "react";
import { BellRing, BellOff, Smartphone, X } from "lucide-react";

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const DISMISS = "mg-push-prompt-dismissed";

type State = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}
function deviceName() {
  const ua = navigator.userAgent;
  const os = /android/i.test(ua) ? "Android" : isIos() ? "iPhone/iPad" : /mac/i.test(ua) ? "Mac" : /windows/i.test(ua) ? "Windows" : "Computer";
  const br = /edg\//i.test(ua) ? "Edge" : /chrome|crios/i.test(ua) ? "Chrome" : /firefox|fxios/i.test(ua) ? "Firefox" : /safari/i.test(ua) ? "Safari" : "Browser";
  return `${br} on ${os}`;
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration("/")) ?? navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

function usePush() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      let next: State;
      if (!supported) next = isIos() && !isStandalone() ? "ios-install" : "unsupported";
      else if (Notification.permission === "denied") next = "denied";
      else {
        const reg = await registration();
        const sub = await reg.pushManager.getSubscription();
        next = sub && Notification.permission === "granted" ? "on" : "off";
      }
      if (alive) setState(next);
    })().catch(() => alive && setState("unsupported"));
    return () => { alive = false; };
  }, []);

  async function turnOn() {
    setBusy(true); setNote(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState(permission === "denied" ? "denied" : "off"); return; }
      const reg = await registration();
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(KEY) }));
      const json = sub.toJSON();
      const res = await fetch("/api/push", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, device: deviceName() }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "failed");
      setState("on");
      await fetch("/api/push", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ test: true }) });
      setNote("Done. We've sent a test alert to this device.");
    } catch {
      setNote("Couldn't turn on alerts. Please try again.");
    } finally { setBusy(false); }
  }

  async function turnOff() {
    setBusy(true); setNote(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch(`/api/push?endpoint=${encodeURIComponent(sub.endpoint)}`, { method: "DELETE" });
        await sub.unsubscribe();
      }
      setState("off");
    } finally { setBusy(false); }
  }

  async function test() {
    setBusy(true); setNote(null);
    try {
      const res = await fetch("/api/push", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ test: true }) });
      const { sent } = await res.json().catch(() => ({ sent: 0 }));
      setNote(sent ? "Test alert sent. It should arrive in a few seconds." : "We couldn't reach this device. Turn alerts off and on again.");
    } finally { setBusy(false); }
  }

  return { state, busy, note, turnOn, turnOff, test };
}

/** Settings card: turn phone/computer alerts on or off for this device. */
export function PushSettings() {
  const { state, busy, note, turnOn, turnOff, test } = usePush();
  if (!KEY) return null;
  return (
    <section className="card p-6 sm:p-8">
      <h2 className="font-display flex items-center gap-2 text-lg font-bold"><BellRing className="size-5 text-brand-600" /> Alerts on this device</h2>
      <p className="mt-1 text-sm text-muted">Get an alert on this phone or computer for new messages, session changes, reminders and incoming calls, even when MindGuide AI is closed. Alerts never show names or message text, so your privacy is protected on a lock screen.</p>
      <div className="mt-4">
        {state === "loading" && <p className="text-sm text-muted">Checking this device…</p>}
        {state === "on" && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="badge bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200">Alerts are on</span>
            <button type="button" onClick={test} disabled={busy} className="btn-ghost btn-sm">Send a test alert</button>
            <button type="button" onClick={turnOff} disabled={busy} className="btn-ghost btn-sm"><BellOff className="size-4" /> Turn off</button>
          </div>
        )}
        {state === "off" && <button type="button" onClick={turnOn} disabled={busy} className="btn-primary"><BellRing className="size-4" /> Turn on alerts</button>}
        {state === "denied" && <p className="text-sm text-amber-800">Alerts are blocked for this site in your browser. Open your browser&apos;s site settings, allow notifications for MindGuide AI, then reload this page.</p>}
        {state === "ios-install" && <IosSteps />}
        {state === "unsupported" && <p className="text-sm text-muted">This browser can&apos;t show alerts. Try Chrome on Android or a computer, or add MindGuide AI to your home screen on iPhone. You&apos;ll still get email reminders.</p>}
        {note && <p className="mt-3 text-sm text-muted" role="status">{note}</p>}
      </div>
    </section>
  );
}

function IosSteps() {
  return (
    <div className="flex gap-3 rounded-xl bg-mist p-3 text-sm">
      <Smartphone className="mt-0.5 size-5 shrink-0 text-brand-600" />
      <p>On iPhone, alerts work once MindGuide AI is on your home screen: in Safari, tap Share, then Add to Home Screen. Open MindGuide AI from your home screen and turn alerts on here.</p>
    </div>
  );
}

/** A small, dismissible nudge on the home page while alerts are off on this device. */
export function PushPrompt() {
  const { state, busy, note, turnOn } = usePush();
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    let dismissed = false;
    try { dismissed = localStorage.getItem(DISMISS) === "1"; } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHidden(dismissed);
  }, []);
  if (!KEY || hidden || !(state === "off" || state === "ios-install" || (state === "on" && note))) return null;
  function dismiss() {
    try { localStorage.setItem(DISMISS, "1"); } catch {}
    setHidden(true);
  }
  return (
    <div className="card relative flex flex-col gap-3 sm:flex-row sm:items-center">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><BellRing className="size-5" /></span>
      <div className="min-w-0 flex-1 pr-6">
        <p className="font-semibold">Never miss a message or session</p>
        {state === "ios-install" ? <IosSteps /> : <p className="text-sm text-muted">{note ?? "Turn on alerts for this device. They're discreet: no names or message text."}</p>}
      </div>
      {state === "off" && <button type="button" onClick={turnOn} disabled={busy} className="btn-primary btn-sm shrink-0">Turn on alerts</button>}
      <button type="button" onClick={dismiss} className="absolute right-3 top-3 rounded-lg p-1 text-muted hover:bg-ink/5" aria-label="Hide"><X className="size-4" /></button>
    </div>
  );
}
