import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const apiKey = process.env.SUPYAGENT_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "SUPYAGENT_API_KEY not configured" },
      { status: 500 }
    );
  }

  const baseUrl =
    process.env.SUPYAGENT_BASE_URL || "https://app.supyagent.com";

  const res = await fetch(`${baseUrl}/api/v1/jobs/${id}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
