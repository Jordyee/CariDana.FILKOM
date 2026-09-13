-- T006 append-oriented issue, correction, approval, audit, and idempotency
-- persistence. Confirmed T005 records remain the immutable source history;
-- financial effects are proposed separately and count only after approval.

CREATE TABLE issues (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0 AND instr(id, char(0)) = 0),
  target_type TEXT NOT NULL CHECK (target_type IN (
    'order', 'order_state_history', 'payment_history', 'fulfillment_history',
    'remittance_history', 'payment_proof_metadata'
  )),
  target_id TEXT NOT NULL CHECK (length(trim(target_id)) > 0 AND instr(target_id, char(0)) = 0),
  issue_type TEXT NOT NULL CHECK (issue_type IN (
    'duplicate', 'repeated_proof', 'invalid_proof', 'typo', 'damage', 'non_pickup', 'other'
  )),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0 AND instr(reason, char(0)) = 0),
  reported_by_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  reported_at INTEGER NOT NULL CHECK (reported_at BETWEEN 0 AND 8640000000000000)
) STRICT;

CREATE TABLE corrections (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0 AND instr(id, char(0)) = 0),
  issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  target_type TEXT NOT NULL CHECK (target_type IN (
    'order', 'order_state_history', 'payment_history', 'fulfillment_history',
    'remittance_history', 'payment_proof_metadata'
  )),
  target_id TEXT NOT NULL CHECK (length(trim(target_id)) > 0 AND instr(target_id, char(0)) = 0),
  correction_kind TEXT NOT NULL CHECK (correction_kind IN (
    'data_correction', 'proof_reference_correction', 'void', 'refund',
    'financial_correction', 'loss_classification'
  )),
  before_json TEXT NOT NULL CHECK (
    CASE WHEN json_valid(before_json) THEN
      json_type(before_json) = 'object' AND json(before_json) <> '{}'
    ELSE 0 END
  ),
  after_json TEXT NOT NULL CHECK (
    CASE WHEN json_valid(after_json) THEN
      json_type(after_json) = 'object' AND json(after_json) <> '{}'
    ELSE 0 END
  ),
  reason TEXT NOT NULL CHECK (length(trim(reason)) > 0 AND instr(reason, char(0)) = 0),
  proposed_by_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  proposed_at INTEGER NOT NULL CHECK (proposed_at BETWEEN 0 AND 8640000000000000),
  approval_required INTEGER NOT NULL CHECK (approval_required IN (0, 1)),
  CHECK (
    (correction_kind IN ('void', 'refund', 'financial_correction', 'loss_classification')
      AND approval_required = 1)
    OR
    (correction_kind IN ('data_correction', 'proof_reference_correction')
      AND approval_required = 0)
  )
) STRICT;

-- A financial effect is an immutable proposal, not a negative payment or
-- remittance event. It becomes countable only when its matching correction has
-- one approved decision below.
CREATE TABLE financial_effect_proposals (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0 AND instr(id, char(0)) = 0),
  correction_id TEXT NOT NULL UNIQUE REFERENCES corrections(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  effect_kind TEXT NOT NULL CHECK (effect_kind IN (
    'void', 'refund', 'financial_correction', 'loss_classification'
  )),
  amount_rp INTEGER NOT NULL CHECK (amount_rp BETWEEN 0 AND 2147483647),
  proposed_at INTEGER NOT NULL CHECK (proposed_at BETWEEN 0 AND 8640000000000000)
) STRICT;

