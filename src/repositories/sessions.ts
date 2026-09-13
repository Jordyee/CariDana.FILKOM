import type { AccountRole } from "../db/schema";

export interface ResolvedSession {
  id: string;
  accountId: string;
  role: AccountRole;
  restricted: number;
  createdAt: number;
  expiresAt: number;
  lastSeenAt: number;
  revokedAt: number | null;
  active: number;
  mustChangePassword: number;
  accountVersion: number;
  currentVersion: number;
}

export class SessionRepository {
  constructor(private readonly db: D1Database) {}

  async issue(id: string, accountId: string, hash: Uint8Array, expectedVersion: number, now: number) {
    const results = await this.db.batch([
      this.db.prepare(`INSERT INTO sessions (id, account_id, token_hash, created_at, expires_at)
        SELECT ?, id, ?, ?, ? + CASE must_change_password WHEN 1 THEN 600000 ELSE 28800000 END
        FROM accounts WHERE id = ? AND active = 1 AND session_version = ?`)
        .bind(id, hash, now, now, accountId, expectedVersion),
      this.db.prepare(`INSERT INTO session_security (session_id, account_version, restricted, last_seen_at)
        SELECT s.id, a.session_version, a.must_change_password, s.created_at
        FROM sessions s JOIN accounts a ON a.id = s.account_id WHERE s.id = ?`).bind(id),
      this.db.prepare("SELECT expires_at AS expiresAt FROM sessions WHERE id = ?").bind(id),
    ]);
    return results[2].results[0] as { expiresAt: number } | undefined;
  }

  resolve(hash: Uint8Array) {
    return this.db.prepare(`SELECT s.id, s.account_id AS accountId, a.role,
      ss.restricted, s.created_at AS createdAt, s.expires_at AS expiresAt,
      ss.last_seen_at AS lastSeenAt, s.revoked_at AS revokedAt, a.active,
      a.must_change_password AS mustChangePassword,
      ss.account_version AS accountVersion, a.session_version AS currentVersion
      FROM sessions s JOIN session_security ss ON ss.session_id = s.id
      JOIN accounts a ON a.id = s.account_id WHERE s.token_hash = ?`)
      .bind(hash).first<ResolvedSession>();
  }

  async touch(id: string, now: number) {
    const result = await this.db.prepare(`UPDATE session_security
      SET last_seen_at = max(last_seen_at, ?) WHERE session_id = ?
      AND last_seen_at <= ? AND last_seen_at + 900000 > ?
      AND EXISTS (SELECT 1 FROM sessions s JOIN accounts a ON a.id = s.account_id
        WHERE s.id = session_id AND s.revoked_at IS NULL AND s.created_at <= ?
          AND s.expires_at > ? AND a.active = 1
          AND a.session_version = account_version)`)
      .bind(now, id, now, now, now, now).run();
    return result.meta.changes === 1;
  }

  async revoke(id: string, now: number) {
    await this.db.prepare("UPDATE sessions SET revoked_at = max(created_at, ?) WHERE id = ? AND revoked_at IS NULL")
      .bind(now, id).run();
  }

  async invalidateAccount(accountId: string) {
    await this.db.prepare("UPDATE accounts SET session_version = session_version + 1 WHERE id = ?")
      .bind(accountId).run();
  }
}
