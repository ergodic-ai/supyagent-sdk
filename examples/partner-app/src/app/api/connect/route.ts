import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { client, ensureAccount } from "@/lib/supyagent";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider } = await req.json();
  if (!provider) {
    return NextResponse.json({ error: "provider is required" }, { status: 400 });
  }

  const account = await ensureAccount(session.user.id, session.user.name || undefined);

  const { connectUrl } = await client.accounts.connect(account.id, {
    provider,
    redirectUrl: `${process.env.AUTH_URL || "http://localhost:3000"}/callback`,
  });

  return NextResponse.json({ connectUrl });
}
