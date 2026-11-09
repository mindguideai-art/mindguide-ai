/** Shared labels for care features (safe to import on server and client). */
export const RISK_LABEL: Record<string, string> = {
  low: "Low: monitor",
  medium: "Medium: needs follow-up",
  high: "High: urgent review",
  immediate: "Immediate danger",
};

export const LANGUAGE_OPTIONS = ["English", "Nigerian Pidgin", "Yoruba", "Igbo", "Hausa", "French"];

export const FAITH_OPTIONS = [
  { value: "christian", label: "Christian faith" },
  { value: "muslim", label: "Islamic faith" },
] as const;