-- No row means a proposal is still pending. A unique immutable decision means
-- the same correction cannot be both approved and rejected.
CREATE TABLE correction_approvals (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0 AND instr(id, char(0)) = 0),
  correction_id TEXT NOT NULL UNIQUE REFERENCES corrections(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  approver_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  decided_at INTEGER NOT NULL CHECK (decided_at BETWEEN 0 AND 8640000000000000),
  audit_event_id TEXT NOT NULL UNIQUE REFERENCES audit_events(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) STRICT;

-- This table deliberately keeps only auditable event metadata and optional
-- redacted change summaries. Required correction before/after values live in
-- `corrections`; no raw credential, session, buyer, map, or proof column exists.
CREATE TABLE audit_events (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0 AND instr(id, char(0)) = 0),
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'account', 'activity', 'order', 'order_state_history', 'payment_history',
    'fulfillment_history', 'remittance_history', 'issue', 'correction',
    'correction_approval', 'financial_effect', 'idempotency', 'sync', 'report'
  )),
  entity_id TEXT NOT NULL CHECK (length(trim(entity_id)) > 0 AND instr(entity_id, char(0)) = 0),
  action TEXT NOT NULL CHECK (length(trim(action)) > 0 AND instr(action, char(0)) = 0),
  before_json TEXT CHECK (
    before_json IS NULL OR CASE WHEN json_valid(before_json) THEN
      json_type(before_json) = 'object' AND json(before_json) <> '{}'
    ELSE 0 END
  ),
  after_json TEXT CHECK (
    after_json IS NULL OR CASE WHEN json_valid(after_json) THEN
      json_type(after_json) = 'object' AND json(after_json) <> '{}'
    ELSE 0 END
  ),
  reason TEXT CHECK (reason IS NULL OR (length(trim(reason)) > 0 AND instr(reason, char(0)) = 0)),
  actor_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  occurred_at INTEGER NOT NULL CHECK (occurred_at BETWEEN 0 AND 8640000000000000)
) STRICT;

-- An idempotency row records a safe result reference, never an entire request
-- or response body. The composite key scopes a client key to its account/route.
CREATE TABLE idempotency_keys (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  route TEXT NOT NULL CHECK (
    length(trim(route)) > 4 AND route GLOB '/api/*' AND instr(route, char(0)) = 0
  ),
  idempotency_key TEXT NOT NULL CHECK (
    length(trim(idempotency_key)) > 0 AND instr(idempotency_key, char(0)) = 0
  ),
  request_hash BLOB NOT NULL CHECK (length(request_hash) > 0),
  result_status TEXT NOT NULL CHECK (result_status IN ('succeeded', 'failed')),
  result_kind TEXT NOT NULL CHECK (result_kind IN (
    'order', 'order_history', 'correction', 'financial_effect', 'sync_row',
    'closure', 'report', 'none'
  )),
  result_reference TEXT CHECK (
    result_reference IS NULL OR (length(trim(result_reference)) > 0 AND instr(result_reference, char(0)) = 0)
  ),
  created_at INTEGER NOT NULL CHECK (created_at BETWEEN 0 AND 8640000000000000),
  expires_at INTEGER NOT NULL CHECK (
    expires_at BETWEEN 0 AND 8640000000000000 AND expires_at > created_at
  ),
  PRIMARY KEY (account_id, route, idempotency_key),
  CHECK (
    (result_status = 'succeeded' AND result_kind <> 'none' AND result_reference IS NOT NULL)
    OR
    (result_status = 'failed' AND result_kind = 'none' AND result_reference IS NULL)
  )
) STRICT;

CREATE TRIGGER issue_target_exists_on_insert
BEFORE INSERT ON issues
BEGIN
  SELECT CASE WHEN NEW.target_type = 'order' AND NOT EXISTS (
    SELECT 1 FROM orders WHERE order_id = NEW.target_id
  ) THEN RAISE(ABORT, 'issue order target must exist') END;
  SELECT CASE WHEN NEW.target_type = 'order_state_history' AND NOT EXISTS (
    SELECT 1 FROM order_state_history WHERE id = NEW.target_id
  ) THEN RAISE(ABORT, 'issue order-state target must exist') END;
  SELECT CASE WHEN NEW.target_type = 'payment_history' AND NOT EXISTS (
    SELECT 1 FROM payment_history WHERE id = NEW.target_id
  ) THEN RAISE(ABORT, 'issue payment target must exist') END;
  SELECT CASE WHEN NEW.target_type = 'fulfillment_history' AND NOT EXISTS (
    SELECT 1 FROM fulfillment_history WHERE id = NEW.target_id
  ) THEN RAISE(ABORT, 'issue fulfillment target must exist') END;
  SELECT CASE WHEN NEW.target_type = 'remittance_history' AND NOT EXISTS (
    SELECT 1 FROM remittance_history WHERE id = NEW.target_id
  ) THEN RAISE(ABORT, 'issue remittance target must exist') END;
  SELECT CASE WHEN NEW.target_type = 'payment_proof_metadata' AND NOT EXISTS (
    SELECT 1 FROM orders WHERE order_id = NEW.target_id
  ) THEN RAISE(ABORT, 'issue proof-metadata target must be an order') END;
