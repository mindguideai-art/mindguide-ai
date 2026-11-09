import { requireRole } from "@/lib/auth";
import { Breathing } from "@/components/library/breathing";
import { ToolPage } from "../shell";

export const metadata = { title: "Breathing exercises" };

export default async function Page() {
  await requireRole("patient");
  return <ToolPage title="Breathing exercises" text="Follow the circle: breathe in as it grows, out as it shrinks."><Breathing /></ToolPage>;
}
