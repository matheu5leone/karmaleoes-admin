import { test, expect } from "@playwright/test";
import { authenticator } from "otplib";

const EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@karmaleoes.com";
const SENHA = process.env.SEED_ADMIN_TEMP_PASSWORD ?? "KarmaLeoes#Temp2026";

test("obras: coleção, música (N:1), vínculo (N:N) e link de plataforma", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const ts = Date.now();
  const colab = `E2E Colab ${ts}`;
  const role = `E2E Role ${ts}`;
  const colecao = `E2E Colecao ${ts}`;
  const musica = `E2E Musica ${ts}`;

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

  // colaborador
  await page.goto("/obras/colaboradores");
  await page.getByRole("button", { name: "Novo colaborador" }).click();
  await page.getByLabel("Nome").fill(colab);
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.locator("tr", { hasText: colab })).toBeVisible({ timeout: 15000 });

  // role
  await page.goto("/obras/roles");
  await page.getByRole("button", { name: "Novo papel" }).click();
  await page.getByLabel("Nome").fill(role);
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.locator("tr", { hasText: role })).toBeVisible({ timeout: 15000 });

  // coleção
  await page.goto("/obras");
  await page.getByRole("button", { name: "Nova coleção" }).click();
  await page.getByLabel("Nome").fill(colecao);
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.locator("tr", { hasText: colecao })).toBeVisible({ timeout: 15000 });

  // música vinculada à coleção (N:1)
  await page.getByRole("button", { name: "Nova música" }).click();
  await page.getByLabel("Nome").fill(musica);
  await page.getByLabel("Coleção", { exact: true }).selectOption({ label: colecao });
  await page.getByRole("button", { name: "Salvar" }).click();
  const rowM = page.locator("tr", { hasText: musica });
  await expect(rowM).toBeVisible({ timeout: 15000 });
  await expect(rowM).toContainText(colecao);

  // detalhe da música → vínculo (N:N) + link
  await rowM.getByRole("link", { name: "Gerenciar" }).click();
  await page.waitForURL(/\/obras\/musica\/[0-9a-f-]{36}/);

  const secColab = page.locator("section", { hasText: "Colaboradores" });
  await secColab.locator("select").nth(0).selectOption({ label: colab });
  await secColab.locator("select").nth(1).selectOption({ label: role });
  await secColab.getByRole("button", { name: "Adicionar" }).click();
  await expect(secColab.locator("li", { hasText: colab })).toBeVisible({
    timeout: 15000,
  });

  const secLink = page.locator("section", { hasText: "Links de plataforma" });
  await secLink.getByPlaceholder("Spotify").fill("Spotify");
  await secLink.getByPlaceholder("https://…").fill("https://open.spotify.com/x");
  await secLink.getByRole("button", { name: "Adicionar" }).click();
  await expect(secLink.locator("li", { hasText: "Spotify" })).toBeVisible({
    timeout: 15000,
  });
});
