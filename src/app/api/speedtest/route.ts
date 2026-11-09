import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** Upload test for "Test my connection": reads and discards up to 1 MB. */
export async function POST(request: NextRequest) {
  const buf = await request.arrayBuffer();
  if (buf.byteLength > 1_100_000) return NextResponse.json({ error: "Too large" }, { status: 413 });
  return NextResponse.json({ bytes: buf.byteLength }, { headers: { "Cache-Control": "no-store" } });
}
