/**
 * @jest-environment jsdom
 */
import "@/__tests__/setup/component-setup";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import RecommendationsPage from "../page";

describe("RecommendationsPage", () => {
  it("renders recommendations after generation is triggered", async () => {
    render(<RecommendationsPage />);

    expect(
      screen.getByRole("heading", { name: /recomendações com inteligência artificial/i })
    ).toBeInTheDocument();

    const button = screen.getByRole("button", { name: /gerar recomendações/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Fundação")).toBeInTheDocument();
      expect(
        screen.getByText(/baseado no seu interesse em ficção científica/i)
      ).toBeInTheDocument();
    });
  });

  it("handles generation error from API", async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: "Erro de teste na API" }),
    } as Response);

    render(<RecommendationsPage />);

    const button = screen.getByRole("button", { name: /gerar recomendações/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Erro de teste na API")).toBeInTheDocument();
    });

    global.fetch = originalFetch;
  });

  it("handles empty recommendations list", async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ recommendations: [] }),
    } as Response);

    render(<RecommendationsPage />);

    const button = screen.getByRole("button", { name: /gerar recomendações/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText(/nenhuma recomendação disponível no momento/i)
      ).toBeInTheDocument();
    });

    global.fetch = originalFetch;
  });
});
