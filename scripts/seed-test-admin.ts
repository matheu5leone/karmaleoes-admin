/**
 * Cria um admin DESCARTÁVEL para testes e2e (não-idempotente).
 * Uso (dentro do container, que tem service-role):
 *   docker compose run --rm --no-deps \
 *     -e TEST_ADMIN_EMAIL=... -e TEST_ADMIN_PASSWORD=... web node scripts/seed-test-admin.ts
 * Remover depois (MCP/SQL): delete from auth.users where email = '<email>'.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.TEST_ADMIN_EMAIL;
const password = process.env.TEST_ADMIN_PASSWORD;

if (!url || !key || !email || !password) {
  console.error("Faltam envs (URL/SERVICE_ROLE/TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD).");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (error || !data.user) {
  console.error("Erro ao criar auth user:", error?.message);
  process.exit(1);
}

const { error: insErr } = await admin.from("admin_user").insert({
  id: data.user.id,
  email,
  status: "ativo",
  two_factor_configured: false,
});
if (insErr) {
  console.error("Erro ao inserir admin_user:", insErr.message);
  await admin.auth.admin.deleteUser(data.user.id);
  process.exit(1);
}

console.log(`TEST_ADMIN_CREATED ${data.user.id}`);
process.exit(0);
