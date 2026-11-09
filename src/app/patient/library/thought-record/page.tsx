import { requireRole } from "@/lib/auth";
import { ThoughtRecordForm } from "@/components/library/journal-forms";
import { ToolPage } from "../shell";

export const metadata = { title: "Thought record" };

export default async function Page() {
  await requireRole("patient");
  return (
    <ToolPage title="Thought record" text="When a thought keeps upsetting you, slow it down and look at it from every side. Saved privately to your journal.">
      <div className="card mb-6 text-sm text-muted">
        <p><b className="text-ink">Tip:</b> thoughts aren&apos;t facts. The aim isn&apos;t to &ldquo;think positive&rdquo;, but to find a view that&apos;s fair and true. You can bring this to your next session to work on with your therapist.</p>
      </div>
      <div className="card"><ThoughtRecordForm /></div>
    </ToolPage>
  );
}
