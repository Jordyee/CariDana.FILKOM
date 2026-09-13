import { env } from "cloudflare:workers";
import { applyD1Migrations } from "cloudflare:test";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, createSessionApi } from "../../src/app";
import {
  SessionService, SESSION_COOKIE, sessionCookie, clearSessionCookie,
  hashSessionToken, NORMAL_LIFETIME_MS, IDLE_TIMEOUT_MS, RESTRICTED_LIFETIME_MS,
} from "../../src/auth/session";
import { redactCredentialLogValue, REDACTED_AUTH_VALUE } from "../../src/logging/redaction";

const origin = "https://example.test";
const baseTime = 1_800_000_000_000;
const roles = ["coordinator", "deputy", "member", "officer", "treasurer"] as const;
let now = baseTime;
let effects = 0;
const service = () => new SessionService(env.TEST_DB, () => now);

async function account(role: typeof roles[number] = "coordinator", restricted = 0) {
  const id = `synthetic-${crypto.randomUUID()}`;
  await env.TEST_DB.prepare(`INSERT INTO accounts
    (id, username, role, password_hash, password_salt, password_version,
     password_parameters, active, must_change_password)
    VALUES (?, ?, ?, ?, ?, 1, '{"synthetic":true}', 1, ?)`)
    .bind(id, id, role, [1, 2, 3], [4, 5, 6], restricted).run();
  return id;
}
async function issue(id?: string) {
  return service().issue(id ?? await account(), 0);
}
function api() {
  const result = createSessionApi(() => now);
  // These handlers exist only in tests, never in the production Worker.
  result.get("/synthetic/read", (c) => c.json({ ok: true }));
  result.post("/synthetic/write", (c) => { effects++; return c.json({ ok: true }); });
  result.get("/synthetic/denied", (c) => c.json({ error: "Ditolak." }, 403));
  result.get("/synthetic/failure", () => { throw new Error("synthetic-private-error"); });
  return result;
}
async function request(path: string, token?: string, method = "GET", csrf?: string, requestOrigin: string | null = origin) {
  const headers = new Headers();
  if (token) headers.set("Cookie", `${SESSION_COOKIE}=${token}`);
  if (requestOrigin !== null) headers.set("Origin", requestOrigin);
  if (csrf !== undefined) headers.set("X-CSRF-Token", csrf);
  return api().request(`${origin}${path}`, { method, headers }, { ASSETS: env.ASSETS, DB: env.TEST_DB });
}
async function csrfFor(token: string) {
  const response = await request("/auth/csrf", token);
  expect(response.status).toBe(200);
  return (await response.json() as { csrfToken: string }).csrfToken;
}

