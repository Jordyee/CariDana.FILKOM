/** Internal D1 rows, never response DTOs. Member/PIC is stored as `member`. */
export type AccountRole = "coordinator" | "deputy" | "member" | "officer" | "treasurer";
export type DatabaseFlag = 0 | 1;

export interface AccountRow {
  id: string;
  /** Canonical lowercase ASCII login key: letters, digits, dot, underscore, hyphen. */
  username: string;
  role: AccountRole;
  /** D1 returns BLOB columns as byte arrays. These are verifiers, never passwords. */
  password_hash: number[];
  password_salt: number[];
  password_version: number;
  /** Nonempty JSON object; interpretation and approved costs belong to T008. */
  password_parameters: string;
  active: DatabaseFlag;
  must_change_password: DatabaseFlag;
  failure_count: number;
  /** UTC epoch milliseconds; null means no persisted lock. */
  locked_until: number | null;
}

export interface SessionRow {
  id: string;
  account_id: string;
  /** Digest bytes only. No raw cookie token field exists. */
  token_hash: number[];
  /** UTC epoch milliseconds, bounded by JavaScript Date's supported range. */
  created_at: number;
  expires_at: number;
  revoked_at: number | null;
}
