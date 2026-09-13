import { env } from "cloudflare:workers";
import { applyD1Migrations } from "cloudflare:test";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { AccountRow, SessionRow } from "../../src/db/schema";

// Non-credential sentinels only, following T002's synthetic identity convention.
// These bytes are NOT usable verifiers/tokens and do not select crypto costs.
const account: AccountRow = {
  id: "synthetic-coordinator", username: "synthetic.coordinator",
  role: "coordinator", password_hash: [1, 2, 3], password_salt: [4, 5, 6],
  password_version: 1, password_parameters: '{"synthetic":true}',
  active: 1, must_change_password: 1, failure_count: 0, locked_until: null,
};
const session: SessionRow = {
  id: "synthetic-session-a", account_id: account.id, token_hash: [7, 8, 9],
  created_at: 1000, expires_at: 2000, revoked_at: null,
};

// Column names come only from fixed test rows/parameter cases below, never input.
function insert(db: D1Database, table: "accounts" | "sessions", row: object) {
  const keys = Object.keys(row);
  return db.prepare(`INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`)
    .bind(...Object.values(row)).run();
}
async function count(db: D1Database, table: string) {
  return db.prepare(`SELECT count(*) FROM ${table}`).first<number>("count(*)");
}
async function schema(db: D1Database) {
  return db.prepare("SELECT type, name, sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all();
}

describe("T003 identity/session schema", () => {
  beforeAll(async () => {
    await applyD1Migrations(env.TEST_DB, env.TEST_MIGRATIONS);
  });
  beforeEach(async () => {
    // Only disposable test rows are cleared; never operational data.
    await env.TEST_DB.batch([
      env.TEST_DB.prepare("DELETE FROM sessions"), env.TEST_DB.prepare("DELETE FROM accounts"),
    ]);
  });

  it.each(["coordinator", "deputy", "member", "officer", "treasurer"] as const)(
    "persists the approved %s role without granting permissions", async (role) => {
      await insert(env.TEST_DB, "accounts", { ...account, role });
      const row = await env.TEST_DB.prepare("SELECT role, active, must_change_password, failure_count, locked_until, password_version FROM accounts").first();
      expect(row).toEqual({ role, active: 1, must_change_password: 1, failure_count: 0, locked_until: null, password_version: 1 });
    },
  );

  it("persists independent deactivate/reset/lock state and permits clearing lock state", async () => {
    await insert(env.TEST_DB, "accounts", account);
    await env.TEST_DB.prepare("UPDATE accounts SET active = 0, must_change_password = 0, failure_count = 5, locked_until = 900000").run();
    expect(await env.TEST_DB.prepare("SELECT active, must_change_password, failure_count, locked_until FROM accounts").first())
      .toEqual({ active: 0, must_change_password: 0, failure_count: 5, locked_until: 900000 });
    await env.TEST_DB.prepare("UPDATE accounts SET failure_count = 0, locked_until = NULL").run();
    expect(await env.TEST_DB.prepare("SELECT failure_count, locked_until FROM accounts").first())
      .toEqual({ failure_count: 0, locked_until: null });
  });

  it("rejects duplicate canonical usernames and account IDs", async () => {
    await insert(env.TEST_DB, "accounts", account);
    await expect(insert(env.TEST_DB, "accounts", { ...account, id: "synthetic-other" })).rejects.toThrow(/UNIQUE/);
    await expect(insert(env.TEST_DB, "accounts", { ...account, username: "synthetic.other" })).rejects.toThrow(/UNIQUE/);
    expect(await count(env.TEST_DB, "accounts")).toBe(1);
  });

  const badAccountValues: [string, unknown][] = [
    ["id", ""], ["id", null], ["username", ""], ["username", "SYNTHETIC.coordinator"],
    ["username", " synthetic.coordinator"], ["username", "synthetic.coordinator "],
    ["username", "synthetic\tcoordinator"], ["username", "synthetic\ncoordinator"],
    ["username", "synthétic"], ["username", "synthetic\0suffix"], ["username", null],
    ["role", "administrator"], ["role", "Member/PIC"], ["role", null],
    ["active", -1], ["active", 2], ["active", 0.5], ["active", null],
    ["must_change_password", 2], ["must_change_password", -1], ["must_change_password", null],
    ["failure_count", -1], ["failure_count", 0.5], ["failure_count", "invalid"],
    ["failure_count", 2147483648], ["failure_count", null],
    ["locked_until", -1], ["locked_until", 0.5], ["locked_until", 8640000000000001],
    ["password_hash", []], ["password_hash", "synthetic-non-digest"], ["password_hash", null],
    ["password_salt", []], ["password_salt", "synthetic-non-salt"], ["password_salt", null],
    ["password_version", 0], ["password_version", -1], ["password_version", 0.5],
    ["password_version", 2147483648], ["password_version", null],
    ["password_parameters", "{}"], ["password_parameters", "{ }"],
    ["password_parameters", "[]"], ["password_parameters", "null"],
    ["password_parameters", '{"broken":'], ["password_parameters", null],
  ];
  it.each(badAccountValues)("rejects invalid account field %s (case %#)", async (field, value) => {
    await expect(insert(env.TEST_DB, "accounts", { ...account, [field]: value })).rejects.toThrow(/constraint|datatype|store|JSON/i);
    expect(await count(env.TEST_DB, "accounts")).toBe(0);
  });

  it("applies constraints to updates as well as inserts", async () => {
    await insert(env.TEST_DB, "accounts", account);
    for (const [field, value] of badAccountValues) {
      await expect(env.TEST_DB.prepare(`UPDATE accounts SET ${field} = ?`).bind(value).run())
        .rejects.toThrow(/constraint|datatype|store|JSON/i);
    }
    expect(await env.TEST_DB.prepare("SELECT username, role, failure_count FROM accounts").first())
      .toEqual({ username: account.username, role: account.role, failure_count: 0 });
  });

  it("stores digest/verifier bytes with no raw password or cookie token columns", async () => {
    await insert(env.TEST_DB, "accounts", account);
    await insert(env.TEST_DB, "sessions", session);
    expect(await env.TEST_DB.prepare("SELECT typeof(password_hash) AS hash, typeof(password_salt) AS salt FROM accounts").first())
      .toEqual({ hash: "blob", salt: "blob" });
    expect(await env.TEST_DB.prepare("SELECT typeof(token_hash) AS hash FROM sessions").first()).toEqual({ hash: "blob" });
    const accountColumns = await env.TEST_DB.prepare("PRAGMA table_info(accounts)").all<{ name: string }>();
    const sessionColumns = await env.TEST_DB.prepare("PRAGMA table_info(sessions)").all<{ name: string }>();
    // T009 adds a non-secret revocation generation, preserving all T003 columns.
    expect(accountColumns.results.map((column) => column.name)).toEqual([...Object.keys(account), "session_version"]);
    expect(sessionColumns.results.map((column) => column.name)).toEqual(Object.keys(session));
    // Verify D1's decoded representation without logging any verifier bytes.
    const stored = await env.TEST_DB.prepare("SELECT * FROM accounts").first<AccountRow>();
    expect(Array.isArray(stored?.password_hash)).toBe(true);
  });

  const badSessionValues: [string, unknown][] = [
    ["id", ""], ["id", null], ["account_id", "synthetic-missing"], ["account_id", null],
    ["token_hash", []], ["token_hash", "synthetic-raw-cookie"], ["token_hash", null],
    ["created_at", -1], ["created_at", 0.5], ["created_at", 2000], ["created_at", null],
    ["created_at", 8640000000000001], ["expires_at", 1000], ["expires_at", 999],
    ["expires_at", -1], ["expires_at", 2000.5], ["expires_at", 8640000000000001],
    ["expires_at", null], ["revoked_at", 999], ["revoked_at", -1],
    ["revoked_at", 1000.5], ["revoked_at", 8640000000000001],
  ];
  it.each(badSessionValues)("rejects invalid session field %s (case %#)", async (field, value) => {
    await insert(env.TEST_DB, "accounts", account);
    await expect(insert(env.TEST_DB, "sessions", { ...session, [field]: value })).rejects.toThrow(/constraint|datatype|store/i);
    expect(await count(env.TEST_DB, "sessions")).toBe(0);
    await insert(env.TEST_DB, "sessions", session);
    await expect(env.TEST_DB.prepare(`UPDATE sessions SET ${field} = ?`).bind(value).run())
      .rejects.toThrow(/constraint|datatype|store/i);
  });

  it("rejects duplicate hashes/IDs and prevents orphaning an existing session", async () => {
    await insert(env.TEST_DB, "accounts", account);
    await insert(env.TEST_DB, "sessions", session);
    await expect(insert(env.TEST_DB, "sessions", { ...session, id: "synthetic-other" })).rejects.toThrow(/UNIQUE/);
    await expect(insert(env.TEST_DB, "sessions", { ...session, token_hash: [10] })).rejects.toThrow(/UNIQUE/);
    await expect(env.TEST_DB.prepare("DELETE FROM accounts").run()).rejects.toThrow(/FOREIGN KEY/);
    await expect(env.TEST_DB.prepare("UPDATE accounts SET id = 'synthetic-renamed'").run()).rejects.toThrow(/FOREIGN KEY/);
    expect(await count(env.TEST_DB, "sessions")).toBe(1);
  });

  it("supports expiry and account-scoped revocation without changing other accounts", async () => {
    await insert(env.TEST_DB, "accounts", account);
    await insert(env.TEST_DB, "accounts", { ...account, id: "synthetic-other", username: "synthetic.other" });
    await insert(env.TEST_DB, "sessions", session);
    await insert(env.TEST_DB, "sessions", { ...session, id: "synthetic-expired", token_hash: [10], expires_at: 1400 });
    await insert(env.TEST_DB, "sessions", { ...session, id: "synthetic-revoked", token_hash: [11], revoked_at: 1200 });
    await insert(env.TEST_DB, "sessions", { ...session, id: "synthetic-other", token_hash: [12], account_id: "synthetic-other" });
    const activeQuery = "SELECT id FROM sessions WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?";
    expect(await env.TEST_DB.prepare(activeQuery).bind(session.token_hash, 1500).first("id")).toBe(session.id);
    expect(await env.TEST_DB.prepare(activeQuery).bind(session.token_hash, 2000).first()).toBeNull();
    expect(await env.TEST_DB.prepare(activeQuery).bind([10], 1500).first()).toBeNull();
    expect(await env.TEST_DB.prepare(activeQuery).bind([11], 1500).first()).toBeNull();
    const result = await env.TEST_DB.prepare("UPDATE sessions SET revoked_at = ? WHERE account_id = ? AND revoked_at IS NULL")
      .bind(2500, account.id).run();
    expect(result.meta.changes).toBe(2); // Revoking an already-expired session is valid.
    expect(await env.TEST_DB.prepare(activeQuery).bind(session.token_hash, 1500).first()).toBeNull();
    expect(await env.TEST_DB.prepare("SELECT revoked_at FROM sessions WHERE id = 'synthetic-other'").first("revoked_at")).toBeNull();
    expect(await env.TEST_DB.prepare("SELECT revoked_at FROM sessions WHERE id = 'synthetic-revoked'").first("revoked_at")).toBe(1200);
  });

  it("inspects FK, strict tables, index definitions and actual lookup/revocation query plans", async () => {
    const foreignKeys = await env.TEST_DB.prepare("PRAGMA foreign_key_list(sessions)").all();
    expect(foreignKeys.results).toEqual([expect.objectContaining({ table: "accounts", from: "account_id", to: "id", on_delete: "RESTRICT", on_update: "RESTRICT" })]);
    const tables = await env.TEST_DB.prepare("PRAGMA table_list").all<{ name: string; strict: number }>();
    expect(tables.results.filter((table) => ["accounts", "sessions"].includes(table.name)).every((table) => table.strict === 1)).toBe(true);
    const indexes = await env.TEST_DB.prepare("PRAGMA index_list(sessions)").all<{ name: string; partial: number }>();
    expect(indexes.results).toContainEqual(expect.objectContaining({ name: "sessions_account_active", partial: 1 }));
    expect(indexes.results).toContainEqual(expect.objectContaining({ name: "sessions_account", partial: 0 }));
    for (const [table, column] of [["accounts", "username"], ["sessions", "token_hash"]]) {
      const unique = await env.TEST_DB.prepare(`PRAGMA index_list(${table})`).all<{ name: string; unique: number }>();
      let indexed = false;
      for (const index of unique.results.filter((index) => index.unique === 1)) {
        const columns = await env.TEST_DB.prepare(`PRAGMA index_info(${index.name})`).all<{ name: string }>();
        if (columns.results.map((item) => item.name).join(",") === column) indexed = true;
      }
      expect(indexed).toBe(true);
    }
    for (const query of [
      "SELECT id FROM accounts WHERE username = 'synthetic.coordinator'",
      "SELECT id FROM sessions WHERE token_hash = x'070809' AND revoked_at IS NULL AND expires_at > 1500",
      "UPDATE sessions SET revoked_at = 1500 WHERE account_id = 'synthetic-coordinator' AND revoked_at IS NULL",
    ]) {
      const plan = await env.TEST_DB.prepare(`EXPLAIN QUERY PLAN ${query}`).all<{ detail: string }>();
      expect(plan.results.some((row) => /SEARCH .* USING (?:COVERING )?INDEX/.test(row.detail))).toBe(true);
      expect(plan.results.some((row) => /SCAN (accounts|sessions)/.test(row.detail))).toBe(false);
    }
    expect((await env.TEST_DB.prepare("PRAGMA foreign_key_check").all()).results).toEqual([]);
  });
});

describe("T003 migration lifecycle on separate disposable D1 databases", () => {
  it("upgrades the T003 product baseline, seeds nothing and repeats as a no-op", async () => {
    const db = env.TEST_UPGRADE_DB;
    expect(await db.prepare("SELECT name FROM sqlite_schema WHERE name IN ('accounts', 'sessions')").all())
      .toMatchObject({ results: [] });
    expect(env.TEST_MIGRATIONS.map((migration) => migration.name)).toEqual([
      "0001_identity_sessions.sql", "0002_committee_activities.sql", "0003_orders_states.sql",
      "0004_audit_corrections_idempotency.sql", "0005_sync_reports.sql", "0006_session_security.sql",
    ]);
    await applyD1Migrations(db, [env.TEST_MIGRATIONS[0]]);
    expect(await count(db, "accounts")).toBe(0);
    expect(await count(db, "sessions")).toBe(0);
    await insert(db, "accounts", account);
    await insert(db, "sessions", session);
    await applyD1Migrations(db, env.TEST_MIGRATIONS);
    const before = await schema(db);
    for (let retry = 0; retry < 2; retry++) await applyD1Migrations(db, env.TEST_MIGRATIONS);
    expect((await schema(db)).results).toEqual(before.results);
    expect(await count(db, "d1_migrations")).toBe(6);
    expect(await count(db, "accounts")).toBe(1);
    expect(await count(db, "sessions")).toBe(1);
  });

  it("rolls back failed DDL and migration bookkeeping, then safely retries the original SQL", async () => {
    const db = env.TEST_ROLLBACK_DB;
    const original = env.TEST_MIGRATIONS[1];
    await applyD1Migrations(db, [env.TEST_MIGRATIONS[0]]);
    // A deterministic fault after all DDL proves the whole migration rolls back.
    const broken = { ...original, queries: [...original.queries, "INSERT INTO synthetic_missing_table VALUES (1)"] };
    await expect(applyD1Migrations(db, [broken])).rejects.toThrow(/no such table/);
    const priorObjects = await db.prepare("SELECT name FROM sqlite_schema WHERE name IN ('accounts', 'sessions', 'sessions_account', 'sessions_account_active') ORDER BY name").all<{ name: string }>();
    expect(priorObjects.results.map((item) => item.name)).toEqual([
      "accounts", "sessions", "sessions_account", "sessions_account_active",
    ]);
    expect(await db.prepare("SELECT name FROM sqlite_schema WHERE name = 'activities'").first()).toBeNull();
    expect(await count(db, "d1_migrations")).toBe(1);
    await applyD1Migrations(db, env.TEST_MIGRATIONS);
    await insert(db, "accounts", account);
    await insert(db, "sessions", session);
    const brokenUpgrade = { name: "9999_synthetic_failure.sql", queries: [
      "CREATE TABLE synthetic_upgrade_probe (id INTEGER)",
      "UPDATE accounts SET failure_count = 3",
      "UPDATE sessions SET account_id = 'synthetic-orphan'",
    ] };
    await expect(applyD1Migrations(db, [brokenUpgrade])).rejects.toThrow(/FOREIGN KEY/);
    expect(await count(db, "d1_migrations")).toBe(6);
    expect(await db.prepare("SELECT name FROM sqlite_schema WHERE name = 'synthetic_upgrade_probe'").first()).toBeNull();
    expect(await db.prepare("SELECT failure_count FROM accounts").first("failure_count")).toBe(0);
    expect(await count(db, "sessions")).toBe(1);
    await expect(db.batch([
      db.prepare("UPDATE accounts SET active = 0"),
      db.prepare("UPDATE sessions SET revoked_at = -1"),
    ])).rejects.toThrow(/CHECK|session lifecycle constraint/);
    expect(await db.prepare("SELECT active FROM accounts").first("active")).toBe(1);
  });
});