describe("T009 server sessions", () => {
  beforeAll(async () => applyD1Migrations(env.TEST_DB, env.TEST_MIGRATIONS));
  beforeEach(() => { now = baseTime; effects = 0; });

  it("issues fresh opaque cookies and persists only token digests", async () => {
    const id = await account();
    const first = await issue(id);
    const second = await issue(id);
    expect(first !== null && second !== null).toBe(true);
    if (!first || !second) throw new Error("Synthetic issuance failed");
    expect(/^[a-f0-9]{64}$/.test(first.token)).toBe(true);
    expect(first.token === second.token).toBe(false);
    const stored = await env.TEST_DB.prepare("SELECT token_hash FROM sessions WHERE id = ?")
      .bind(first.id).first<{ token_hash: number[] }>();
    expect(JSON.stringify(stored?.token_hash) === JSON.stringify(Array.from(await hashSessionToken(first.token)))).toBe(true);
    expect(JSON.stringify(stored).includes(first.token)).toBe(false);
    const cookie = sessionCookie(first, now);
    for (const flag of ["Secure", "HttpOnly", "SameSite=Lax", "Path=/", "Max-Age=28800", "Expires="]) {
      expect(cookie.includes(flag)).toBe(true);
    }
    expect(cookie.includes("Domain=") || cookie.includes(id)).toBe(false);
    expect(clearSessionCookie().includes("Max-Age=0")).toBe(true);
    expect(first.expiresAt - now).toBe(NORMAL_LIFETIME_MS);
  });

  it.each(roles)("authenticates %s and denies missing, forged, duplicate and query tokens", async (role) => {
    const session = await issue(await account(role));
    if (!session) throw new Error("Synthetic issuance failed");
    expect((await request("/synthetic/read", session.token)).status).toBe(200);
    const absent = await request("/synthetic/read");
    const forged = await request("/synthetic/read", "a".repeat(64));
    expect(absent.status).toBe(401);
    expect(absent.headers.has("Set-Cookie")).toBe(false);
    expect(await forged.text()).toBe(await absent.text());
    const duplicate = await api().request(`${origin}/synthetic/read`, {
      headers: { Cookie: `${SESSION_COOKIE}=${session.token}; ${SESSION_COOKIE}=${session.token}` },
    }, { ASSETS: env.ASSETS, DB: env.TEST_DB });
    expect(duplicate.status).toBe(401);
    expect((await request(`/synthetic/read?session=${session.token}`)).status).toBe(401);
  });

  it("rejects missing, malformed, cross-session and cross-origin CSRF before effects", async () => {
    const first = await issue(); const other = await issue();
    if (!first || !other) throw new Error("Synthetic issuance failed");
    const csrf = await csrfFor(first.token); const otherCsrf = await csrfFor(other.token);
    for (const value of [undefined, "invalid", otherCsrf]) {
      expect((await request("/synthetic/write", first.token, "POST", value)).status).toBe(403);
    }
    for (const value of [null, "null", "https://foreign.example.test", "http://example.test", `${origin}:444`]) {
      expect((await request("/synthetic/write", first.token, "POST", csrf, value)).status).toBe(403);
    }
    expect(effects).toBe(0);
    expect((await request("/synthetic/write", first.token, "POST", csrf)).status).toBe(200);
    expect(effects).toBe(1);
  });

  it("enforces idle boundaries and never refreshes on denied requests", async () => {
    const session = await issue(); if (!session) throw new Error("Synthetic issuance failed");
    now += IDLE_TIMEOUT_MS - 1;
    expect((await request("/synthetic/denied", session.token)).status).toBe(403);
    expect((await request("/synthetic/write", session.token, "POST")).status).toBe(403);
    now++;
    expect((await request("/synthetic/read", session.token)).status).toBe(401);
    expect(await service().resolve(session.token)).toBeNull();
  });

  it("refreshes idle time on success without extending the absolute deadline", async () => {
    const session = await issue(); if (!session) throw new Error("Synthetic issuance failed");
    for (now = baseTime + 600_000; now < session.expiresAt; now += 600_000) {
      expect((await request("/synthetic/read", session.token)).status).toBe(200);
    }
    now = session.expiresAt;
    expect((await request("/synthetic/read", session.token)).status).toBe(401);
  });

  it.each(roles)("restricts forced-change %s sessions irreversibly", async (role) => {
    const id = await account(role, 1); const session = await issue(id);
    if (!session) throw new Error("Synthetic issuance failed");
    expect(session.expiresAt - now).toBe(RESTRICTED_LIFETIME_MS);
    const csrf = await csrfFor(session.token);
    expect((await request("/synthetic/read", session.token)).status).toBe(401);
    expect((await request("/synthetic/write", session.token, "POST", csrf)).status).toBe(401);
    await env.TEST_DB.prepare("UPDATE accounts SET must_change_password = 0 WHERE id = ?").bind(id).run();
    expect((await request("/synthetic/read", session.token)).status).toBe(401);
    expect(effects).toBe(0);
  });

  it("expires restricted sessions at ten minutes and allows protected logout before then", async () => {
    const expired = await issue(await account("member", 1));
    const live = await issue(await account("member", 1));
    if (!expired || !live) throw new Error("Synthetic issuance failed");
    const csrf = await csrfFor(live.token);
    expect((await request("/auth/logout", live.token, "POST", csrf)).status).toBe(204);
    now += RESTRICTED_LIFETIME_MS;
    expect((await request("/auth/csrf", expired.token)).status).toBe(401);
  });

  it("logout is CSRF-protected, clears its cookie and prevents replay without revoking another session", async () => {
    const id = await account(); const first = await issue(id); const other = await issue(id);
    if (!first || !other) throw new Error("Synthetic issuance failed");
    expect((await request("/auth/logout", first.token, "POST")).status).toBe(403);
    expect((await request("/synthetic/read", first.token)).status).toBe(200);
    const response = await request("/auth/logout", first.token, "POST", await csrfFor(first.token));
    expect(response.status).toBe(204);
    expect(response.headers.get("Set-Cookie")).toBe(clearSessionCookie());
    expect((await request("/synthetic/read", first.token)).status).toBe(401);
    expect((await request("/synthetic/read", other.token)).status).toBe(200);
    expect((await request("/auth/logout", first.token, "POST", "invalid")).status).toBe(401);
  });

  it.each(["deactivate", "reset", "invalidate"])("revokes every account session on %s and rejects stale issuance", async (action) => {
    const id = await account(); const first = await issue(id); const other = await issue(id);
    const unaffected = await issue();
    if (!first || !other || !unaffected) throw new Error("Synthetic issuance failed");
    if (action === "deactivate") {
      await env.TEST_DB.prepare("UPDATE accounts SET active = 0 WHERE id = ?").bind(id).run();
      await env.TEST_DB.prepare("UPDATE accounts SET active = 1 WHERE id = ?").bind(id).run();
    } else if (action === "reset") {
      await env.TEST_DB.prepare("UPDATE accounts SET password_hash = ?, must_change_password = 1 WHERE id = ?").bind([8, 9], id).run();
    } else await service().invalidateAccount(id);
    expect(await service().issue(id, 0)).toBeNull();
    for (const session of [first, other]) expect((await request("/synthetic/read", session.token)).status).toBe(401);
    expect((await request("/synthetic/read", unaffected.token)).status).toBe(200);
  });

  it("cannot refresh or resurrect a session after concurrent invalidation", async () => {
    const id = await account(); const session = await issue(id);
    if (!session) throw new Error("Synthetic issuance failed");
    const resolved = await service().resolve(session.token);
    if (!resolved) throw new Error("Synthetic resolution failed");
    now += 1000;
    await Promise.all([service().touch(resolved.id), service().invalidateAccount(id)]);
    expect(await service().touch(resolved.id)).toBe(false);
    expect(await service().resolve(session.token)).toBeNull();
  });

  it("fails closed for absent bindings, unknown API routes and private exceptions", async () => {
    const app = createApp(() => now);
    expect((await app.request(`${origin}/api/auth/csrf`, {}, { ASSETS: env.ASSETS })).status).toBe(401);
    expect((await app.request(`${origin}/api/unregistered`, {}, { ASSETS: env.ASSETS, DB: env.TEST_DB })).status).toBe(401);
    const session = await issue(); if (!session) throw new Error("Synthetic issuance failed");
    const logger = vi.spyOn(console, "error");
    const response = await request("/synthetic/failure", session.token);
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("synthetic-private-error");
    expect(logger).not.toHaveBeenCalled();
    logger.mockRestore();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect((await request("/auth/csrf", session.token)).headers.get("Cache-Control")).toBe("no-store");
  });

  it("redacts session and CSRF diagnostics", () => {
    for (const key of ["token", "csrfToken", "Cookie", "Set-Cookie", "Authorization", "sessionToken", "token_hash"]) {
      expect(redactCredentialLogValue({ [key]: "synthetic-sensitive" })).toEqual({ [key]: REDACTED_AUTH_VALUE });
    }
  });

  it("uses the production router for CSRF/logout and never serves test handlers", async () => {
    const session = await issue(); if (!session) throw new Error("Synthetic issuance failed");
    const app = createApp(() => now);
    const bindings = { ASSETS: env.ASSETS, DB: env.TEST_DB };
    const headers = { Cookie: `${SESSION_COOKIE}=${session.token}` };
    const response = await app.request(`${origin}/api/auth/csrf`, { headers }, bindings);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const data = await response.json() as { csrfToken: string };
    for (const path of ["/api/synthetic/read", "/api/auth/login", "/api/auth/unknown", "/api", "/api/"]) {
      expect((await app.request(`${origin}${path}`, { headers }, bindings)).status).toBe(404);
    }
    const denied = await app.request(`${origin}/api/auth/logout`, {
      method: "POST", headers: { ...headers, Origin: origin, "X-CSRF-Token": data.csrfToken, "Sec-Fetch-Site": "cross-site" },
    }, bindings);
    expect(denied.status).toBe(403);
    const logout = await app.request(`${origin}/api/auth/logout`, {
      method: "POST", headers: { ...headers, Origin: origin, "X-CSRF-Token": data.csrfToken },
    }, bindings);
    expect(logout.status).toBe(204);
    expect(logout.headers.get("Set-Cookie")).toBe(clearSessionCookie());
  });

  it("denies inactive/nonexistent/stale issuance and accepts only the current generation", async () => {
    const id = await account();
    expect(await service().issue("synthetic-absent", 0)).toBeNull();
    expect(await service().issue(id, -1)).toBeNull();
    expect(await service().issue(id, 0.5)).toBeNull();
    await env.TEST_DB.prepare("UPDATE accounts SET active = 0 WHERE id = ?").bind(id).run();
    expect(await service().issue(id, 1)).toBeNull();
    await env.TEST_DB.prepare("UPDATE accounts SET active = 1 WHERE id = ?").bind(id).run();
    expect(await service().issue(id, 1)).toBeNull();
    expect(await service().issue(id, 2) !== null).toBe(true);
  });

  it("does not accept the CSRF token as authentication or expose a transport exception", async () => {
    const session = await issue(); if (!session) throw new Error("Synthetic issuance failed");
    const csrf = await csrfFor(session.token);
    expect((await request("/synthetic/read", csrf)).status).toBe(401);
    for (const token of ["%61".repeat(32), session.token.toUpperCase(), `${session.token}extra`]) {
      expect((await request("/synthetic/read", token)).status).toBe(401);
    }
    const response = await api().request("http://example.test/synthetic/read", {
      headers: { Cookie: `${SESSION_COOKIE}=${session.token}` },
    }, { ASSETS: env.ASSETS, DB: env.TEST_DB });
    expect(response.status).toBe(401);
  });

  it("does not clear the browser cookie on cross-site requests that omit it", async () => {
    const response = await api().request(`${origin}/auth/logout`, {
      method: "POST", headers: { Origin: "https://foreign.example.test", "Sec-Fetch-Site": "cross-site" },
    }, { ASSETS: env.ASSETS, DB: env.TEST_DB });
    expect(response.status).toBe(401);
    expect(response.headers.has("Set-Cookie")).toBe(false);
  });
});
