import { test, expect, type Page } from "@playwright/test";
import { authenticator } from "otplib";

const EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@karmaleoes.com";
const SENHA = process.env.SEED_ADMIN_TEMP_PASSWORD ?? "KarmaLeoes#Temp2026";

// PNG 1x1 (transparente) para o upload.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
  "base64",
);

async function criarBanner(page: Page, nome: string): Promise<string> {
  await page.goto("/banners");
  await page.getByRole("button", { name: "Novo banner" }).click();
  await page.getByLabel("Nome (interno)").fill(nome);
  await page.setInputFiles('input[type="file"]', {
    name: "b.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await expect(page.locator("form img")).toBeVisible();
  await page.getByRole("button", { name: "Salvar" }).click();
  await page.waitForURL(/\/banners\/[0-9a-f-]{36}/);
  return page.url();
}

test("banners: publicação por tela com auto-revert (1 por tela)", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const ts = Date.now();
  const telaNome = `E2E Tela ${ts}`;

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

  // tela habilitada
  await page.goto("/telas");
  await page.getByRole("button", { name: "Nova tela" }).click();
  await page.getByLabel("Nome", { exact: true }).fill(telaNome);
  await page.getByLabel("Rota", { exact: true }).fill(`/e2e-${ts}`);
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText(telaNome)).toBeVisible();

  // Banner A → associar + publicar
  const urlA = await criarBanner(page, `Banner A ${ts}`);
  const rowA = page.locator("tr", { hasText: telaNome });
  await rowA.getByRole("button", { name: "Associar" }).click();
  await rowA.getByRole("button", { name: "Publicar" }).click();
  await expect(rowA).toContainText("publicado");

  // Banner B → associar + publicar na MESMA tela
  await criarBanner(page, `Banner B ${ts}`);
  const rowB = page.locator("tr", { hasText: telaNome });
  await rowB.getByRole("button", { name: "Associar" }).click();
  await rowB.getByRole("button", { name: "Publicar" }).click();
  await expect(rowB).toContainText("publicado");

  // Banner A deve ter sido rebaixado para draft (auto-revert)
  await page.goto(urlA);
  const rowAagain = page.locator("tr", { hasText: telaNome });
  await expect(rowAagain).toContainText("draft");
});
