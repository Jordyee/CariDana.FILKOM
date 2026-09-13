-- T007 manual sync ledger and deterministic report-version metadata. External
-- Sheet/Drive access, credentials, write-back, closure, and workbook generation
-- remain later service work; these tables retain only safe local provenance.

CREATE TABLE sheet_connections (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0 AND instr(id, char(0)) = 0),
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  sheet_identity TEXT NOT NULL CHECK (length(trim(sheet_identity)) > 0 AND instr(sheet_identity, char(0)) = 0),
  tab_identity TEXT NOT NULL CHECK (length(trim(tab_identity)) > 0 AND instr(tab_identity, char(0)) = 0),
  mapping_version TEXT NOT NULL CHECK (length(trim(mapping_version)) > 0 AND instr(mapping_version, char(0)) = 0),
  configured_by_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  configured_at INTEGER NOT NULL CHECK (configured_at BETWEEN 0 AND 8640000000000000),
  UNIQUE (sheet_identity, tab_identity)
) STRICT;

-- A completed preview or commit run snapshots the mapping version it used. Row
-- outcomes carry the individual results, so a partially failed run remains
-- inspectable without a mutable aggregate counter.
CREATE TABLE sync_runs (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0 AND instr(id, char(0)) = 0),
  sheet_connection_id TEXT NOT NULL REFERENCES sheet_connections(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  operation TEXT NOT NULL CHECK (operation IN ('preview', 'commit')),
  result_status TEXT NOT NULL CHECK (result_status IN ('succeeded', 'partially_failed', 'failed')),
  mapping_version TEXT NOT NULL CHECK (length(trim(mapping_version)) > 0 AND instr(mapping_version, char(0)) = 0),
  initiated_by_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  started_at INTEGER NOT NULL CHECK (started_at BETWEEN 0 AND 8640000000000000),
  completed_at INTEGER NOT NULL CHECK (
    completed_at BETWEEN 0 AND 8640000000000000 AND completed_at >= started_at
  )
) STRICT;

