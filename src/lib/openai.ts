import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// O client só é criado quando a função é chamada de fato (em tempo de
// execução), e não na importação do módulo. Isso evita que o `next build`
// quebre, já que o OPENAI_API_KEY só existe no container em runtime
// (passado pelo docker-compose), não durante o build da imagem.
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

interface RecommendationResult {
  bookId: string;
  title: string;
  reason: string;
}

/**
 * Gera recomendações personalizadas para um usuário usando a API da OpenAI,
 * com base em:
 *  - histórico de compras (livros na biblioteca do usuário)
 *  - categorias favoritas
 *  - interesses declarados no perfil
 *
 * A IA escolhe apenas entre livros que o usuário ainda não possui, a partir
 * do catálogo real do banco — isso evita "alucinação" de livros inexistentes.
 */
export async function generateRecommendationsForUser(
  userId: string
): Promise<RecommendationResult[]> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      favoriteCategories: true,
      libraryItems: { include: { book: { include: { categories: true } } } },
    },
  });

  const ownedBookIds = user.libraryItems.map((item) => item.bookId);

  // Catálogo candidato: livros que o usuário ainda não tem, limitado para
  // manter o prompt enxuto.
  const candidateBooks = await prisma.book.findMany({
    where: { id: { notIn: ownedBookIds.length ? ownedBookIds : undefined } },
    include: { categories: true, author: true },
    take: 40,
  });

  if (candidateBooks.length === 0) {
    return [];
  }

  const purchasedTitles = user.libraryItems.map((item) => item.book.title);
  const favoriteCategoryNames = user.favoriteCategories.map((c) => c.name);

  const catalogForPrompt = candidateBooks.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author.name,
    categories: book.categories.map((c) => c.name),
  }));

  const systemPrompt =
    "Você é um sistema de recomendação de uma loja de e-books. " +
    "Responda APENAS com um JSON válido no formato " +
    '{ "recommendations": [{ "bookId": string, "reason": string }] }, ' +
    "com no máximo 5 itens. O campo bookId DEVE ser exatamente um dos IDs " +
    "fornecidos na lista de catálogo. O campo reason deve ter no máximo " +
    "uma frase curta, em português, explicando a recomendação.";

  const userPrompt = JSON.stringify({
    historicoDeCompras: purchasedTitles,
    categoriasFavoritas: favoriteCategoryNames,
    interesses: user.interests ?? null,
    catalogoDisponivel: catalogForPrompt,
  });

  const completion = await getOpenAIClient().chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: { recommendations?: { bookId: string; reason: string }[] };

  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { recommendations: [] };
  }

  const validBookIds = new Set(candidateBooks.map((b) => b.id));
  const safeRecommendations = (parsed.recommendations ?? []).filter((r) =>
    validBookIds.has(r.bookId)
  );

  // Persiste as recomendações geradas
  await prisma.$transaction(
    safeRecommendations.map((r) =>
      prisma.recommendation.create({
        data: { userId, bookId: r.bookId, reason: r.reason },
      })
    )
  );

  await logAudit({
    action: "RECOMMENDATION_REQUEST",
    userId,
    entity: "Recommendation",
    metadata: { count: safeRecommendations.length },
  });

  const titleById = new Map(candidateBooks.map((b) => [b.id, b.title]));
  return safeRecommendations.map((r) => ({
    bookId: r.bookId,
    title: titleById.get(r.bookId) ?? "",
    reason: r.reason,
  }));
}
