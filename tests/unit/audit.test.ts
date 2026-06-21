import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn(async () => ({ error: null }));
const getUser = vi.fn(async () => ({ data: { user: { id: "user-123" } } }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    from: vi.fn(() => ({ insert })),
  })),
}));

import { audit } from "@/lib/audit";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("audit", () => {
  it("insere log com o usuário da sessão e os campos normalizados", async () => {
    await audit({ acao: "create", entidade: "tela", registroId: "rec-1" });
    expect(insert).toHaveBeenCalledWith({
      user_id: "user-123",
      acao: "create",
      entidade: "tela",
      registro_id: "rec-1",
      diff: null,
    });
  });

  it("usa null para registro/diff quando ausentes", async () => {
    await audit({ acao: "delete", entidade: "banner" });
    expect(insert).toHaveBeenCalledWith({
      user_id: "user-123",
      acao: "delete",
      entidade: "banner",
      registro_id: null,
      diff: null,
    });
  });

  it("registra user_id null quando não há usuário autenticado", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } } as never);
    await audit({ acao: "update", entidade: "evento", registroId: "e-1" });
    expect(insert).toHaveBeenCalledWith({
      user_id: null,
      acao: "update",
      entidade: "evento",
      registro_id: "e-1",
      diff: null,
    });
  });
});
