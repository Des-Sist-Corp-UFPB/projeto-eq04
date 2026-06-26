import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    service: "eq04",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
