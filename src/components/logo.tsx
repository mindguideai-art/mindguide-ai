/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

/** The MindGuide AI head mark. On dark backgrounds it sits on a white tile so the gradient stays readable. */
export function LogoMark({ size = 34, light = false }: { size?: number; light?: boolean }) {
  const img = <img src="/brand/mindguide-mark.png" alt="" width={size} height={size} className="block" style={{ width: size, height: size }} />;
  if (!light) return <span className="inline-flex shrink-0 dark:rounded-xl dark:bg-white dark:p-0.5">{img}</span>;
  return (
    <span className="inline-flex items-center justify-center rounded-xl bg-white p-1 shadow-sm" style={{ width: size + 8, height: size + 8 }}>
      <img src="/brand/mindguide-mark.png" alt="" width={size} height={size} style={{ width: size, height: size }} />
    </span>
  );
}

/** Wordmark styled like the logo: "MindGuide" in the teal-to-indigo gradient, "AI" in magenta. */
export function Wordmark({ light = false, className = "text-xl" }: { light?: boolean; className?: string }) {
  return (
    <span className={`whitespace-nowrap font-display font-semibold tracking-tight ${className}`}>
      <span className={light ? "text-white" : "bg-[linear-gradient(95deg,#0f9a8f,#3b33a6)] bg-clip-text text-transparent dark:bg-[linear-gradient(95deg,#3fd6c6,#948cff)]"}>MindGuide</span>{" "}
      <span className={light ? "text-[#f0a6e2]" : "text-sun-400 dark:text-[#ea6fd3]"}>AI</span>
    </span>
  );
}

export function Logo({ light = false, href = "/" }: { light?: boolean; href?: string }) {
  return (
    <Link href={href} className="inline-flex shrink-0 items-center gap-2" aria-label="MindGuide AI home">
      <LogoMark light={light} size={light ? 28 : 36} />
      <Wordmark light={light} />
    </Link>
  );
}
