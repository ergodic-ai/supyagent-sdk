import { prisma } from "@/lib/prisma";
import { createPrismaAdapter } from "@supyagent/sdk/prisma";
import { NextResponse } from "next/server";

const adapter = createPrismaAdapter(prisma);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const messages = await adapter.loadChat(id);
  return NextResponse.json({ messages });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await adapter.deleteChat(id);
  return NextResponse.json({ ok: true });
}
