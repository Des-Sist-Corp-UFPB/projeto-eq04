import { prismaMock } from "@/__tests__/mocks/prisma";

const mockCreate = jest.fn();

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

import { generateRecommendationsForUser } from "@/lib/openai";

describe("generateRecommendationsForUser (OpenAI mockada)", () => {
  const userId = "user-1";

  beforeEach(() => {
    mockCreate.mockReset();
    prismaMock.auditLog.create.mockResolvedValue({} as any);
    prismaMock.$transaction.mockImplementation(async (ops) => {
      if (Array.isArray(ops)) return Promise.all(ops);
      return ops(prismaMock);
    });
    prismaMock.recommendation.create.mockResolvedValue({} as any);
  });

  it("retorna lista vazia quando não há livros candidatos", async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({
      id: userId,
      interests: "ficção",
      favoriteCategories: [],
      libraryItems: [],
    } as any);
    prismaMock.book.findMany.mockResolvedValue([]);

    const result = await generateRecommendationsForUser(userId);

    expect(result).toEqual([]);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("gera recomendações a partir da resposta da OpenAI", async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({
      id: userId,
      interests: "ficção científica",
      favoriteCategories: [{ id: "cat-1", name: "Ficção científica" }],
      libraryItems: [],
    } as any);
    prismaMock.book.findMany.mockResolvedValue([
      {
        id: "book-1",
        title: "Fundação",
        author: { name: "Isaac Asimov" },
        categories: [{ name: "Ficção científica" }],
      },
      {
        id: "book-2",
        title: "Eu, Robô",
        author: { name: "Isaac Asimov" },
        categories: [{ name: "Ficção científica" }],
      },
    ] as any);

    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              recommendations: [
                { bookId: "book-1", reason: "Clássico de ficção científica." },
              ],
            }),
          },
        },
      ],
    });

    const result = await generateRecommendationsForUser(userId);

    expect(mockCreate).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      bookId: "book-1",
      title: "Fundação",
      reason: "Clássico de ficção científica.",
    });
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "RECOMMENDATION_REQUEST" }),
      })
    );
  });

  it("ignora bookIds inválidos retornados pela IA", async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({
      id: userId,
      interests: null,
      favoriteCategories: [],
      libraryItems: [],
    } as any);
    prismaMock.book.findMany.mockResolvedValue([
      {
        id: "book-1",
        title: "Fundação",
        author: { name: "Isaac Asimov" },
        categories: [],
      },
    ] as any);

    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              recommendations: [
                { bookId: "book-inexistente", reason: "Alucinação" },
              ],
            }),
          },
        },
      ],
    });

    const result = await generateRecommendationsForUser(userId);

    expect(result).toEqual([]);
  });

  it("trata erro de parse de JSON retornado pela IA", async () => {
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({
      id: userId,
      interests: null,
      favoriteCategories: [],
      libraryItems: [],
    } as any);
    prismaMock.book.findMany.mockResolvedValue([
      {
        id: "book-1",
        title: "Fundação",
        author: { name: "Isaac Asimov" },
        categories: [],
      },
    ] as any);

    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: "invalid json string {",
          },
        },
      ],
    });

    const result = await generateRecommendationsForUser(userId);
    expect(result).toEqual([]);
  });
});
