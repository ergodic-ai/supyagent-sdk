import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { client } from "@/lib/supyagent";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userClient = client.asAccount(session.user.id);
    const me = await userClient.me();
    return NextResponse.json(me);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch user info" },
      { status: 500 }
    );
  }
}
