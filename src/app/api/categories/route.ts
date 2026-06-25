import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, getClientIp } from "@/lib/audit";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

const createCategorySchema = z.object({
  name: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const category = await prisma.category.create({ data: parsed.data });

  await logAudit({
    action: "CATEGORY_CREATE",
    userId: session.user.id,
    entity: "Category",
    entityId: category.id,
    metadata: { name: category.name },
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(category, { status: 201 });
}
