import { test, expect } from "@playwright/test";
import { authenticator } from "otplib";

const EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@karmaleoes.com";
const SENHA = process.env.SEED_ADMIN_TEMP_PASSWORD ?? "KarmaLeoes#Temp2026";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
  "base64",
);

test("conteúdos: categoria + CRUD com thumbnail e status", async ({ page }) => {
  test.setTimeout(120_000);
  const ts = Date.now();
  const cat = `E2E Cat ${ts}`;
  const titulo = `E2E Conteudo ${ts}`;

  // login → enroll
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(EMAIL);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/configurar-2fa");
  const secret = (await page.getByTestId("totp-secret").textContent())!.trim();
  await page.getByLabel("Código TOTP").fill(authenticator.generate(secret));
  await page.getByRole("button", { name: "Ativar 2FA" }).click();
  await page.waitForURL("**/usuarios");

  // categoria
  await page.goto("/conteudos/categorias");
  await page.getByRole("button", { name: "Nova categoria" }).click();
  await page.getByLabel("Nome").fill(cat);
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.locator("tr", { hasText: cat })).toBeVisible({ timeout: 15000 });

  // conteúdo (upload + categoria + publicado)
  await page.goto("/conteudos");
  await page.getByRole("button", { name: "Novo conteúdo" }).click();
  await page.getByLabel("Título").fill(titulo);
  await page.setInputFiles('input[type="file"]', {
    name: "t.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await expect(page.locator("form img")).toBeVisible();
  await page.getByLabel("Categoria", { exact: true }).selectOption({ label: cat });
  await page.getByLabel("Link (externo)").fill("https://youtu.be/abc");
  await page.getByLabel("Status", { exact: true }).selectOption({ label: "publicado" });
  await page.getByRole("button", { name: "Salvar" }).click();

  const row = page.locator("tr", { hasText: titulo });
  await expect(row).toBeVisible({ timeout: 15000 });
  await expect(row).toContainText("publicado");
  await expect(row).toContainText(cat);

  // excluir
  await row.getByRole("button", { name: "Excluir" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Excluir" }).click();
  await expect(page.locator("tr", { hasText: titulo })).toHaveCount(0, {
    timeout: 15000,
  });
});
