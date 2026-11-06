"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert, ImagePlus, Loader2 } from "lucide-react";
import { addPhotos } from "@/app/actions/content";
import { uploadImage } from "@/lib/image-upload";

type Item = { name: string; preview: string; state: "waiting" | "uploading" | "done" | "error"; error?: string };

/** Drag-and-drop (or pick) many photos; each is resized in the browser, uploaded, then added to the album. */
export function PhotoUploader({ albumId }: { albumId: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  async function handle(files: File[]) {
    const list = files.filter((f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/i.test(f.name)).slice(0, 60);
    if (!list.length) return;
    setBusy(true); setMessage("");
    items.forEach((it) => URL.revokeObjectURL(it.preview));
    setItems(list.map((f) => ({ name: f.name, preview: URL.createObjectURL(f), state: "waiting" as const })));
    const update = (i: number, patch: Partial<Item>) => setItems((prev) => prev.map((it, n) => (n === i ? { ...it, ...patch } : it)));
    const done: { path: string; width: number; height: number }[] = [];
    // Three at a time keeps things quick without overloading a mobile connection.
    let next = 0;
    async function worker() {
      while (next < list.length) {
        const i = next++;
        update(i, { state: "uploading" });
        try {
          const up = await uploadImage("gallery", albumId, list[i]);
          done.push({ path: up.path, width: up.width, height: up.height });
          update(i, { state: "done" });
        } catch (e) {
          update(i, { state: "error", error: (e as Error).message });
        }
      }
    }
    await Promise.all([worker(), worker(), worker()]);
    if (done.length) {
      const res = await addPhotos(albumId, done);
      setMessage(res?.error ?? `${done.length} photo${done.length > 1 ? "s" : ""} added.`);
      startTransition(() => router.refresh());
    }
    setBusy(false);
  }

  const failed = items.filter((i) => i.state === "error");
  const progress = items.length ? Math.round((items.filter((i) => i.state === "done" || i.state === "error").length / items.length) * 100) : 0;

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (!busy) handle(Array.from(e.dataTransfer.files)); }}
        className={`grid place-items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${drag ? "border-brand-500 bg-brand-50" : "border-line bg-ink/[0.02]"}`}
      >
        <ImagePlus className="mb-3 size-9 text-brand-500" />
        <p className="font-semibold text-ink">Drag photos here, or</p>
        <button type="button" className="btn-primary btn-sm mt-3" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? <><Loader2 className="size-3.5 animate-spin" /> Uploading {progress}%</> : "Choose photos"}
        </button>
        <p className="hint mt-3">Up to 60 at a time · JPG, PNG or WebP · large photos are resized automatically</p>
        <input ref={input} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { handle(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
      </div>
      {message && <p className="mt-3 text-sm font-medium text-brand-700">{message}</p>}
      {items.length > 0 && busy && (
        <ul className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {items.map((it, i) => (
            <li key={i} className="relative aspect-square overflow-hidden rounded-lg bg-ink/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.preview} alt="" className={`size-full object-cover ${it.state === "done" ? "" : "opacity-50"}`} />
              <span className="absolute inset-0 grid place-items-center">
                {it.state === "uploading" && <Loader2 className="size-5 animate-spin text-white drop-shadow" />}
                {it.state === "done" && <CheckCircle2 className="size-5 text-white drop-shadow" />}
                {it.state === "error" && <CircleAlert className="size-5 text-red-600" />}
              </span>
            </li>
          ))}
        </ul>
      )}
      {failed.length > 0 && !busy && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {failed.length} couldn&apos;t be uploaded:
          <ul className="mt-1 list-disc pl-5">{failed.slice(0, 5).map((f, i) => <li key={i}>{f.error}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
