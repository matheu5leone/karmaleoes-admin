import { test, expect, type Page } from "@playwright/test";
import { authenticator } from "otplib";

// Credenciais do 1º admin (bootstrap). A senha é a temporária local de dev.
const EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@karmaleoes.com";
const SENHA = process.env.SEED_ADMIN_TEMP_PASSWORD ?? "KarmaLeoes#Temp2026";

// Garante um código TOTP de uma JANELA NOVA (evita rejeição por reuso).
async function freshCode(secret: string): Promise<string> {
  const remaining = authenticator.timeRemaining();
  await new Promise((r) => setTimeout(r, (remaining + 1) * 1000));
  return authenticator.generate(secret);
}

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(EMAIL);
  await page.getByLabel("Senha").fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
}

test("autenticação: 1º acesso (enroll), challenge e sessão única", async ({
  browser,
}) => {
  test.setTimeout(180_000);

  const ctxA = await browser.newContext();
  const a = await ctxA.newPage();

  // 1) 1º acesso: login → enroll TOTP → admin
  await login(a);
  await a.waitForURL("**/configurar-2fa");
  const secret = (await a.getByTestId("totp-secret").textContent())!.trim();
  await a.getByLabel("Código TOTP").fill(authenticator.generate(secret));
  await a.getByRole("button", { name: "Ativar 2FA" }).click();
  await a.waitForURL("**/usuarios");
  await expect(a.getByRole("heading", { name: "Usuários" })).toBeVisible();

  // 2) Logout → login de novo → challenge TOTP
  await a.getByRole("button", { name: "Sair" }).click();
  await a.waitForURL("**/login");
  await login(a);
  await expect(a.getByLabel("Código TOTP")).toBeVisible();
  await a.getByLabel("Código TOTP").fill(await freshCode(secret));
  await a.getByRole("button", { name: "Verificar" }).click();
  await a.waitForURL("**/usuarios");

  // 3) Sessão única: login em contexto B invalida a sessão de A
  const ctxB = await browser.newContext();
  const b = await ctxB.newPage();
  await login(b);
  await expect(b.getByLabel("Código TOTP")).toBeVisible();
  await b.getByLabel("Código TOTP").fill(await freshCode(secret));
  await b.getByRole("button", { name: "Verificar" }).click();
  await b.waitForURL("**/usuarios");

  // A deve ser expulso ao navegar (sessão sobrescrita no Redis)
  await a.goto("/usuarios");
  await a.waitForURL("**/login");

  await ctxA.close();
  await ctxB.close();
});
