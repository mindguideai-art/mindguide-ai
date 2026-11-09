"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Gauge, Mic, Phone, RefreshCw, Video, Wifi, WifiOff } from "lucide-react";

type Net = { latency: number; down: number; up: number };
type Verdict = "great" | "ok" | "weak" | "offline";

function verdictFor(n: Net | null): Verdict {
  if (!n) return "offline";
  if (n.down >= 1.5 && n.up >= 0.8 && n.latency < 300) return "great";
  if (n.down >= 0.5 && n.up >= 0.25 && n.latency < 600) return "ok";
  return "weak";
}
const V: Record<Verdict, { title: string; text: string; tone: string }> = {
  great: { title: "Your connection is good for video", text: "Video sessions should look and sound clear.", tone: "bg-brand-50 text-brand-800 border-brand-200" },
  ok: { title: "Video should work in low-data mode", text: "Turn on low-data mode below. If the picture freezes during a session, switch to a voice session.", tone: "bg-amber-50 text-amber-800 border-amber-200" },
  weak: { title: "Your connection is slow: choose a voice session", text: "Voice uses much less data and works on slower networks. Try moving closer to a window or your Wi-Fi router.", tone: "bg-red-50 text-red-800 border-red-200" },
  offline: { title: "We couldn't reach the internet", text: "Check that mobile data or Wi-Fi is on, then try again.", tone: "bg-red-50 text-red-800 border-red-200" },
};

async function measure(): Promise<Net> {
  const pings: number[] = [];
  for (let i = 0; i < 5; i++) {
    const t = performance.now();
    await fetch(`/speedtest.bin?p=${Date.now()}${i}`, { method: "HEAD", cache: "no-store" });
    pings.push(performance.now() - t);
  }
  pings.sort((a, b) => a - b);
  const latency = Math.round(pings[2]);
  let t = performance.now();
  const res = await fetch(`/speedtest.bin?d=${Date.now()}`, { cache: "no-store" });
  const bytes = (await res.arrayBuffer()).byteLength;
  const down = (bytes * 8) / ((performance.now() - t) / 1000) / 1e6;
  const payload = new Uint8Array(250_000);
  crypto.getRandomValues(payload.subarray(0, 65536));
  t = performance.now();
  await fetch("/api/speedtest", { method: "POST", body: payload, cache: "no-store" });
  const up = (payload.byteLength * 8) / ((performance.now() - t) / 1000) / 1e6;
  return { latency, down: Math.round(down * 10) / 10, up: Math.round(up * 10) / 10 };
}