-- `source_row_identity` is a stable, non-payload source identifier. No source
-- response values are stored here. A row is recorded once per run; another run
-- may record the same source identity to preserve retry evidence.
CREATE TABLE sync_rows (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0 AND instr(id, char(0)) = 0),
  sync_run_id TEXT NOT NULL REFERENCES sync_runs(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  sheet_connection_id TEXT NOT NULL REFERENCES sheet_connections(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  source_row_identity TEXT NOT NULL CHECK (
    length(trim(source_row_identity)) > 0 AND instr(source_row_identity, char(0)) = 0
  ),
  outcome TEXT NOT NULL CHECK (outcome IN ('candidate', 'imported', 'linked', 'skipped', 'failed')),
  outcome_reason TEXT CHECK (
    outcome_reason IS NULL OR (length(trim(outcome_reason)) > 0 AND instr(outcome_reason, char(0)) = 0)
  ),
  possible_manual_order_id TEXT REFERENCES orders(order_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  reviewer_decision TEXT CHECK (reviewer_decision IN ('link_existing', 'import_separately')),
  reviewed_by_account_id TEXT REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  reviewed_at INTEGER CHECK (reviewed_at BETWEEN 0 AND 8640000000000000),
  review_reason TEXT CHECK (
    review_reason IS NULL OR (length(trim(review_reason)) > 0 AND instr(review_reason, char(0)) = 0)
  ),
  selected_order_id TEXT REFERENCES orders(order_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  recorded_at INTEGER NOT NULL CHECK (recorded_at BETWEEN 0 AND 8640000000000000),
  UNIQUE (sync_run_id, source_row_identity),
  CHECK (
    (reviewer_decision IS NULL AND reviewed_by_account_id IS NULL AND reviewed_at IS NULL AND review_reason IS NULL)
    OR
    (reviewer_decision IS NOT NULL AND possible_manual_order_id IS NOT NULL
      AND reviewed_by_account_id IS NOT NULL AND reviewed_at IS NOT NULL AND review_reason IS NOT NULL
      AND selected_order_id IS NOT NULL)
  ),
  CHECK (
    (outcome = 'candidate' AND selected_order_id IS NULL AND reviewer_decision IS NULL)
    OR
    (outcome = 'imported' AND selected_order_id IS NOT NULL
      AND (reviewer_decision IS NULL OR reviewer_decision = 'import_separately'))
    OR
    (outcome = 'linked' AND reviewer_decision = 'link_existing'
      AND selected_order_id = possible_manual_order_id)
    OR
    (outcome IN ('skipped', 'failed') AND possible_manual_order_id IS NULL
      AND selected_order_id IS NULL AND reviewer_decision IS NULL AND outcome_reason IS NOT NULL)
  )
) STRICT;

-- This is the durable committed-source ledger. A retry may add a later sync-row
-- result, but its physical source identity can never bind another order.
CREATE TABLE sheet_order_links (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0 AND instr(id, char(0)) = 0),
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  sheet_connection_id TEXT NOT NULL REFERENCES sheet_connections(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  source_row_identity TEXT NOT NULL CHECK (
    length(trim(source_row_identity)) > 0 AND instr(source_row_identity, char(0)) = 0
  ),
  order_id TEXT NOT NULL REFERENCES orders(order_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  resolution TEXT NOT NULL CHECK (resolution IN ('imported', 'linked')),
  sync_row_id TEXT NOT NULL UNIQUE REFERENCES sync_rows(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  resolved_by_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  resolved_at INTEGER NOT NULL CHECK (resolved_at BETWEEN 0 AND 8640000000000000),
  UNIQUE (sheet_connection_id, source_row_identity)
) STRICT;

-- This is metadata only. The closed snapshot reference is deliberately opaque;
-- T023/T033 own closure validation and deterministic workbook generation.
CREATE TABLE report_versions (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0 AND instr(id, char(0)) = 0),
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  closed_activity_reference TEXT NOT NULL CHECK (
    length(trim(closed_activity_reference)) > 0 AND instr(closed_activity_reference, char(0)) = 0
  ),
  generator_version TEXT NOT NULL CHECK (length(trim(generator_version)) > 0 AND instr(generator_version, char(0)) = 0),
  template_version TEXT NOT NULL CHECK (length(trim(template_version)) > 0 AND instr(template_version, char(0)) = 0),
  checksum TEXT NOT NULL CHECK (length(trim(checksum)) > 0 AND instr(checksum, char(0)) = 0),
  generated_by_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  generated_at INTEGER NOT NULL CHECK (generated_at BETWEEN 0 AND 8640000000000000)
) STRICT;

CREATE TRIGGER sheet_connection_requires_coordinator_or_deputy_on_insert
BEFORE INSERT ON sheet_connections
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM accounts
    WHERE id = NEW.configured_by_account_id AND role IN ('coordinator', 'deputy')
  ) THEN RAISE(ABORT, 'only coordinator or deputy may configure a Sheet connection') END;
END;

-- The physical source and owning activity stay stable for existing ledger rows;
-- a later mapping revision may update only `mapping_version` and is snapshotted
-- on every sync run.
CREATE TRIGGER sheet_connection_identity_is_immutable
BEFORE UPDATE OF id, activity_id, sheet_identity, tab_identity, configured_by_account_id, configured_at ON sheet_connections
BEGIN
  SELECT RAISE(ABORT, 'Sheet connection identity is immutable');
END;

CREATE TRIGGER sync_run_matches_connection_on_insert
BEFORE INSERT ON sync_runs
BEGIN
  SELECT CASE WHEN NEW.mapping_version <> (
    SELECT mapping_version FROM sheet_connections WHERE id = NEW.sheet_connection_id
  ) THEN RAISE(ABORT, 'sync run mapping version must match its Sheet connection') END;
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM accounts
    WHERE id = NEW.initiated_by_account_id AND role IN ('coordinator', 'deputy')
  ) THEN RAISE(ABORT, 'only coordinator or deputy may run Sheet sync') END;
END;

CREATE TRIGGER sync_row_is_consistent_on_insert
BEFORE INSERT ON sync_rows
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM sync_runs
    WHERE id = NEW.sync_run_id AND sheet_connection_id = NEW.sheet_connection_id
  ) THEN RAISE(ABORT, 'sync row must match its run Sheet connection') END;
  SELECT CASE WHEN (SELECT operation FROM sync_runs WHERE id = NEW.sync_run_id) = 'preview'
    AND NEW.outcome NOT IN ('candidate', 'skipped', 'failed')
    THEN RAISE(ABORT, 'preview run cannot commit an order result') END;
  SELECT CASE WHEN (SELECT operation FROM sync_runs WHERE id = NEW.sync_run_id) = 'commit'
    AND NEW.outcome NOT IN ('imported', 'linked', 'skipped', 'failed')
    THEN RAISE(ABORT, 'commit run cannot retain a preview candidate') END;
  SELECT CASE WHEN NEW.possible_manual_order_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM orders
    JOIN sheet_connections ON sheet_connections.activity_id = orders.activity_id
    WHERE sheet_connections.id = NEW.sheet_connection_id
      AND orders.order_id = NEW.possible_manual_order_id
      AND orders.source_type = 'manual'
  ) THEN RAISE(ABORT, 'manual candidate must be a manual order in the connection activity') END;
  SELECT CASE WHEN NEW.selected_order_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM orders
    JOIN sheet_connections ON sheet_connections.activity_id = orders.activity_id
    WHERE sheet_connections.id = NEW.sheet_connection_id
      AND orders.order_id = NEW.selected_order_id
  ) THEN RAISE(ABORT, 'selected order must belong to the connection activity') END;
  SELECT CASE WHEN NEW.reviewer_decision IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM accounts
    WHERE id = NEW.reviewed_by_account_id AND role IN ('coordinator', 'deputy')
  ) THEN RAISE(ABORT, 'only coordinator or deputy may review a manual candidate') END;
  SELECT CASE WHEN NEW.outcome = 'imported' AND NOT EXISTS (
    SELECT 1 FROM orders WHERE order_id = NEW.selected_order_id AND source_type = 'form_sync'
  ) THEN RAISE(ABORT, 'imported sync row must select a form-sync order') END;
  SELECT CASE WHEN NEW.outcome = 'linked' AND NOT EXISTS (
    SELECT 1 FROM orders WHERE order_id = NEW.selected_order_id AND source_type = 'manual'
  ) THEN RAISE(ABORT, 'linked sync row must select a manual order') END;
