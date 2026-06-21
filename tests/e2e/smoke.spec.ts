import { test, expect } from "@playwright/test";

test("raiz redireciona para /login quando não autenticado", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
});

test("rota /login carrega", async ({ page }) => {
  const response = await page.goto("/login");
  expect(response?.status()).toBeLessThan(400);
  await expect(page.getByRole("heading", { name: /entrar/i })).toBeVisible();
});

test("rota protegida (admin) redireciona para /login sem sessão", async ({
  page,
}) => {
  await page.goto("/usuarios");
  await expect(page).toHaveURL(/\/login/);
});
