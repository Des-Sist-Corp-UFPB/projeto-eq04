import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    // Consulta leve no banco (SELECT 1) para validar a conexão
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      service: "eq04",
      status: "ok",
      database: "ok",
      timestamp,
    });
  } catch (error) {
    console.error("[healthcheck] database check failed:", error);

    return NextResponse.json(
      {
        service: "eq04",
        status: "error",
        database: "error",
        timestamp,
      },
      { status: 503 }
    );
  }
}