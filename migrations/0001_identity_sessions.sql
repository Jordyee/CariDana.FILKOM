-- First product migration: T001 retired the separate compatibility-spike schema.
-- No accounts or credentials are seeded. Verifier algorithms/costs and session
-- duration policy are enforced by the later auth services, not chosen here.
CREATE TABLE accounts (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) > 0),
  username TEXT NOT NULL UNIQUE CHECK (
    length(username) > 0 AND instr(username, char(0)) = 0
    AND username NOT GLOB '*[^a-z0-9._-]*'
  ),
  role TEXT NOT NULL CHECK (
    role IN ('coordinator', 'deputy', 'member', 'officer', 'treasurer')
  ),
  password_hash BLOB NOT NULL CHECK (length(password_hash) > 0),
  password_salt BLOB NOT NULL CHECK (length(password_salt) > 0),
  password_version INTEGER NOT NULL CHECK (password_version BETWEEN 1 AND 2147483647),
  password_parameters TEXT NOT NULL CHECK (
    CASE WHEN json_valid(password_parameters) THEN
      json_type(password_parameters) = 'object' AND json(password_parameters) <> '{}'
    ELSE 0 END
  ),
  active INTEGER NOT NULL CHECK (active IN (0, 1)),
  must_change_password INTEGER NOT NULL CHECK (must_change_password IN (0, 1)),
  failure_count INTEGER NOT NULL DEFAULT 0 CHECK (failure_count BETWEEN 0 AND 2147483647),
  locked_until INTEGER CHECK (locked_until BETWEEN 0 AND 8640000000000000)
) STRICT;

-- Epoch milliseconds, UTC. Bounds fit JavaScript Date without precision loss.
-- Revocation may occur after expiry; an expired record can still be revoked.
CREATE TABLE sessions (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) > 0),
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  token_hash BLOB NOT NULL UNIQUE CHECK (length(token_hash) > 0),
  created_at INTEGER NOT NULL CHECK (created_at BETWEEN 0 AND 8640000000000000),
  expires_at INTEGER NOT NULL CHECK (
    expires_at BETWEEN 0 AND 8640000000000000 AND expires_at > created_at
  ),
  revoked_at INTEGER CHECK (
    revoked_at BETWEEN 0 AND 8640000000000000 AND revoked_at >= created_at
  )
) STRICT;

-- The UNIQUE indexes cover username and token-hash lookup (including active
-- lookup with expiry/revocation predicates); do not duplicate those indexes.
CREATE INDEX sessions_account_active ON sessions(account_id) WHERE revoked_at IS NULL;
-- Also cover all child references, including revoked sessions, for FK checks.
CREATE INDEX sessions_account ON sessions(account_id);
