/**
 * @jest-environment jsdom
 */
import "@/__tests__/setup/component-setup";
import { renderWithProviders, screen, userEvent, waitFor } from "@/__tests__/utils/test-utils";
import { mockUserSession } from "@/__tests__/mocks/auth";
import { BuyButton } from "@/components/buy-button";

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

describe("BuyButton", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockRefresh.mockClear();
  });

  it("redireciona para login quando usuário não está autenticado", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BuyButton bookId="book-1" />, { session: null });

    await user.click(screen.getByRole("button", { name: /comprar agora/i }));

    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("cria pedido e exibe confirmação para usuário autenticado", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BuyButton bookId="book-1" />, {
      session: mockUserSession(),
    });

    await user.click(screen.getByRole("button", { name: /comprar agora/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/comprado! disponível na sua biblioteca/i)
      ).toBeInTheDocument();
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("exibe estado de carregamento durante a compra", async () => {
    let resolveFetch: (value: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });

    const originalFetch = global.fetch;
    global.fetch = jest.fn(() => fetchPromise) as typeof fetch;

    const user = userEvent.setup();
    renderWithProviders(<BuyButton bookId="book-1" />, {
      session: mockUserSession(),
    });

    await user.click(screen.getByRole("button", { name: /comprar agora/i }));
    expect(screen.getByRole("button", { name: /processando/i })).toBeDisabled();

    resolveFetch!({
      ok: true,
      status: 201,
      json: async () => ({ id: "order-1" }),
    } as Response);

    global.fetch = originalFetch;
  });
});
