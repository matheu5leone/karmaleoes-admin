/**
 * Bootstrap do 1º usuário administrativo (RN-LOGIN-006).
 * IDEMPOTENTE: só cria quando NÃO existe nenhum admin_user. Após truncate dos
 * dados, volta a valer — o cliente cria a primeira conta de novo.
 *
 * Uso: `node scripts/seed-admin.ts` com env carregado (ex.: dentro do container:
 *   docker compose exec web node scripts/seed-admin.ts).
 * Requer: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEED_ADMIN_EMAIL,
 *         SEED_ADMIN_TEMP_PASSWORD.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_TEMP_PASSWORD;

if (!url || !serviceKey) {
  console.error(
    "Faltam variáveis: NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}
if (!email || !password) {
  console.error(
    "Faltam variáveis: SEED_ADMIN_EMAIL e/ou SEED_ADMIN_TEMP_PASSWORD.",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Idempotência: aborta se já houver qualquer admin.
const { count, error: countErr } = await admin
  .from("admin_user")
  .select("id", { count: "exact", head: true });

if (countErr) {
  console.error("Erro ao consultar admin_user:", countErr.message);
  process.exit(1);
}
if ((count ?? 0) > 0) {
  console.log(`Já existe ${count} admin(s). Nada a fazer (idempotente).`);
  process.exit(0);
}

// Cria o usuário no Supabase Auth (e-mail já confirmado).
const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (createErr || !created?.user) {
  console.error("Erro ao criar auth user:", createErr?.message);
  process.exit(1);
}

// Vincula a linha admin_user (2FA será configurado no 1º login).
const { error: insErr } = await admin.from("admin_user").insert({
  id: created.user.id,
  email,
  status: "ativo",
  two_factor_configured: false,
});

if (insErr) {
  console.error("Erro ao inserir admin_user:", insErr.message);
  // rollback do auth user para não deixar órfão
  await admin.auth.admin.deleteUser(created.user.id);
  process.exit(1);
}

console.log(
  `1º admin criado: ${email} (id ${created.user.id}). Senha temporária definida; configure o TOTP no 1º login.`,
);
process.exit(0);
