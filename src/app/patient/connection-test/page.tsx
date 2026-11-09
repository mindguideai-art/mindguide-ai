import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { ConnectionTest } from "@/components/connection-test";

export const metadata = { title: "Test my connection" };

export default async function ConnectionTestPage() {
  await requireRole("patient");
  return (
    <div className="max-w-3xl">
      <PageHeader title="Test my connection" text="Check your internet, camera and microphone before a session, and turn on low-data mode if your network is slow." />
      <ConnectionTest />
    </div>
  );
}
