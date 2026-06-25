import { POST } from "@/app/api/recommendations/route";
import { mockAuth, mockUserSession } from "@/__tests__/mocks/auth";

const mockGenerate = jest.fn();

jest.mock("@/lib/openai", () => ({
  generateRecommendationsForUser: (...args: unknown[]) => mockGenerate(...args),
}));

describe("POST /api/recommendations", () => {
  beforeEach(() => {
    mockGenerate.mockReset();
  });

  it("retorna 401 quando usuário não está autenticado", async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Não autorizado");
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it("retorna recomendações geradas pela OpenAI (mockada)", async () => {
    mockAuth.mockResolvedValue(mockUserSession());
    mockGenerate.mockResolvedValue([
      {
        bookId: "book-1",
        title: "Fundação",
        reason: "Baseado no seu histórico de ficção científica.",
      },
    ]);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recommendations).toHaveLength(1);
    expect(mockGenerate).toHaveBeenCalledWith("user-1");
    expect(data.recommendations[0].reason).toContain("ficção científica");
  });

  it("retorna 502 quando a integração com OpenAI falha", async () => {
    mockAuth.mockResolvedValue(mockUserSession());
    mockGenerate.mockRejectedValue(new Error("API indisponível"));

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toMatch(/não foi possível gerar recomendações/i);
    expect(data.detail).toBe("API indisponível");
  });

  it("retorna 502 quando a integração com OpenAI falha com erro não-instancia de Error", async () => {
    mockAuth.mockResolvedValue(mockUserSession());
    mockGenerate.mockRejectedValue("Erro de string bruto");

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toMatch(/não foi possível gerar recomendações/i);
    expect(data.detail).toBe("Erro de string bruto");
  });
});
