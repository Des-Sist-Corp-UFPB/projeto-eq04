import { test, expect } from "@playwright/test";

test.describe("Fluxo completo da livraria", () => {
  test.skip(
    !process.env.E2E_ENABLED,
    "E2E requer banco seedado e E2E_ENABLED=true"
  );

  test("registrar, buscar livro e acessar catálogo", async ({ page }) => {
    await page.goto("/register");
    await page.getByPlaceholder("Digite seu nome").fill("E2E User");
    await page.getByPlaceholder("seu-email@exemplo.com").fill(`e2e-${Date.now()}@test.com`);
    await page.getByPlaceholder("Senha (mín. 6 caracteres)").fill("senha123");
    await page.getByRole("button", { name: /criar conta/i }).click();

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /catálogo/i })).toBeVisible();
    await page.getByPlaceholder(/buscar/i).fill("Fundação");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Fundação")).toBeVisible();
  });
});