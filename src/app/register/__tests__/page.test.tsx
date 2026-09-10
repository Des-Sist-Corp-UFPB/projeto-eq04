/**
 * @jest-environment jsdom
 */
import "@/__tests__/setup/component-setup";
import { renderWithProviders, screen, userEvent, waitFor, mockSignIn } from "@/__tests__/utils/test-utils";
import RegisterPage from "@/app/register/page";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: jest.fn() }),
}));

describe("RegisterPage (/register)", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSignIn.mockReset();
  });

  it("renderiza formulário de cadastro", () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByRole("heading", { name: /criar uma conta/i })).toBeInTheDocument();
  });

  it("cadastra usuário e faz login automático", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    const user = userEvent.setup();

    renderWithProviders(<RegisterPage />);
    await user.type(screen.getByLabelText(/nome completo/i), "Novo User");
    await user.type(screen.getByLabelText(/^e-mail$/i), "novo@test.com");
    await user.type(screen.getByLabelText(/^senha$/i), "senha123");

    await user.click(screen.getByRole("button", { name: /mostrar senha/i }));
    expect(screen.getByLabelText(/^senha$/i)).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /ocultar senha/i }));
    expect(screen.getByLabelText(/^senha$/i)).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /criar conta/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        "credentials",
        expect.objectContaining({ email: "novo@test.com" })
      );
    });
  });

  it("exibe mensagem de erro quando o cadastro falha", async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "E-mail já cadastrado" }),
    } as Response);

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/nome completo/i), "Novo User");
    await user.type(screen.getByLabelText(/^e-mail$/i), "duplicado@test.com");
    await user.type(screen.getByLabelText(/^senha$/i), "senha123");
    await user.click(screen.getByRole("button", { name: /criar conta/i }));

    await waitFor(() => {
      expect(screen.getByText("E-mail já cadastrado")).toBeInTheDocument();
    });

    global.fetch = originalFetch;
  });
});
