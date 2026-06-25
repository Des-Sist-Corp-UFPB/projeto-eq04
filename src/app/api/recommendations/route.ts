import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateRecommendationsForUser } from "@/lib/openai";

export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const recommendations = await generateRecommendationsForUser(
      session.user.id
    );
    return NextResponse.json({ recommendations });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[recommendations] erro:", message);
    return NextResponse.json(
      { error: "Não foi possível gerar recomendações no momento.", detail: message },
      { status: 502 }
    );
  }
}