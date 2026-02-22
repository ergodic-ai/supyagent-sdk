import { NextResponse } from "next/server";

const SUPYAGENT_API_URL =
  process.env.SUPYAGENT_API_URL || "https://app.supyagent.com";

export async function GET() {
  const apiKey = process.env.SUPYAGENT_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "SUPYAGENT_API_KEY not configured" },
      { status: 500 }
    );
  }

  const res = await fetch(`${SUPYAGENT_API_URL}/api/v1/me`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch user info" },
      { status: res.status }
    );
  }

  const json = await res.json();
  return NextResponse.json(json.data ?? json);
}
