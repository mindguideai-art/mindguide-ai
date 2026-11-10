"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";

type Engine = {
  languages: [string, string][];
  current: () => string;
  set: (code: string) => Promise<void> | void;
  enable: (on: boolean) => void;
};
declare global {
  interface Window { MGi18n?: Engine; MG_I18N_ENABLED?: boolean }
}

export const LANGUAGES: [string, string][] = [["en", "English"], ["pcm", "Pidgin"], ["yo", "Yorùbá"], ["ig", "Igbo"], ["ha", "Hausa"]];

/** Staff screens stay in English. */
function translatable(path: string) {
  return !path.startsWith("/therapist") && !path.startsWith("/admin");
}

/**
 * Loads the translation engine once React has finished hydrating (so React and the page agree),
 * and turns it off on staff screens.
 */
export function I18nLoader() {
  const path = usePathname();
  useEffect(() => {
    const on = translatable(path);
    if (window.MGi18n) { window.MGi18n.enable(on); return; }
    window.MG_I18N_ENABLED = on;
    if (document.getElementById("mg-i18n")) return;
    // Wait until the page has fully loaded and React is idle, so no part of the page is still hydrating.
    const add = () => {
      if (document.getElementById("mg-i18n")) return;
      const s = document.createElement("script");
      s.id = "mg-i18n";
      s.src = "/i18n/engine.js";
      s.async = true;
      document.head.appendChild(s); // head, not body: React may still be matching body nodes
    };
    // React can still be finishing parts of the page just after "load", so wait a moment longer.
    const idle = () => setTimeout(() => ("requestIdleCallback" in window ? window.requestIdleCallback(add, { timeout: 1500 }) : add()), 800);
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });
  }, [path]);
  return null;
}

/** Language picker (English, Pidgin, Yoruba, Igbo, Hausa). The choice is remembered on this device. */
export function LanguageSwitcher({ className = "", tone = "light", full = false }: { className?: string; tone?: "light" | "dark"; full?: boolean }) {
  const [lang, setLang] = useState("en");
  useEffect(() => {
    const sync = () => {
      const next = window.MGi18n?.current() ?? readSaved();
      setLang((cur) => (cur === next ? cur : next));
    };
    sync();
    window.addEventListener("mg-lang", sync);
    return () => window.removeEventListener("mg-lang", sync);
  }, []);

  function change(code: string) {
    setLang(code);
    if (window.MGi18n) window.MGi18n.set(code);
    else try { localStorage.setItem("mg-lang", code); } catch {}
  }

  const look = tone === "dark"
    ? "border-white/20 bg-white/10 text-white"
    : "border-line bg-surface text-ink";
  return (
    <label
      data-no-translate
      className={`relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border pl-2.5 pr-2 text-sm font-semibold transition hover:border-brand-300 ${look} ${className}`}
      title="Language"
    >
      <Globe className="size-4 opacity-70" aria-hidden />
      <span className="sr-only">Language</span>
      <span className={full ? "" : "hidden sm:inline"}>{LANGUAGES.find(([c]) => c === lang)?.[1] ?? "English"}</span>
      {!full && <span className="uppercase sm:hidden">{lang === "pcm" ? "PCM" : lang}</span>}
      <select
        value={lang}
        onChange={(e) => change(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Language"
      >
        {LANGUAGES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
      </select>
    </label>
  );
}

function readSaved() {
  try {
    const q = new URLSearchParams(location.search).get("lang");
    if (q && LANGUAGES.some(([c]) => c === q)) return q;
    return localStorage.getItem("mg-lang") || "en";
  } catch { return "en"; }
}
