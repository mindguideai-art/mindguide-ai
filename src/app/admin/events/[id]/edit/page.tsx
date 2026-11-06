import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { EventForm } from "@/components/admin/event-form";
import { publicImageUrl, type EventRow } from "@/lib/events";

export const metadata = { title: "Edit event" };

export default async function EditEvent({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("admin");
  const { id } = await params;
  const { data } = await createAdminClient().from("community_events").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const e = data as EventRow;
  return (
    <div className="max-w-3xl">
      <Link href={`/admin/events/${id}`} className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" /> Back to event</Link>
      <PageHeader title="Edit event" />
      <EventForm e={{ ...e, image_url: publicImageUrl("event-images", e.image_path) }} />
    </div>
  );
}
