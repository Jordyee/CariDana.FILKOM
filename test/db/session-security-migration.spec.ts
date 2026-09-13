import { env } from "cloudflare:workers";
import { applyD1Migrations } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { SessionService } from "../../src/auth/session";

const time = 1_800_000_000_000;
async function seed(db: D1Database) {
  const id = `synthetic-${crypto.randomUUID()}`;
  await db.prepare(`INSERT INTO accounts (id, username, role, password_hash, password_salt,
    password_version, password_parameters, active, must_change_password)
    VALUES (?, ?, 'coordinator', ?, ?, 1, '{"synthetic":true}', 1, 0)`)
    .bind(id, id, [1, 2, 3], [4, 5, 6]).run();
  return id;
}
async function version(db: D1Database, id: string) {
  return db.prepare("SELECT session_version FROM accounts WHERE id = ?").bind(id).first<number>("session_version");
}

describe("T009 session security migration", () => {
  beforeAll(async () => applyD1Migrations(env.TEST_DB, env.TEST_MIGRATIONS));

  it("enforces immutable metadata, monotonic time/version and one-way revocation", async () => {
    const id = await seed(env.TEST_DB);
    const service = new SessionService(env.TEST_DB, () => time);
    const session = await service.issue(id, 0);
    if (!session) throw new Error("Synthetic issuance failed");
    const updates = [
      "UPDATE session_security SET restricted = 1 WHERE session_id = ?",
      "UPDATE session_security SET account_version = 1 WHERE session_id = ?",
      "UPDATE session_security SET last_seen_at = -1 WHERE session_id = ?",
      `UPDATE session_security SET last_seen_at = ${time + 900000} WHERE session_id = ?`,
      "UPDATE sessions SET expires_at = expires_at + 1 WHERE id = ?",
      "UPDATE sessions SET token_hash = x'01' WHERE id = ?",
    ];
    for (const sql of updates) await expect(env.TEST_DB.prepare(sql).bind(session.id).run()).rejects.toThrow(/constraint/i);
    await expect(env.TEST_DB.prepare("UPDATE accounts SET session_version = -1 WHERE id = ?").bind(id).run()).rejects.toThrow(/constraint/i);
    await service.revoke(session.id);
    await expect(env.TEST_DB.prepare("UPDATE sessions SET revoked_at = NULL WHERE id = ?").bind(session.id).run()).rejects.toThrow(/constraint/i);
    expect(await service.touch(session.id)).toBe(false);
  });

  it("requires valid metadata and rejects orphan, mismatched or oversized session lifetimes", async () => {
    const id = await seed(env.TEST_DB);
    const sid = crypto.randomUUID();
    await expect(env.TEST_DB.prepare("INSERT INTO session_security VALUES (?, 0, 0, ?)").bind(sid, time).run()).rejects.toThrow(/constraint/i);
    await env.TEST_DB.prepare("INSERT INTO sessions (id, account_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)")
      .bind(sid, id, crypto.getRandomValues(new Uint8Array(32)), time, time + 28_800_001).run();
    await expect(env.TEST_DB.prepare("INSERT INTO session_security VALUES (?, 0, 0, ?)").bind(sid, time).run()).rejects.toThrow(/constraint/i);
    await env.TEST_DB.prepare("UPDATE sessions SET expires_at = ? WHERE id = ?").bind(time + 28_800_000, sid).run();
    await expect(env.TEST_DB.prepare("INSERT INTO session_security VALUES (?, 0, 1, ?)").bind(sid, time).run()).rejects.toThrow(/constraint/i);
    await expect(env.TEST_DB.prepare("INSERT INTO session_security VALUES (?, 1, 0, ?)").bind(sid, time).run()).rejects.toThrow(/constraint/i);
    await env.TEST_DB.prepare("INSERT INTO session_security VALUES (?, 0, 0, ?)").bind(sid, time).run();
    const tables = await env.TEST_DB.prepare("PRAGMA table_list").all<{ name: string; strict: number }>();
    expect(tables.results.find((row) => row.name === "session_security")?.strict).toBe(1);
    const plan = await env.TEST_DB.prepare("EXPLAIN QUERY PLAN SELECT * FROM session_security WHERE session_id = ?").bind(sid).all<{ detail: string }>();
    expect(plan.results.some((row) => /USING INDEX/.test(row.detail))).toBe(true);
    expect((await env.TEST_DB.prepare("PRAGMA foreign_key_check").all()).results).toEqual([]);
  });

  it("rolls back account change, generation and session revocation on a failed transaction", async () => {
    const id = await seed(env.TEST_DB);
    const service = new SessionService(env.TEST_DB, () => time);
    const session = await service.issue(id, 0);
    if (!session) throw new Error("Synthetic issuance failed");
    await expect(env.TEST_DB.batch([
      env.TEST_DB.prepare("UPDATE accounts SET active = 0 WHERE id = ?").bind(id),
      env.TEST_DB.prepare("UPDATE accounts SET failure_count = -1 WHERE id = ?").bind(id),
    ])).rejects.toThrow(/constraint/i);
    expect(await version(env.TEST_DB, id)).toBe(0);
    expect(await service.resolve(session.token) !== null).toBe(true);
    await service.invalidateAccount(id);
    expect(await version(env.TEST_DB, id)).toBe(1);
    expect(await service.resolve(session.token)).toBeNull();
  });

  it("invalidates on every credential change and preserves sessions on unrelated counters", async () => {
    const id = await seed(env.TEST_DB);
    const service = new SessionService(env.TEST_DB, () => time);
    for (const [index, sql] of [
      "UPDATE accounts SET password_hash = x'020304' WHERE id = ?",
      "UPDATE accounts SET password_salt = x'070809' WHERE id = ?",
      "UPDATE accounts SET password_version = 2 WHERE id = ?",
      "UPDATE accounts SET password_parameters = '{\"synthetic\":2}' WHERE id = ?",
    ].entries()) {
      const session = await service.issue(id, index);
      if (!session) throw new Error("Synthetic issuance failed");
      await env.TEST_DB.prepare("UPDATE accounts SET failure_count = 2 WHERE id = ?").bind(id).run();
      expect(await service.resolve(session.token) !== null).toBe(true);
      await env.TEST_DB.prepare(sql).bind(id).run();
      expect(await service.resolve(session.token)).toBeNull();
      expect(await version(env.TEST_DB, id)).toBe(index + 1);
    }
  });
});

