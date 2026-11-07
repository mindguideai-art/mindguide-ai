"use client";
import { Moon, Sun } from "lucide-react";

/** Switches light/dark mode. Follows the device until the person chooses; the choice is remembered on this device. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const next = root.classList.contains("dark") ? "light" : "dark";
    root.classList.toggle("dark", next === "dark");
    try { localStorage.setItem("mg-theme", next); } catch {}
  }
  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-muted transition hover:border-brand-300 hover:text-ink ${className}`}
      aria-label="Switch between light and dark mode"
      title="Light or dark mode"
    >
      <Moon className="size-[18px] dark:hidden" />
      <Sun className="hidden size-[18px] dark:block" />
    </button>
  );
}

/** Runs before the page paints, so there's no flash of the wrong theme. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("mg-theme");var m=window.matchMedia("(prefers-color-scheme: dark)");var d=t?t==="dark":m.matches;document.documentElement.classList.toggle("dark",d);if(!t&&m.addEventListener)m.addEventListener("change",function(e){if(!localStorage.getItem("mg-theme"))document.documentElement.classList.toggle("dark",e.matches)})}catch(e){}})();`;
