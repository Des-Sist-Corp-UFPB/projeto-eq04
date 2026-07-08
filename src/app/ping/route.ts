import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "eq04",
    timestamp: new Date().toISOString(),
  });
}
