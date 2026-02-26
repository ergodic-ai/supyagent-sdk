import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { client, ensureAccount } from "@/lib/supyagent";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const account = await ensureAccount(session.user.id, session.user.name || undefined);
    const integrations = await client.accounts.integrations(account.id);
    return NextResponse.json({ integrations });
  } catch {
    return NextResponse.json({ integrations: [] });
  }
}
