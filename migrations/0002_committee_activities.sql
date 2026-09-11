-- T004 controlled attribution and single-product activity setup. Committee
-- members deliberately have no account reference: attribution never grants login access.
CREATE TABLE divisions (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) > 0),
  name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0 AND instr(name, char(0)) = 0),
  active INTEGER NOT NULL CHECK (active IN (0, 1))
) STRICT;

CREATE TABLE committee_members (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) > 0),
  display_name TEXT NOT NULL CHECK (length(trim(display_name)) > 0 AND instr(display_name, char(0)) = 0),
  division_id TEXT NOT NULL REFERENCES divisions(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  active INTEGER NOT NULL CHECK (active IN (0, 1))
) STRICT;

CREATE TABLE activities (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) > 0),
  product_name TEXT NOT NULL CHECK (length(trim(product_name)) > 0 AND instr(product_name, char(0)) = 0),
  mode TEXT NOT NULL CHECK (mode IN ('campus', 'regional')),
  unit_purchase_price_rp INTEGER NOT NULL CHECK (unit_purchase_price_rp BETWEEN 0 AND 2147483647),
  unit_selling_price_rp INTEGER NOT NULL CHECK (unit_selling_price_rp BETWEEN 0 AND 2147483647),
  target_quantity INTEGER NOT NULL CHECK (target_quantity BETWEEN 1 AND 2147483647),
  period TEXT NOT NULL CHECK (length(trim(period)) > 0 AND instr(period, char(0)) = 0),
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'closed'))
) STRICT;

CREATE TABLE additional_costs (
  id TEXT PRIMARY KEY NOT NULL CHECK (length(id) > 0),
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  amount_rp INTEGER NOT NULL CHECK (amount_rp BETWEEN 0 AND 2147483647),
  purpose TEXT NOT NULL CHECK (length(trim(purpose)) > 0 AND instr(purpose, char(0)) = 0)
) STRICT;

CREATE TABLE campus_activity_configs (
  activity_id TEXT PRIMARY KEY NOT NULL REFERENCES activities(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  pickup_point TEXT NOT NULL CHECK (length(trim(pickup_point)) > 0 AND instr(pickup_point, char(0)) = 0),
  pic_committee_member_id TEXT NOT NULL REFERENCES committee_members(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) STRICT;

CREATE TABLE regional_activity_configs (
  activity_id TEXT PRIMARY KEY NOT NULL REFERENCES activities(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  area_name TEXT NOT NULL CHECK (length(trim(area_name)) > 0 AND instr(area_name, char(0)) = 0),
  pic_committee_member_id TEXT NOT NULL REFERENCES committee_members(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) STRICT;

-- The configuration table must match the one stored mode. A mode cannot change
-- after its matching configuration exists; T016 owns later edit policy.
CREATE TRIGGER campus_config_matches_activity_on_insert
BEFORE INSERT ON campus_activity_configs
BEGIN
  SELECT CASE WHEN (SELECT mode FROM activities WHERE id = NEW.activity_id) <> 'campus'
    THEN RAISE(ABORT, 'campus configuration requires campus activity') END;
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM committee_members WHERE id = NEW.pic_committee_member_id AND active = 1
  ) THEN RAISE(ABORT, 'campus PIC must be an active committee member') END;
END;

CREATE TRIGGER campus_config_matches_activity_on_update
BEFORE UPDATE OF activity_id, pic_committee_member_id ON campus_activity_configs
BEGIN
  SELECT CASE WHEN (SELECT mode FROM activities WHERE id = NEW.activity_id) <> 'campus'
    THEN RAISE(ABORT, 'campus configuration requires campus activity') END;
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM committee_members WHERE id = NEW.pic_committee_member_id AND active = 1
  ) THEN RAISE(ABORT, 'campus PIC must be an active committee member') END;
END;

CREATE TRIGGER regional_config_matches_activity_on_insert
BEFORE INSERT ON regional_activity_configs
BEGIN
  SELECT CASE WHEN (SELECT mode FROM activities WHERE id = NEW.activity_id) <> 'regional'
    THEN RAISE(ABORT, 'regional configuration requires regional activity') END;
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM committee_members WHERE id = NEW.pic_committee_member_id AND active = 1
  ) THEN RAISE(ABORT, 'regional PIC must be an active committee member') END;
END;

CREATE TRIGGER regional_config_matches_activity_on_update
BEFORE UPDATE OF activity_id, pic_committee_member_id ON regional_activity_configs
BEGIN
  SELECT CASE WHEN (SELECT mode FROM activities WHERE id = NEW.activity_id) <> 'regional'
    THEN RAISE(ABORT, 'regional configuration requires regional activity') END;
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM committee_members WHERE id = NEW.pic_committee_member_id AND active = 1
  ) THEN RAISE(ABORT, 'regional PIC must be an active committee member') END;
END;

CREATE TRIGGER activity_mode_cannot_conflict_with_existing_config
BEFORE UPDATE OF mode ON activities
WHEN (NEW.mode = 'campus' AND EXISTS (
  SELECT 1 FROM regional_activity_configs WHERE activity_id = NEW.id
)) OR (NEW.mode = 'regional' AND EXISTS (
  SELECT 1 FROM campus_activity_configs WHERE activity_id = NEW.id
))
BEGIN
  SELECT RAISE(ABORT, 'activity mode conflicts with its existing configuration');
END;

-- An attributed member remains active until configuration is changed or removed.
CREATE TRIGGER attributed_committee_member_must_remain_active
BEFORE UPDATE OF active ON committee_members
WHEN NEW.active = 0 AND OLD.active = 1 AND (
  EXISTS (SELECT 1 FROM campus_activity_configs WHERE pic_committee_member_id = OLD.id)
  OR EXISTS (SELECT 1 FROM regional_activity_configs WHERE pic_committee_member_id = OLD.id)
)
BEGIN
  SELECT RAISE(ABORT, 'attributed PIC must remain active');
END;

CREATE INDEX activities_status ON activities(status);
CREATE INDEX activities_period ON activities(period);
CREATE INDEX committee_members_division ON committee_members(division_id);
CREATE INDEX committee_members_active ON committee_members(id) WHERE active = 1;
CREATE INDEX additional_costs_activity ON additional_costs(activity_id);
