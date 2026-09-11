-- T005 orders, proof-reference metadata, and independent append-only state
-- histories. T007 owns all Sheet connection/source-row identity and linkage.
CREATE TABLE orders (
  order_id TEXT PRIMARY KEY NOT NULL CHECK (
    length(trim(order_id)) > 0 AND instr(order_id, char(0)) = 0
  ),
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  source_type TEXT NOT NULL CHECK (source_type IN ('manual', 'form_sync')),
  buyer_name TEXT NOT NULL CHECK (length(trim(buyer_name)) > 0 AND instr(buyer_name, char(0)) = 0),
  buyer_phone TEXT CHECK (buyer_phone IS NULL OR (
    length(trim(buyer_phone)) > 0 AND instr(buyer_phone, char(0)) = 0
  )),
  buyer_address TEXT CHECK (buyer_address IS NULL OR (
    length(trim(buyer_address)) > 0 AND instr(buyer_address, char(0)) = 0
  )),
  buyer_map_reference TEXT CHECK (buyer_map_reference IS NULL OR (
    length(trim(buyer_map_reference)) > 0 AND instr(buyer_map_reference, char(0)) = 0
  )),
  attributed_committee_member_id TEXT REFERENCES committee_members(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  attributed_division_id TEXT REFERENCES divisions(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  attribution_note TEXT CHECK (attribution_note IS NULL OR (
    length(trim(attribution_note)) > 0 AND instr(attribution_note, char(0)) = 0
  )),
  regional_area TEXT CHECK (regional_area IS NULL OR (
    length(trim(regional_area)) > 0 AND instr(regional_area, char(0)) = 0
  )),
  pickup_point TEXT CHECK (pickup_point IS NULL OR (
    length(trim(pickup_point)) > 0 AND instr(pickup_point, char(0)) = 0
  )),
  assigned_pic_committee_member_id TEXT NOT NULL REFERENCES committee_members(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 2147483647),
  payment_method TEXT NOT NULL CHECK (length(trim(payment_method)) > 0 AND instr(payment_method, char(0)) = 0),
  payment_proof_reference TEXT CHECK (payment_proof_reference IS NULL OR (
    length(trim(payment_proof_reference)) > 0 AND instr(payment_proof_reference, char(0)) = 0
  )),
  payment_proof_filename TEXT CHECK (payment_proof_filename IS NULL OR (
    length(trim(payment_proof_filename)) > 0 AND instr(payment_proof_filename, char(0)) = 0
  )),
  payment_proof_mime_type TEXT CHECK (payment_proof_mime_type IS NULL OR (
    length(trim(payment_proof_mime_type)) > 0 AND instr(payment_proof_mime_type, char(0)) = 0
  )),
  notes TEXT CHECK (notes IS NULL OR (length(trim(notes)) > 0 AND instr(notes, char(0)) = 0)),
  created_by_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  created_at INTEGER NOT NULL CHECK (created_at BETWEEN 0 AND 8640000000000000)
) STRICT;

CREATE TABLE order_state_history (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0 AND instr(id, char(0)) = 0),
  order_id TEXT NOT NULL REFERENCES orders(order_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  state TEXT NOT NULL CHECK (state IN ('pending_confirmation', 'confirmed', 'cancelled')),
  actor_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  occurred_at INTEGER NOT NULL CHECK (occurred_at BETWEEN 0 AND 8640000000000000)
) STRICT;

CREATE TABLE payment_history (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0 AND instr(id, char(0)) = 0),
  order_id TEXT NOT NULL REFERENCES orders(order_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  state TEXT NOT NULL CHECK (state IN ('unpaid', 'partially_paid', 'paid')),
  amount_collected_rp INTEGER NOT NULL CHECK (amount_collected_rp BETWEEN 0 AND 2147483647),
  actor_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  occurred_at INTEGER NOT NULL CHECK (occurred_at BETWEEN 0 AND 8640000000000000)
) STRICT;

CREATE TABLE fulfillment_history (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0 AND instr(id, char(0)) = 0),
  order_id TEXT NOT NULL REFERENCES orders(order_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  state TEXT NOT NULL CHECK (
    state IN ('not_processed', 'assigned_or_carried_by_pic', 'received_by_buyer', 'problematic')
  ),
  actor_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  occurred_at INTEGER NOT NULL CHECK (occurred_at BETWEEN 0 AND 8640000000000000)
) STRICT;

CREATE TABLE remittance_history (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(trim(id)) > 0 AND instr(id, char(0)) = 0),
  order_id TEXT NOT NULL REFERENCES orders(order_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  state TEXT NOT NULL CHECK (state IN ('not_remitted', 'remitted', 'audited')),
  amount_remitted_rp INTEGER NOT NULL CHECK (amount_remitted_rp BETWEEN 0 AND 2147483647),
  actor_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  occurred_at INTEGER NOT NULL CHECK (occurred_at BETWEEN 0 AND 8640000000000000)
) STRICT;

-- An order must conform to its existing activity mode. Campus data may omit
-- regional contact/location data; regional orders require it. Both require an
-- active PIC when created or reassigned, but historical attribution can remain
-- after later PIC deactivation.
CREATE TRIGGER order_matches_activity_mode_on_insert
BEFORE INSERT ON orders
BEGIN
  SELECT CASE WHEN (SELECT mode FROM activities WHERE id = NEW.activity_id) = 'campus'
    AND (NEW.pickup_point IS NULL OR length(trim(NEW.pickup_point)) = 0)
    THEN RAISE(ABORT, 'campus order requires pickup point') END;
  SELECT CASE WHEN (SELECT mode FROM activities WHERE id = NEW.activity_id) = 'regional'
    AND (NEW.regional_area IS NULL OR NEW.buyer_phone IS NULL OR NEW.buyer_address IS NULL)
    THEN RAISE(ABORT, 'regional order requires area, contact, and address') END;
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM committee_members
    WHERE id = NEW.assigned_pic_committee_member_id AND active = 1
  ) THEN RAISE(ABORT, 'order PIC must be an active committee member') END;
END;

CREATE TRIGGER order_matches_activity_mode_on_update
BEFORE UPDATE OF activity_id, buyer_phone, buyer_address, regional_area, pickup_point,
  assigned_pic_committee_member_id ON orders
BEGIN
  SELECT CASE WHEN (SELECT mode FROM activities WHERE id = NEW.activity_id) = 'campus'
    AND (NEW.pickup_point IS NULL OR length(trim(NEW.pickup_point)) = 0)
    THEN RAISE(ABORT, 'campus order requires pickup point') END;
  SELECT CASE WHEN (SELECT mode FROM activities WHERE id = NEW.activity_id) = 'regional'
    AND (NEW.regional_area IS NULL OR NEW.buyer_phone IS NULL OR NEW.buyer_address IS NULL)
    THEN RAISE(ABORT, 'regional order requires area, contact, and address') END;
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM committee_members
    WHERE id = NEW.assigned_pic_committee_member_id AND active = 1
  ) THEN RAISE(ABORT, 'order PIC must be an active committee member') END;