END;

CREATE TRIGGER correction_matches_issue_on_insert
BEFORE INSERT ON corrections
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM issues
    WHERE id = NEW.issue_id AND target_type = NEW.target_type AND target_id = NEW.target_id
  ) THEN RAISE(ABORT, 'correction target must match its issue') END;
  SELECT CASE WHEN NEW.proposed_at < (
    SELECT reported_at FROM issues WHERE id = NEW.issue_id
  ) THEN RAISE(ABORT, 'correction proposal cannot predate its issue') END;
END;

CREATE TRIGGER financial_effect_proposal_matches_correction_on_insert
BEFORE INSERT ON financial_effect_proposals
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM corrections
    WHERE id = NEW.correction_id
      AND approval_required = 1
      AND correction_kind = NEW.effect_kind
  ) THEN RAISE(ABORT, 'financial effect must match an approval-required correction') END;
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM correction_approvals WHERE correction_id = NEW.correction_id
  ) THEN RAISE(ABORT, 'financial effect proposal must precede its decision') END;
END;

CREATE TRIGGER correction_approval_is_consistent_on_insert
BEFORE INSERT ON correction_approvals
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM corrections WHERE id = NEW.correction_id AND approval_required = 1
  ) THEN RAISE(ABORT, 'only approval-required corrections may be decided') END;
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM financial_effect_proposals WHERE correction_id = NEW.correction_id
  ) THEN RAISE(ABORT, 'a correction decision requires its financial effect proposal') END;
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM accounts
    WHERE id = NEW.approver_account_id AND role IN ('coordinator', 'deputy')
  ) THEN RAISE(ABORT, 'only coordinator or deputy may approve a financial correction') END;
  SELECT CASE WHEN NEW.decided_at < (
    SELECT proposed_at FROM corrections WHERE id = NEW.correction_id
  ) OR NEW.decided_at < (
    SELECT proposed_at FROM financial_effect_proposals WHERE correction_id = NEW.correction_id
  ) THEN RAISE(ABORT, 'correction decision cannot predate its proposal') END;
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM audit_events
    WHERE id = NEW.audit_event_id
      AND entity_type = 'correction_approval'
      AND entity_id = NEW.id
      AND actor_account_id = NEW.approver_account_id
      AND occurred_at = NEW.decided_at
  ) THEN RAISE(ABORT, 'correction decision requires its matching audit event') END;
END;

CREATE TRIGGER correction_audit_event_is_complete_on_insert
BEFORE INSERT ON audit_events
WHEN NEW.entity_type = 'correction'
BEGIN
  SELECT CASE WHEN NEW.before_json IS NULL OR NEW.after_json IS NULL OR NEW.reason IS NULL
    OR NOT EXISTS (SELECT 1 FROM corrections WHERE id = NEW.entity_id)
  THEN RAISE(ABORT, 'correction audit event requires a correction and redacted change summary') END;
END;

CREATE TRIGGER audit_event_rejects_sensitive_snapshot_fields_on_insert
BEFORE INSERT ON audit_events
WHEN EXISTS (
  SELECT 1 FROM json_tree(COALESCE(NEW.before_json, '{}'))
  WHERE key IS NOT NULL AND (
    lower(key) LIKE '%password%' OR lower(key) LIKE '%session%' OR lower(key) LIKE '%token%'
    OR lower(key) LIKE '%buyer%' OR lower(key) LIKE '%phone%' OR lower(key) LIKE '%address%'
    OR lower(key) LIKE '%map%' OR lower(key) LIKE '%proof%'
  )
) OR EXISTS (
  SELECT 1 FROM json_tree(COALESCE(NEW.after_json, '{}'))
  WHERE key IS NOT NULL AND (
    lower(key) LIKE '%password%' OR lower(key) LIKE '%session%' OR lower(key) LIKE '%token%'
    OR lower(key) LIKE '%buyer%' OR lower(key) LIKE '%phone%' OR lower(key) LIKE '%address%'
    OR lower(key) LIKE '%map%' OR lower(key) LIKE '%proof%'
  )
)
BEGIN
  SELECT RAISE(ABORT, 'audit snapshots must be redacted');
