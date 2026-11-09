import Link from "next/link";
import { PageHeader } from "@/components/ui/misc";

export function ToolPage({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="max-w-3xl">
      <Link href="/patient/library" className="mb-3 inline-block text-sm font-medium text-brand-700">← Self-help</Link>
      <PageHeader title={title} text={text} />
      {children}
    </div>
  );
}
