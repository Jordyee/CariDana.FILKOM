-- Security generation binds issuance to the account snapshot actually verified.
ALTER TABLE accounts ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0
  CHECK (session_version BETWEEN 0 AND 9007199254740991);

-- Legacy T003 sessions have no security metadata and cannot authenticate.
-- Separate metadata preserves the published session storage contract.
CREATE TABLE session_security (
  session_id TEXT PRIMARY KEY NOT NULL REFERENCES sessions(id) ON DELETE CASCADE ON UPDATE RESTRICT,
  account_version INTEGER NOT NULL CHECK (account_version BETWEEN 0 AND 9007199254740991),
  restricted INTEGER NOT NULL CHECK (restricted IN (0, 1)),
  last_seen_at INTEGER NOT NULL CHECK (last_seen_at BETWEEN 0 AND 8640000000000000)
) STRICT;

CREATE TRIGGER session_security_insert_guard
BEFORE INSERT ON session_security
WHEN NOT EXISTS (
  SELECT 1 FROM sessions s JOIN accounts a ON a.id = s.account_id
  WHERE s.id = NEW.session_id AND s.revoked_at IS NULL AND a.active = 1
    AND length(s.token_hash) = 32 AND a.session_version = NEW.account_version
    AND a.must_change_password = NEW.restricted
    AND NEW.last_seen_at = s.created_at
    AND s.expires_at = s.created_at + CASE NEW.restricted WHEN 1 THEN 600000 ELSE 28800000 END
)
BEGIN SELECT RAISE(ABORT, 'session security constraint'); END;

CREATE TRIGGER session_security_update_guard
BEFORE UPDATE ON session_security
WHEN NEW.session_id IS NOT OLD.session_id
  OR NEW.account_version IS NOT OLD.account_version
  OR NEW.restricted IS NOT OLD.restricted
  OR NEW.last_seen_at < OLD.last_seen_at
  OR NEW.last_seen_at >= OLD.last_seen_at + 900000
  OR NOT EXISTS (
    SELECT 1 FROM sessions s JOIN accounts a ON a.id = s.account_id
    WHERE s.id = OLD.session_id AND s.revoked_at IS NULL AND a.active = 1
      AND a.session_version = OLD.account_version
      AND NEW.last_seen_at < s.expires_at
  )
BEGIN SELECT RAISE(ABORT, 'session security constraint'); END;

-- Revocation is one-way. Other session identity/lifetime fields cannot change
-- once the security metadata exists.
CREATE TRIGGER session_lifecycle_guard
BEFORE UPDATE ON sessions
WHEN (OLD.revoked_at IS NOT NULL AND NEW.revoked_at IS NOT OLD.revoked_at)
  OR (EXISTS (SELECT 1 FROM session_security WHERE session_id = OLD.id) AND (
    NEW.id IS NOT OLD.id OR NEW.account_id IS NOT OLD.account_id
    OR NEW.token_hash IS NOT OLD.token_hash OR NEW.created_at IS NOT OLD.created_at
    OR NEW.expires_at IS NOT OLD.expires_at
  ))
BEGIN SELECT RAISE(ABORT, 'session lifecycle constraint'); END;

CREATE TRIGGER account_session_version_guard
BEFORE UPDATE OF session_version ON accounts
WHEN NEW.session_version IS NOT OLD.session_version
  AND NEW.session_version IS NOT OLD.session_version + 1
BEGIN SELECT RAISE(ABORT, 'account session version constraint'); END;

CREATE TRIGGER account_security_changed
AFTER UPDATE OF active, must_change_password, password_hash, password_salt,
  password_version, password_parameters ON accounts
WHEN NEW.active IS NOT OLD.active OR NEW.must_change_password IS NOT OLD.must_change_password
  OR NEW.password_hash IS NOT OLD.password_hash OR NEW.password_salt IS NOT OLD.password_salt
  OR NEW.password_version IS NOT OLD.password_version
  OR NEW.password_parameters IS NOT OLD.password_parameters
BEGIN
  UPDATE accounts SET session_version = session_version + 1 WHERE id = NEW.id;
END;

-- Runs inside the same transaction as reset, deactivate or explicit invalidation.
-- Clock is database UTC; max protects valid future-dated synthetic sessions too.
CREATE TRIGGER account_sessions_revoked
AFTER UPDATE OF session_version ON accounts
WHEN NEW.session_version IS NOT OLD.session_version
BEGIN
  UPDATE sessions SET revoked_at = max(created_at, CAST(unixepoch('subsec') * 1000 AS INTEGER))
  WHERE account_id = NEW.id AND revoked_at IS NULL;
END;
