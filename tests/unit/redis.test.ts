import { beforeEach, describe, expect, it, vi } from "vitest";

// Fake in-memory do client Upstash, com suporte a TTL/expire.
const store = new Map<string, { value: unknown; ex?: number }>();
const fake = {
  set: vi.fn(async (key: string, value: unknown, opts?: { ex?: number }) => {
    store.set(key, { value, ex: opts?.ex });
  }),
  get: vi.fn(async (key: string) => store.get(key)?.value ?? null),
  del: vi.fn(async (key: string) => {
    store.delete(key);
  }),
  expire: vi.fn(async (key: string, ex: number) => {
    const e = store.get(key);
    if (e) e.ex = ex;
  }),
};

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(() => fake),
}));

import {
  getSession,
  invalidateSession,
  isCurrentSession,
  sessionKey,
  setSession,
  touchSession,
} from "@/lib/redis";

beforeEach(() => {
  store.clear();
  vi.clearAllMocks();
});

describe("sessionKey", () => {
  it("monta a chave por usuário", () => {
    expect(sessionKey("u1")).toBe("session:u1");
  });
});

describe("sessão única", () => {
  it("setSession grava com TTL e getSession lê o valor", async () => {
    await setSession("u1", "sess-A", 1800);
    expect(fake.set).toHaveBeenCalledWith("session:u1", "sess-A", { ex: 1800 });
    expect(await getSession("u1")).toBe("sess-A");
  });

  it("novo login sobrescreve a sessão anterior", async () => {
    await setSession("u1", "sess-A");
    await setSession("u1", "sess-B");
    expect(await getSession("u1")).toBe("sess-B");
  });

  it("invalidateSession remove a sessão", async () => {
    await setSession("u1", "sess-A");
    await invalidateSession("u1");
    expect(await getSession("u1")).toBeNull();
  });

  it("isCurrentSession compara com a sessão ativa", async () => {
    await setSession("u1", "sess-A");
    expect(await isCurrentSession("u1", "sess-A")).toBe(true);
    expect(await isCurrentSession("u1", "sess-B")).toBe(false);
    await invalidateSession("u1");
    expect(await isCurrentSession("u1", "sess-A")).toBe(false);
  });

  it("touchSession renova o TTL de inatividade", async () => {
    await setSession("u1", "sess-A", 1800);
    await touchSession("u1", 900);
    expect(fake.expire).toHaveBeenCalledWith("session:u1", 900);
  });
});
