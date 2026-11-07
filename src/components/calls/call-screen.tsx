"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, SwitchCamera, Maximize2, Minimize2, ShieldCheck, Wifi, WifiOff, Loader2, MessageCircle, Phone,
} from "lucide-react";
import { Avatar } from "@/components/avatar";
import { useTone } from "./use-tone";

type Phase = "starting" | "ringing" | "waiting" | "connecting" | "connected" | "reconnecting" | "ended" | "declined" | "missed" | "media-error";
type Signal = { id: number; from_session: string; to_session: string | null; kind: string; payload: unknown };

export type CallScreenProps = {
  callId: string;
  type: "video" | "audio";
  isCaller: boolean;
  /** The therapist starts the connection; the patient answers. Keeps both sides from offering at once. */
  initiator: boolean;
  initialStatus: string;
  me: { name: string };
  other: { name: string; photo: string | null; role: string };
  iceServers: RTCIceServer[];
  backHref: string;
  messagesHref: string;
  appointmentId: string | null;
  canMarkComplete: boolean;
};

const RING_TIMEOUT_MS = 45000;

function fmt(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return (h ? `${h}:${String(m).padStart(2, "0")}` : `${m}`) + `:${String(s).padStart(2, "0")}`;
}

export function CallScreen(props: CallScreenProps) {
  const { callId, type, isCaller, initiator, iceServers, other } = props;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("starting");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(type === "video");
  const [elapsed, setElapsed] = useState(0);
  const [remoteVideo, setRemoteVideo] = useState(false);
  const [full, setFull] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [talked, setTalked] = useState<number | null>(null);

  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const session = useRef("");
  const peerSession = useRef<string | null>(null);
  const cursor = useRef(0);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const connectedAt = useRef<number | null>(null);
  const done = useRef(false);
  const phaseRef = useRef<Phase>("starting");
  const tone = useTone();

  const setP = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const send = useCallback(
    async (kind: string, payload: unknown = null, to: string | null = peerSession.current) => {
      await fetch(`/api/calls/${callId}/signals`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, payload, from: session.current, to }),
        keepalive: kind === "bye",
      }).catch(() => {});
    },
    [callId]
  );

  const finish = useCallback(
    (final: Phase, notifyServer: "end" | "missed" | null = "end") => {
      if (done.current) return;
      done.current = true;
      if (connectedAt.current) setTalked(Math.floor((Date.now() - connectedAt.current) / 1000));
      tone.stop();
      pc.current?.close();
      pc.current = null;
      stream.current?.getTracks().forEach((t) => t.stop());
      if (notifyServer) {
        fetch(`/api/calls/${callId}`, { method: "POST", body: JSON.stringify({ action: notifyServer }), keepalive: true }).catch(() => {});
      }
      setP(final);
    },
    [callId, setP, tone]
  );

  const createPeer = useCallback(
    (peer: string) => {
      pc.current?.close();
      peerSession.current = peer;
      pendingIce.current = [];
      const conn = new RTCPeerConnection({ iceServers });
      pc.current = conn;
      stream.current?.getTracks().forEach((t) => conn.addTrack(t, stream.current!));

      conn.onicecandidate = (e) => {
        if (e.candidate) send("ice", e.candidate.toJSON(), peer);
      };
      conn.ontrack = (e) => {
        const [remote] = e.streams;
        if (remoteRef.current && remoteRef.current.srcObject !== remote) remoteRef.current.srcObject = remote;
        if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== remote) remoteAudioRef.current.srcObject = remote;
        const check = () => setRemoteVideo(remote.getVideoTracks().some((t) => t.enabled && !t.muted && t.readyState === "live"));
        remote.getVideoTracks().forEach((t) => {
          t.onmute = check;
          t.onunmute = check;
        });
        check();
      };
      conn.onconnectionstatechange = () => {
        const st = conn.connectionState;
        if (st === "connected") {
          tone.stop();
          if (!connectedAt.current) connectedAt.current = Date.now();
          setP("connected");
        } else if (st === "disconnected") {
          if (phaseRef.current === "connected") setP("reconnecting");
        } else if (st === "failed") {
          setP("reconnecting");
          if (initiator) conn.restartIce();
          else send("hello", { restart: true }, null);
        }
      };
      if (initiator) {
        conn.onnegotiationneeded = async () => {
          try {
            await conn.setLocalDescription();
            send("offer", conn.localDescription, peer);
          } catch (err) {
            console.error("offer failed", err);
          }
        };
      }
      return conn;
    },
    [iceServers, initiator, send, setP, tone]
  );

  const handle = useCallback(
    async (s: Signal) => {
      if (s.from_session === session.current) return;
      if (s.to_session && s.to_session !== session.current) return;

      if (s.kind === "hello") {
        const isNewPeer = peerSession.current !== s.from_session;
        if (!s.to_session) send("hello", null, s.from_session); // introduce ourselves back
        if (phaseRef.current !== "connected") setP("connecting");
        const restart = Boolean((s.payload as { restart?: boolean } | null)?.restart);
        if (initiator) {
          if (isNewPeer || !pc.current) createPeer(s.from_session);
          else if (restart) pc.current.restartIce();
        } else if (isNewPeer) {
          peerSession.current = s.from_session;
        }
        return;
      }
      if (s.kind === "offer") {
        const conn = !pc.current || peerSession.current !== s.from_session ? createPeer(s.from_session) : pc.current;
        await conn.setRemoteDescription(s.payload as RTCSessionDescriptionInit);
        await conn.setLocalDescription();
        send("answer", conn.localDescription, s.from_session);
        for (const c of pendingIce.current.splice(0)) await conn.addIceCandidate(c).catch(() => {});
        return;
      }
      if (s.kind === "answer" && pc.current) {
        if (pc.current.signalingState === "have-local-offer") {
          await pc.current.setRemoteDescription(s.payload as RTCSessionDescriptionInit);
          for (const c of pendingIce.current.splice(0)) await pc.current.addIceCandidate(c).catch(() => {});
        }
        return;
      }
      if (s.kind === "ice") {
        const c = s.payload as RTCIceCandidateInit;
        if (pc.current?.remoteDescription) await pc.current.addIceCandidate(c).catch(() => {});
        else pendingIce.current.push(c);
        return;
      }
      if (s.kind === "bye") finish("ended", null);
    },
    [createPeer, finish, initiator, send, setP]
  );

  // Start: camera/mic, then join and poll for signals
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      if (stopped || done.current) return;
      try {
        const res = await fetch(`/api/calls/${callId}/signals?after=${cursor.current}`, { cache: "no-store" });
        if (res.ok) {
          const json = (await res.json()) as { call: { status: string }; cursor: number; signals: Signal[] };
          cursor.current = json.cursor;
          for (const s of json.signals) await handle(s);
          const st = json.call.status;
          if (st === "declined") return finish("declined", null);
          if (st === "missed") return finish("missed", null);
          if (st === "ended" || st === "cancelled") return finish("ended", null);
          if (st === "ongoing" && phaseRef.current === "ringing") setP("waiting");
        }
      } catch {}
      const fast = phaseRef.current !== "connected";
      timer = setTimeout(poll, fast ? 600 : 2000);
    }

    if (!session.current) session.current = crypto.randomUUID();
    (async () => {
      try {
        const constraints: MediaStreamConstraints = {
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: type === "video" ? { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        };
        try {
          stream.current = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
          if (type !== "video") throw err;
          // No camera available: continue with voice only
          stream.current = await navigator.mediaDevices.getUserMedia({ audio: constraints.audio });
          setCamOn(false);
        }
      } catch {
        setMediaError("We couldn't use your microphone. Allow microphone access in your browser settings, then try again.");
        setP("media-error");
        return;
      }
      if (stopped) return;
      if (localRef.current) localRef.current.srcObject = stream.current;

      const first = await fetch(`/api/calls/${callId}/signals?after=-1`, { cache: "no-store" }).then((r) => r.json()).catch(() => null);
      cursor.current = first?.cursor ?? 0;
      const status = first?.call?.status ?? props.initialStatus;
      if (status === "ringing" && isCaller) {
        setP("ringing");
        tone.ringback();
        setTimeout(() => {
          if (phaseRef.current === "ringing") finish("missed", "missed");
        }, RING_TIMEOUT_MS);
      } else if (["ended", "declined", "missed", "cancelled"].includes(status)) {
        finish("ended", null);
        return;
      } else {
        setP("waiting");
      }
      send("hello", null, null);
      poll();
    })();

    const onLeave = () => {
      if (!done.current) {
        navigator.sendBeacon?.(`/api/calls/${callId}/signals`, new Blob([JSON.stringify({ kind: "bye", from: session.current, to: null })], { type: "application/json" }));
      }
    };
    window.addEventListener("pagehide", onLeave);
    return () => {
      stopped = true;
      clearTimeout(timer);
      window.removeEventListener("pagehide", onLeave);
      if (!done.current) {
        onLeave();
        finish("ended");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId]);

  // Call timer
  useEffect(() => {
    if (phase !== "connected" && phase !== "reconnecting") return;
    const t = setInterval(() => setElapsed(connectedAt.current ? Math.floor((Date.now() - connectedAt.current) / 1000) : 0), 1000);
    return () => clearInterval(t);
  }, [phase]);

  function toggleMic() {
    const next = !micOn;
    stream.current?.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
  }
  function toggleCam() {
    const next = !camOn;
    stream.current?.getVideoTracks().forEach((t) => (t.enabled = next));
    setCamOn(next);
  }
  async function flip() {
    const nextFacing = facing === "user" ? "environment" : "user";
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: nextFacing } });
      const track = s.getVideoTracks()[0];
      const sender = pc.current?.getSenders().find((x) => x.track?.kind === "video");
      await sender?.replaceTrack(track);
      stream.current?.getVideoTracks().forEach((t) => {
        t.stop();
        stream.current?.removeTrack(t);
      });
      stream.current?.addTrack(track);
      if (localRef.current) localRef.current.srcObject = stream.current;
      setFacing(nextFacing);
    } catch {}
  }
  async function toggleFull() {
    try {
      if (!document.fullscreenElement) {
        await stageRef.current?.requestFullscreen();
        setFull(true);
      } else {
        await document.exitFullscreen();
        setFull(false);
      }
    } catch {}
  }
  function hangUp() {
    send("bye", null, peerSession.current);
    finish("ended", "end");
  }

  const finished = ["ended", "declined", "missed", "media-error"].includes(phase);
  const status =
    phase === "starting" ? "Starting…" :
    phase === "ringing" ? "Ringing…" :
    phase === "waiting" ? `Waiting for ${other.name.split(" ")[0]} to join…` :
    phase === "connecting" ? "Connecting…" :
    phase === "reconnecting" ? "Reconnecting…" :
    phase === "connected" ? fmt(elapsed) : "";

  if (finished) {
    const title =
      phase === "declined" ? `${other.name} declined the call` :
      phase === "missed" ? `${other.name} didn't answer` :
      phase === "media-error" ? "Microphone unavailable" : "Call ended";
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-950 px-4 py-10">
        <div className="w-full max-w-sm rounded-3xl bg-surface p-8 text-center shadow-2xl">
          <div className="mx-auto w-fit"><Avatar name={other.name} url={other.photo} size={80} /></div>
          <h1 className="font-display mt-4 text-xl font-bold">{title}</h1>
          {phase === "media-error" ? (
            <p className="mt-2 text-sm text-muted">{mediaError}</p>
          ) : (
            talked !== null && <p className="mt-1 text-sm text-muted">Duration {fmt(talked)}</p>
          )}
          <div className="mt-6 grid gap-2">
            {phase === "media-error" && <button onClick={() => location.reload()} className="btn-primary">Try again</button>}
            {props.canMarkComplete && props.appointmentId && (
              <Link href={`/therapist/appointments/${props.appointmentId}`} className="btn-primary">Mark session complete & add notes</Link>
            )}
            <Link href={props.messagesHref} className="btn-secondary"><MessageCircle className="size-4" /> Send a message</Link>
            <button onClick={() => router.push(props.backHref)} className="btn-ghost">Back to dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  const showRemoteVideo = remoteVideo && phase === "connected";

  return (
    <div ref={stageRef} className="relative flex h-[100dvh] flex-col overflow-hidden bg-[radial-gradient(120%_80%_at_50%_0%,#3b33a6_0%,#130f38_60%)] text-white">
      <audio ref={remoteAudioRef} autoPlay />
      {/* Remote video fills the stage */}
      <video ref={remoteRef} autoPlay playsInline className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${showRemoteVideo ? "opacity-100" : "opacity-0"}`} muted />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between gap-3 bg-gradient-to-b from-black/40 to-transparent px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2 text-xs font-medium text-white/80">
          <ShieldCheck className="size-4 text-glow-300" /> Private, encrypted call
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          {phase === "reconnecting" ? <WifiOff className="size-4 text-sun-400" /> : phase === "connected" ? <Wifi className="size-4 text-glow-300" /> : null}
          {type === "video" && (
            <button onClick={toggleFull} className="rounded-full p-2 hover:bg-white/10" aria-label={full ? "Exit full screen" : "Full screen"}>
              {full ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Caller card when there is no remote video */}
      {!showRemoteVideo && (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="relative">
            {(phase === "ringing" || phase === "waiting" || phase === "connecting" || (phase === "connected" && type === "audio")) && (
              <>
                <span className="absolute inset-0 rounded-full bg-brand-300/40 animate-ring" />
                <span className="absolute inset-0 rounded-full bg-brand-300/30 animate-ring [animation-delay:0.6s]" />
              </>
            )}
            <div className="relative rounded-full ring-4 ring-white/15">
              <Avatar name={other.name} url={other.photo} size={132} />
            </div>
          </div>
          <h1 className="font-display mt-7 text-3xl font-bold">{other.name}</h1>
          <p className="mt-1 text-sm capitalize text-white/70">{other.role}</p>
          <p className="mt-4 flex items-center gap-2 text-base font-medium tabular-nums text-white/90">
            {phase !== "connected" && <Loader2 className="size-4 animate-spin" />}
            {status}
          </p>
          {phase === "connected" && type === "audio" && <p className="mt-1 text-xs text-white/60">Voice call</p>}
        </div>
      )}

      {showRemoteVideo && (
        <div className="relative z-10 mx-auto mt-auto mb-4 rounded-full bg-black/35 px-4 py-1.5 text-sm font-medium tabular-nums backdrop-blur">
          {other.name.split(" ").slice(0, 2).join(" ")} · {status}
        </div>
      )}

      {/* Self view */}
      {type === "video" && (
        <div className="absolute right-4 top-20 z-20 aspect-[3/4] w-28 overflow-hidden rounded-2xl bg-brand-900 shadow-2xl ring-2 ring-white/20 sm:w-40">
          <video ref={localRef} autoPlay playsInline muted className={`h-full w-full object-cover ${facing === "user" ? "-scale-x-100" : ""} ${camOn ? "" : "invisible"}`} />
          {!camOn && (
            <div className="absolute inset-0 flex items-center justify-center">
              <VideoOff className="size-6 text-white/60" />
            </div>
          )}
          <p className="absolute bottom-1.5 left-2 text-[10px] font-semibold text-white/90 drop-shadow">You</p>
        </div>
      )}

      {/* Controls */}
      <div className="relative z-10 flex items-center justify-center gap-4 bg-gradient-to-t from-ink/50 to-transparent px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-10 sm:gap-5">
        <ControlButton onClick={toggleMic} active={!micOn} label={micOn ? "Mute" : "Unmute"}>
          {micOn ? <Mic className="size-6" /> : <MicOff className="size-6" />}
        </ControlButton>
        {type === "video" && (
          <ControlButton onClick={toggleCam} active={!camOn} label={camOn ? "Camera off" : "Camera on"}>
            {camOn ? <Video className="size-6" /> : <VideoOff className="size-6" />}
          </ControlButton>
        )}
        {type === "video" && (
          <ControlButton onClick={flip} label="Flip camera" className="sm:hidden">
            <SwitchCamera className="size-6" />
          </ControlButton>
        )}
        <button onClick={hangUp} className="flex flex-col items-center gap-1.5" aria-label="End call">
          <span className="flex size-16 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-900/40 transition hover:bg-red-600 active:scale-95">
            <PhoneOff className="size-7" />
          </span>
          <span className="text-[11px] font-medium text-white/80">End</span>
        </button>
      </div>
      {phase === "ringing" && (
        <p className="relative z-10 -mt-5 pb-4 text-center text-xs text-white/60">
          <Phone className="mr-1 inline size-3" /> Calling {other.name.split(" ")[0]}
        </p>
      )}
    </div>
  );
}

function ControlButton({ onClick, active, label, children, className = "" }: { onClick: () => void; active?: boolean; label: string; children: React.ReactNode; className?: string }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 ${className}`} aria-label={label} aria-pressed={active}>
      <span className={`flex size-14 items-center justify-center rounded-full backdrop-blur transition active:scale-95 ${active ? "bg-surface text-ink" : "bg-white/15 text-white hover:bg-white/25"}`}>
        {children}
      </span>
      <span className="text-[11px] font-medium text-white/80">{label}</span>
    </button>
  );
}
