import { requireRole } from "@/lib/auth";
import { Grounding } from "@/components/library/grounding";
import { ToolPage } from "../shell";

export const metadata = { title: "5-4-3-2-1 grounding" };

export default async function Page() {
  await requireRole("patient");
  return <ToolPage title="5-4-3-2-1 grounding" text="Use your senses to come back to the here and now. Go slowly; there's no wrong answer."><Grounding /></ToolPage>;
}
