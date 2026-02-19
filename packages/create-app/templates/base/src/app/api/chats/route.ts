import { prisma } from "@/lib/prisma";
import { createPrismaAdapter } from "@supyagent/sdk/prisma";
import { NextResponse } from "next/server";

const adapter = createPrismaAdapter(prisma);

export async function GET() {
  const chats = await adapter.listChats();
  return NextResponse.json({ chats });
}