describe("T009 fresh/upgrade/no-op/failure migration evidence", () => {
  it("preserves old records, denies legacy sessions and repeats without side effects", async () => {
    const db = env.TEST_UPGRADE_DB;
    await applyD1Migrations(db, env.TEST_MIGRATIONS.slice(0, 5));
    const id = await seed(db);
    await db.prepare("INSERT INTO sessions (id, account_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)")
      .bind("synthetic-legacy", id, [1, 2, 3], time, time + 1000).run();
    await applyD1Migrations(db, env.TEST_MIGRATIONS);
    expect(await db.prepare("SELECT count(*) AS count FROM session_security").first("count")).toBe(0);
    expect(await db.prepare("SELECT account_id FROM sessions WHERE id = 'synthetic-legacy'").first("account_id")).toBe(id);
    expect(await version(db, id)).toBe(0);
    const before = await db.prepare("SELECT name, sql FROM sqlite_schema ORDER BY name").all();
    await applyD1Migrations(db, env.TEST_MIGRATIONS);
    expect((await db.prepare("SELECT name, sql FROM sqlite_schema ORDER BY name").all()).results).toEqual(before.results);
    expect(await db.prepare("SELECT count(*) AS count FROM d1_migrations").first("count")).toBe(6);
  });

  it("rolls back all T009 DDL and permits a clean retry", async () => {
    const db = env.TEST_ROLLBACK_DB;
    await applyD1Migrations(db, env.TEST_MIGRATIONS.slice(0, 5));
    const id = await seed(db);
    const original = env.TEST_MIGRATIONS[5];
    await expect(applyD1Migrations(db, [{ ...original, queries: [...original.queries, "INSERT INTO synthetic_missing_table VALUES (1)"] }]))
      .rejects.toThrow(/no such table/);
    expect(await db.prepare("SELECT name FROM sqlite_schema WHERE name = 'session_security'").first()).toBeNull();
    const columns = await db.prepare("PRAGMA table_info(accounts)").all<{ name: string }>();
    expect(columns.results.some((column) => column.name === "session_version")).toBe(false);
    await applyD1Migrations(db, env.TEST_MIGRATIONS);
    expect(await version(db, id)).toBe(0);
    expect(await db.prepare("SELECT count(*) AS count FROM d1_migrations").first("count")).toBe(6);
  });
});