END;

CREATE TRIGGER sheet_order_link_matches_commit_row_on_insert
BEFORE INSERT ON sheet_order_links
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM sync_rows
    JOIN sync_runs ON sync_runs.id = sync_rows.sync_run_id
    WHERE sync_rows.id = NEW.sync_row_id
      AND sync_runs.operation = 'commit'
      AND sync_rows.sheet_connection_id = NEW.sheet_connection_id
      AND sync_rows.source_row_identity = NEW.source_row_identity
      AND sync_rows.selected_order_id = NEW.order_id
      AND ((NEW.resolution = 'imported' AND sync_rows.outcome = 'imported')
        OR (NEW.resolution = 'linked' AND sync_rows.outcome = 'linked'))
  ) THEN RAISE(ABORT, 'Sheet-order link must match a committed sync row') END;
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM sheet_connections
    JOIN orders ON orders.activity_id = sheet_connections.activity_id
    WHERE sheet_connections.id = NEW.sheet_connection_id
      AND sheet_connections.activity_id = NEW.activity_id
      AND orders.order_id = NEW.order_id
  ) THEN RAISE(ABORT, 'Sheet-order link order must belong to its connection activity') END;
  SELECT CASE WHEN NEW.resolution = 'imported' AND NOT EXISTS (
    SELECT 1 FROM orders WHERE order_id = NEW.order_id AND source_type = 'form_sync'
  ) THEN RAISE(ABORT, 'imported link must bind a form-sync order') END;
  SELECT CASE WHEN NEW.resolution = 'linked' AND NOT EXISTS (
    SELECT 1 FROM sync_rows
    WHERE id = NEW.sync_row_id
      AND possible_manual_order_id = NEW.order_id
      AND reviewer_decision = 'link_existing'
      AND reviewed_by_account_id = NEW.resolved_by_account_id
      AND reviewed_at = NEW.resolved_at
  ) THEN RAISE(ABORT, 'linked manual order requires its matching reviewer decision') END;
  SELECT CASE WHEN NEW.resolution = 'imported' AND NOT EXISTS (
    SELECT 1 FROM sync_rows
    JOIN sync_runs ON sync_runs.id = sync_rows.sync_run_id
    WHERE sync_rows.id = NEW.sync_row_id AND (
      (sync_rows.reviewer_decision = 'import_separately'
        AND sync_rows.reviewed_by_account_id = NEW.resolved_by_account_id
        AND sync_rows.reviewed_at = NEW.resolved_at)
      OR
      (sync_rows.reviewer_decision IS NULL
        AND sync_runs.initiated_by_account_id = NEW.resolved_by_account_id
        AND NEW.resolved_at BETWEEN sync_runs.started_at AND sync_runs.completed_at)
    )
  ) THEN RAISE(ABORT, 'imported link requires the run actor or matching reviewer decision') END;
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM accounts
    WHERE id = NEW.resolved_by_account_id AND role IN ('coordinator', 'deputy')
  ) THEN RAISE(ABORT, 'only coordinator or deputy may resolve a Sheet-order link') END;
