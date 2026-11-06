import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { EventForm } from "@/components/admin/event-form";

export const metadata = { title: "New event" };

export default async function NewEvent() {
  await requireRole("admin");
  return (
    <div className="max-w-3xl">
      <Link href="/admin/events" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" /> Events</Link>
      <PageHeader title="New event" text="Fill in the details. You can save it as a draft and publish it later." />
      <EventForm e={{ registration_open: true }} />
    </div>
  );
}
