import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateRecommendationsForUser } from "@/lib/openai";

// POST /api/recommendations -> gera novas recomendações via OpenAI
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
    console.error("[recommendations] erro ao gerar recomendações:", error);
    return NextResponse.json(
      { error: "Não foi possível gerar recomendações no momento." },
      { status: 502 }
    );
  }
}
