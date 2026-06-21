import { test, expect, type Page } from "@playwright/test";
import { authenticator } from "otplib";

const EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@karmaleoes.com";
const SENHA = process.env.SEED_ADMIN_TEMP_PASSWORD ?? "KarmaLeoes#Temp2026";

async function novoEvento(page: Page, nome: string, data: string) {
  await page.goto("/eventos");
  await page.getByRole("button", { name: "Novo evento" }).click();
  await page.getByLabel("Nome").fill(nome);
  await page.getByLabel("Data", { exact: true }).fill(data);
  await page.getByLabel("Status", { exact: true }).selectOption({
    label: "Ingressos a venda",
  });
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.locator("tr", { hasText: nome })).toBeVisible({
    timeout: 15000,
  });
}

test("eventos: criação, encerramento (regras de data) e expiração", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const ts = Date.now();
  const futuro = `EVT Futuro ${ts}`;
  const passado = `EVT Passado ${ts}`;

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

  // Evento futuro
  await novoEvento(page, futuro, "2035-06-01");
  const rowF = page.locator("tr", { hasText: futuro });
  await expect(rowF).toContainText("Ingressos a venda");

  // Encerrar: Sucesso antes da data → bloqueado
  await rowF.getByRole("button", { name: "Encerrar" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Status de encerramento").selectOption({ label: "Sucesso" });
  await dialog.getByLabel("Observação (obrigatória)").fill("tentativa");
  await dialog.getByRole("button", { name: "Encerrar" }).click();
  await expect(page.getByText(/Sucesso só é permitido/)).toBeVisible();

  // Encerrar como Cancelado → permitido
  await dialog.getByLabel("Status de encerramento").selectOption({ label: "Cancelado" });
  await dialog.getByRole("button", { name: "Encerrar" }).click();
  await expect(page.locator("tr", { hasText: futuro })).toContainText("Cancelado");

  // Evento com data passada → status_efetivo "Expirado"
  await novoEvento(page, passado, "2020-06-01");
  await expect(page.locator("tr", { hasText: passado })).toContainText("Expirado");
});