export function ConnectionTest() {
  const [net, setNet] = useState<Net | null>(null);
  const [netState, setNetState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [cam, setCam] = useState<"idle" | "on" | "blocked" | "none">("idle");
  const [level, setLevel] = useState(0);
  const [lowData, setLowData] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setLowData(localStorage.getItem("mg-low-data") === "on"); } catch {}
    return () => { cancelAnimationFrame(raf.current); streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  async function runNet() {
    setNetState("running");
    try {
      const n = await measure();
      setNet(n); setNetState("done");
      const v = verdictFor(n);
      if (v !== "great") toggleLowData(true);
    } catch { setNet(null); setNetState("error"); }
  }

  async function runCam() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: { width: { ideal: 640 }, height: { ideal: 480 } } }).catch(async () => {
        const a = await navigator.mediaDevices.getUserMedia({ audio: true });
        setCam("none");
        return a;
      });
      streamRef.current = s;
      if (s.getVideoTracks().length) { setCam("on"); if (videoRef.current) videoRef.current.srcObject = s; }
      const ctx = new AudioContext();
      const an = ctx.createAnalyser(); an.fftSize = 512;
      ctx.createMediaStreamSource(s).connect(an);
      const data = new Uint8Array(an.frequencyBinCount);
      const tick = () => { an.getByteTimeDomainData(data); let m = 0; for (const x of data) m = Math.max(m, Math.abs(x - 128)); setLevel(Math.min(1, m / 60)); raf.current = requestAnimationFrame(tick); };
      tick();
    } catch { setCam("blocked"); }
  }

  function toggleLowData(on: boolean) {
    setLowData(on);
    try { localStorage.setItem("mg-low-data", on ? "on" : "off"); } catch {}
  }

  const v = netState === "done" ? verdictFor(net) : netState === "error" ? "offline" : null;

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Wifi className="size-5" /></span>
            <div>
              <h2 className="font-display text-lg font-semibold">1. Internet speed</h2>
              <p className="text-sm text-muted">Takes about 10 seconds and uses under 1 MB of data.</p>
            </div>
          </div>
          <button type="button" onClick={runNet} disabled={netState === "running"} className="btn-primary">
            {netState === "running" ? <><RefreshCw className="size-4 animate-spin" /> Testing…</> : netState === "idle" ? <><Gauge className="size-4" /> Start test</> : <><RefreshCw className="size-4" /> Test again</>}
          </button>
        </div>
        {net && (
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            {[["Download", `${net.down} Mbps`], ["Upload", `${net.up} Mbps`], ["Response time", `${net.latency} ms`]].map(([k, val]) => (
              <div key={k} className="rounded-2xl bg-mist p-3"><p className="text-xs text-muted">{k}</p><p className="mt-1 font-display text-xl font-bold tabular-nums">{val}</p></div>
            ))}
          </div>
        )}
        {v && (
          <div className={`mt-4 flex gap-3 rounded-2xl border p-4 ${V[v].tone}`}>
            {v === "great" ? <Video className="mt-0.5 size-5 shrink-0" /> : v === "offline" ? <WifiOff className="mt-0.5 size-5 shrink-0" /> : <Phone className="mt-0.5 size-5 shrink-0" />}
            <div><p className="font-semibold">{V[v].title}</p><p className="mt-0.5 text-sm">{V[v].text}</p></div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Camera className="size-5" /></span>
            <div>
              <h2 className="font-display text-lg font-semibold">2. Camera and microphone</h2>
              <p className="text-sm text-muted">Your browser will ask for permission. Nothing is recorded or sent.</p>
            </div>
          </div>
          {cam === "idle" && <button type="button" onClick={runCam} className="btn-secondary"><Mic className="size-4" /> Check camera and mic</button>}
        </div>
        {cam === "blocked" && <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-800">Your browser blocked the camera and microphone. Tap the lock or camera icon in the address bar, allow access, then reload this page.</p>}
        {(cam === "on" || cam === "none") && (
          <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
            <div className="aspect-video overflow-hidden rounded-2xl bg-[#0d0c1d]">
              {cam === "on" ? <video ref={videoRef} autoPlay playsInline muted className="size-full -scale-x-100 object-cover" /> : <p className="grid size-full place-items-center p-4 text-center text-sm text-white/70">No camera found. You can still join voice sessions.</p>}
            </div>
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm font-semibold"><Mic className="size-4" /> Say something: the bar should move</p>
              <div className="h-3 overflow-hidden rounded-full bg-mist"><div className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-brand-500),var(--color-sun-400))] transition-[width] duration-75" style={{ width: `${Math.round(level * 100)}%` }} /></div>
              {level > 0.08 && <p className="flex items-center gap-1.5 text-sm font-medium text-brand-700"><CheckCircle2 className="size-4" /> We can hear you</p>}
            </div>
          </div>
        )}
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="font-display text-lg font-semibold">Low-data mode</h2>
          <p className="text-sm text-muted">Sends a smaller, smoother video picture that uses about a quarter of the data. Saved on this device for all your sessions.</p>
        </div>
        <button type="button" role="switch" aria-checked={lowData} onClick={() => toggleLowData(!lowData)} className={`relative h-8 w-14 shrink-0 rounded-full transition ${lowData ? "bg-brand-600" : "bg-line"}`}>
          <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${lowData ? "left-7" : "left-1"}`} />
          <span className="sr-only">Low-data mode</span>
        </button>
      </div>
    </div>
  );
}