END;

CREATE TRIGGER idempotency_key_cannot_bind_different_request_on_insert
BEFORE INSERT ON idempotency_keys
WHEN EXISTS (
  SELECT 1 FROM idempotency_keys
  WHERE account_id = NEW.account_id
    AND route = NEW.route
    AND idempotency_key = NEW.idempotency_key
    AND request_hash <> NEW.request_hash
)
BEGIN
  SELECT RAISE(ABORT, 'idempotency key cannot be reused with a different request');
END;

CREATE TRIGGER issues_are_append_only_on_update
BEFORE UPDATE ON issues
BEGIN
  SELECT RAISE(ABORT, 'issues are append-only');
END;
CREATE TRIGGER issues_are_append_only_on_delete
BEFORE DELETE ON issues
BEGIN
  SELECT RAISE(ABORT, 'issues are append-only');
END;
CREATE TRIGGER corrections_are_append_only_on_update
BEFORE UPDATE ON corrections
BEGIN
  SELECT RAISE(ABORT, 'corrections are append-only');
END;
CREATE TRIGGER corrections_are_append_only_on_delete
BEFORE DELETE ON corrections
BEGIN
  SELECT RAISE(ABORT, 'corrections are append-only');
END;
CREATE TRIGGER financial_effect_proposals_are_append_only_on_update
BEFORE UPDATE ON financial_effect_proposals
BEGIN
  SELECT RAISE(ABORT, 'financial effect proposals are append-only');
END;
CREATE TRIGGER financial_effect_proposals_are_append_only_on_delete
BEFORE DELETE ON financial_effect_proposals
BEGIN
  SELECT RAISE(ABORT, 'financial effect proposals are append-only');
END;
CREATE TRIGGER correction_approvals_are_append_only_on_update
BEFORE UPDATE ON correction_approvals
BEGIN
  SELECT RAISE(ABORT, 'correction approvals are append-only');
END;
CREATE TRIGGER correction_approvals_are_append_only_on_delete
BEFORE DELETE ON correction_approvals
BEGIN
  SELECT RAISE(ABORT, 'correction approvals are append-only');
END;
CREATE TRIGGER audit_events_are_append_only_on_update
BEFORE UPDATE ON audit_events
BEGIN
  SELECT RAISE(ABORT, 'audit events are append-only');
END;
CREATE TRIGGER audit_events_are_append_only_on_delete
BEFORE DELETE ON audit_events
BEGIN
  SELECT RAISE(ABORT, 'audit events are append-only');
END;
CREATE TRIGGER idempotency_keys_are_append_only_on_update
BEFORE UPDATE ON idempotency_keys
BEGIN
  SELECT RAISE(ABORT, 'idempotency keys are append-only');
END;
CREATE TRIGGER idempotency_keys_are_append_only_on_delete
BEFORE DELETE ON idempotency_keys
BEGIN
  SELECT RAISE(ABORT, 'idempotency keys are append-only');
END;

CREATE INDEX issues_target ON issues(target_type, target_id, reported_at DESC, id DESC);
CREATE INDEX issues_reporter ON issues(reported_by_account_id);
CREATE INDEX corrections_issue ON corrections(issue_id, proposed_at DESC, id DESC);
CREATE INDEX corrections_target ON corrections(target_type, target_id, proposed_at DESC, id DESC);
CREATE INDEX corrections_proposer ON corrections(proposed_by_account_id);
CREATE INDEX financial_effect_proposals_kind ON financial_effect_proposals(effect_kind, proposed_at DESC);
CREATE INDEX correction_approvals_approver ON correction_approvals(approver_account_id, decided_at DESC);
CREATE INDEX audit_events_entity ON audit_events(entity_type, entity_id, occurred_at DESC, id DESC);
CREATE INDEX audit_events_actor ON audit_events(actor_account_id, occurred_at DESC);
CREATE INDEX idempotency_keys_expiry ON idempotency_keys(expires_at);
