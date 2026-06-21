import { test, expect } from "@playwright/test";
import { authenticator } from "otplib";

const EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@karmaleoes.com";
const SENHA = process.env.SEED_ADMIN_TEMP_PASSWORD ?? "KarmaLeoes#Temp2026";

// Login com 1º acesso (enroll TOTP). O admin está pristine entre execuções
// (o teste limpa via MCP ao final, fora do Playwright).
test("telas + marquees: CRUD e item interno (tela habilitada)", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const ts = Date.now();
  const telaNome = `E2E Tela ${ts}`;
  const telaRota = `/e2e-${ts}`;
  const marqueeNome = `E2E Marquee ${ts}`;

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

  // Telas: criar
  await page.goto("/telas");
  await page.getByRole("button", { name: "Nova tela" }).click();
  await page.getByLabel("Nome", { exact: true }).fill(telaNome);
  await page.getByLabel("Rota", { exact: true }).fill(telaRota);
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText(telaNome)).toBeVisible();

  // Marquees: criar → detalhe
  await page.goto("/marquees");
  await page.getByRole("button", { name: "Novo marquee" }).click();
  await page.getByLabel("Nome", { exact: true }).fill(marqueeNome);
  await page.getByRole("button", { name: "Criar" }).click();
  await page.waitForURL(/\/marquees\/[0-9a-f-]{36}/);

  // Associar a tela criada
  await page.locator("label", { hasText: telaNome }).click();
  await page.getByRole("button", { name: "Salvar telas" }).click();
  await expect(page.getByText("Associações salvas.")).toBeVisible();

  // Adicionar item interno apontando para a tela habilitada
  await page.getByRole("button", { name: "Adicionar item" }).click();
  await page.getByLabel("Título").fill("E2E Item");
  await page.getByLabel(/Tela de destino/).selectOption({ label: telaNome });
  await page.getByRole("button", { name: "Salvar item" }).click();
  await expect(page.getByText("E2E Item")).toBeVisible();
});
