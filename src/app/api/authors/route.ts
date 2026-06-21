import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET() {
  const authors = await prisma.author.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(authors);
}

const createAuthorSchema = z.object({
  name: z.string().min(1),
  bio: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createAuthorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const author = await prisma.author.create({ data: parsed.data });

  await logAudit({
    action: "AUTHOR_CREATE",
    userId: session.user.id,
    entity: "Author",
    entityId: author.id,
    metadata: { name: author.name },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(author, { status: 201 });
}