END;

CREATE TRIGGER sync_runs_are_append_only_on_update
BEFORE UPDATE ON sync_runs
BEGIN
  SELECT RAISE(ABORT, 'sync runs are append-only');
END;
CREATE TRIGGER sync_runs_are_append_only_on_delete
BEFORE DELETE ON sync_runs
BEGIN
  SELECT RAISE(ABORT, 'sync runs are append-only');
END;
CREATE TRIGGER sync_rows_are_append_only_on_update
BEFORE UPDATE ON sync_rows
BEGIN
  SELECT RAISE(ABORT, 'sync rows are append-only');
END;
CREATE TRIGGER sync_rows_are_append_only_on_delete
BEFORE DELETE ON sync_rows
BEGIN
  SELECT RAISE(ABORT, 'sync rows are append-only');
END;
CREATE TRIGGER sheet_order_links_are_append_only_on_update
BEFORE UPDATE ON sheet_order_links
BEGIN
  SELECT RAISE(ABORT, 'Sheet-order links are append-only');
END;
CREATE TRIGGER sheet_order_links_are_append_only_on_delete
BEFORE DELETE ON sheet_order_links
BEGIN
  SELECT RAISE(ABORT, 'Sheet-order links are append-only');
END;
CREATE TRIGGER report_versions_are_append_only_on_update
BEFORE UPDATE ON report_versions
BEGIN
  SELECT RAISE(ABORT, 'report versions are append-only');
END;
CREATE TRIGGER report_versions_are_append_only_on_delete
BEFORE DELETE ON report_versions
BEGIN
  SELECT RAISE(ABORT, 'report versions are append-only');
END;

CREATE INDEX sheet_connections_activity ON sheet_connections(activity_id);
CREATE INDEX sync_runs_result ON sync_runs(
  sheet_connection_id, operation, result_status, completed_at DESC, id DESC
);
CREATE INDEX sync_rows_retry ON sync_rows(
  sheet_connection_id, source_row_identity, recorded_at DESC, id DESC
);
CREATE INDEX sync_rows_run_result ON sync_rows(sync_run_id, outcome, recorded_at DESC, id DESC);
CREATE INDEX report_versions_closed_activity ON report_versions(activity_id, generated_at DESC, id DESC);
