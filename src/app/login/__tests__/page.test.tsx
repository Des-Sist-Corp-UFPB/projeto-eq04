/**
 * @jest-environment jsdom
 */
import "@/__tests__/setup/component-setup";
import { renderWithProviders, screen, userEvent, waitFor, mockSignIn } from "@/__tests__/utils/test-utils";
import LoginPage from "@/app/login/page";

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

describe("LoginPage (/login)", () => {
  beforeEach(() => {
    mockSignIn.mockReset();
    mockPush.mockReset();
  });

  it("renderiza formulário de login", () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole("heading", { name: /entrar na sua conta/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^senha$/i)).toBeInTheDocument();
  });

  it("exibe erro com credenciais inválidas", async () => {
    mockSignIn.mockResolvedValue({ error: "CredentialsSignin" });
    const user = userEvent.setup();

    renderWithProviders(<LoginPage />);
    await user.type(screen.getByLabelText(/e-mail/i), "errado@test.com");
    await user.type(screen.getByLabelText(/^senha$/i), "senhaerrada");
    await user.click(screen.getByRole("button", { name: /^entrar$/i }));

    await waitFor(() => {
      expect(screen.getByText(/e-mail ou senha inválidos/i)).toBeInTheDocument();
    });
  });

  it("redireciona após login bem-sucedido", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    const user = userEvent.setup();

    renderWithProviders(<LoginPage />);
    await user.type(screen.getByLabelText(/e-mail/i), "demo@test.com");
    await user.type(screen.getByLabelText(/^senha$/i), "senha123");
    await user.click(screen.getByRole("button", { name: /^entrar$/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("permite alternar visibilidade da senha", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const passwordInput = screen.getByLabelText(/^senha$/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /mostrar senha/i }));
    expect(passwordInput).toHaveAttribute("type", "text");
  });
});
