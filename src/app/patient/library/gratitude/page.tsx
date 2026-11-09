import { requireRole } from "@/lib/auth";
import { GratitudeForm } from "@/components/library/journal-forms";
import { ToolPage } from "../shell";

export const metadata = { title: "Three good things" };

export default async function Page() {
  await requireRole("patient");
  return (
    <ToolPage title="Three good things" text="At the end of the day, write down three things that went well, however small. Doing this for a week or two can lift your mood.">
      <div className="card"><GratitudeForm /></div>
    </ToolPage>
  );
}
