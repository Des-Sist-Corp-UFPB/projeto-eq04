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
    expect(screen.getByRole("heading", { name: /criar conta/i })).toBeInTheDocument();
  });

  it("cadastra usuário e faz login automático", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    const user = userEvent.setup();

    renderWithProviders(<RegisterPage />);
    await user.type(screen.getByPlaceholderText(/seu nome/i), "Novo User");
    await user.type(screen.getByPlaceholderText(/seu e-mail/i), "novo@test.com");
    await user.type(screen.getByPlaceholderText(/sua senha/i), "senha123");
    await user.click(screen.getByRole("button", { name: /criar conta/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        "credentials",
        expect.objectContaining({ email: "novo@test.com" })
      );
    });
  });
});