END;

-- Order IDs are immutable at the schema boundary in addition to the
-- application contract. Closed-record/correction policy belongs to T006.
CREATE TRIGGER order_id_is_immutable
BEFORE UPDATE OF order_id ON orders
BEGIN
  SELECT RAISE(ABORT, 'order ID is immutable');
END;

CREATE TRIGGER order_is_not_deletable
BEFORE DELETE ON orders
BEGIN
  SELECT RAISE(ABORT, 'order records are retained');
END;

-- Histories are append-only. A correction/void is an approved later event, not
-- a rewrite or deletion of the original operational/financial record.
CREATE TRIGGER order_state_history_is_append_only_on_update
BEFORE UPDATE ON order_state_history
BEGIN
  SELECT RAISE(ABORT, 'order state history is append-only');
END;
CREATE TRIGGER order_state_history_is_append_only_on_delete
BEFORE DELETE ON order_state_history
BEGIN
  SELECT RAISE(ABORT, 'order state history is append-only');
END;
CREATE TRIGGER payment_history_is_append_only_on_update
BEFORE UPDATE ON payment_history
BEGIN
  SELECT RAISE(ABORT, 'payment history is append-only');
END;
CREATE TRIGGER payment_history_is_append_only_on_delete
BEFORE DELETE ON payment_history
BEGIN
  SELECT RAISE(ABORT, 'payment history is append-only');
END;
CREATE TRIGGER fulfillment_history_is_append_only_on_update
BEFORE UPDATE ON fulfillment_history
BEGIN
  SELECT RAISE(ABORT, 'fulfillment history is append-only');
END;
CREATE TRIGGER fulfillment_history_is_append_only_on_delete
BEFORE DELETE ON fulfillment_history
BEGIN
  SELECT RAISE(ABORT, 'fulfillment history is append-only');
END;
CREATE TRIGGER remittance_history_is_append_only_on_update
BEFORE UPDATE ON remittance_history
BEGIN
  SELECT RAISE(ABORT, 'remittance history is append-only');
END;
CREATE TRIGGER remittance_history_is_append_only_on_delete
BEFORE DELETE ON remittance_history
BEGIN
  SELECT RAISE(ABORT, 'remittance history is append-only');
END;

CREATE INDEX orders_activity_order_id ON orders(activity_id, order_id);
CREATE INDEX orders_assigned_pic ON orders(assigned_pic_committee_member_id);
CREATE INDEX order_state_history_latest ON order_state_history(order_id, occurred_at DESC, id DESC);
CREATE INDEX payment_history_latest ON payment_history(order_id, occurred_at DESC, id DESC);
CREATE INDEX fulfillment_history_latest ON fulfillment_history(order_id, occurred_at DESC, id DESC);
CREATE INDEX remittance_history_latest ON remittance_history(order_id, occurred_at DESC, id DESC);
