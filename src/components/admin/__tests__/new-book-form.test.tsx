/**
 * @jest-environment jsdom
 */
import "@/__tests__/setup/component-setup";
import { renderWithProviders, screen, userEvent, waitFor } from "@/__tests__/utils/test-utils";
import { mockAdminSession } from "@/__tests__/mocks/auth";
import { NewBookForm } from "@/components/admin/new-book-form";

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

describe("NewBookForm", () => {
  beforeEach(() => {
    mockRefresh.mockClear();
  });

  it("carrega autores e categorias via API", async () => {
    renderWithProviders(<NewBookForm />, { session: mockAdminSession() });

    await waitFor(() => {
      expect(screen.getByText("Isaac Asimov")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /ficção científica/i })).toBeInTheDocument();
  });

  it("envia formulário válido e limpa campos após sucesso", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewBookForm />, { session: mockAdminSession() });

    await waitFor(() => screen.getByText("Isaac Asimov"));

    await user.type(screen.getByPlaceholderText("Título"), "Novo Livro");
    await user.type(screen.getByPlaceholderText("Preço"), "49.90");
    await user.selectOptions(screen.getByRole("combobox"), "author-1");
    await user.click(screen.getByRole("button", { name: /ficção científica/i }));
    await user.click(screen.getByRole("button", { name: /adicionar livro/i }));

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
    expect(screen.getByPlaceholderText("Título")).toHaveValue("");
  });

  it("exibe erro quando a API retorna falha", async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      const path = new URL(url, "http://localhost").pathname;
      const method = (init?.method ?? "GET").toUpperCase();

      if (method === "POST" && path === "/api/books") {
        return {
          ok: false,
          status: 403,
          json: async () => ({ error: "Não autorizado" }),
        } as Response;
      }

      return (originalFetch as typeof fetch)(input, init);
    });

    const user = userEvent.setup();
    renderWithProviders(<NewBookForm />, { session: mockAdminSession() });

    await waitFor(() => screen.getByText("Isaac Asimov"));
    await user.type(screen.getByPlaceholderText("Título"), "Livro");
    await user.type(screen.getByPlaceholderText("Preço"), "10");
    await user.selectOptions(screen.getByRole("combobox"), "author-1");
    await user.click(screen.getByRole("button", { name: /adicionar livro/i }));

    await waitFor(() => {
      expect(screen.getByText("Não autorizado")).toBeInTheDocument();
    });

    global.fetch = originalFetch;
  });
});
