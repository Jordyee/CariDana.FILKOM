import { env } from "cloudflare:workers";
import { applyD1Migrations } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import type {
  AccountRow, ActivityRow, CampusActivityConfigRow, CommitteeMemberRow, DivisionRow,
  OrderRow, ReportVersionRow, SheetConnectionRow, SheetOrderLinkRow, SyncRowRow, SyncRunRow,
} from "../../src/db/schema";

let fixtureSequence = 0;

function insert(db: D1Database, table: string, row: object) {
  const keys = Object.keys(row);
  return db.prepare(`INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`)
    .bind(...Object.values(row)).run();
}

async function count(db: D1Database, table: string) {
  return db.prepare(`SELECT count(*) FROM ${table}`).first<number>("count(*)");
}

function timestamp(offset: number) {
  return 1_702_000_000_000 + offset;
}

async function createOrderContext(db: D1Database) {
  const sequence = ++fixtureSequence;
  const suffix = `t007-${sequence}`;
  const coordinator: AccountRow = {
    id: `synthetic-coordinator-${suffix}`, username: `synthetic.coordinator.${sequence}`,
    role: "coordinator", password_hash: [1, 2, 3], password_salt: [4, 5, 6],
    password_version: 1, password_parameters: '{"synthetic":true}',
    active: 1, must_change_password: 0, failure_count: 0, locked_until: null,
  };
  const deputy: AccountRow = {
    ...coordinator, id: `synthetic-deputy-${suffix}`, username: `synthetic.deputy.${sequence}`,
    role: "deputy", password_hash: [7, 8, 9], password_salt: [10, 11, 12],
  };
  const member: AccountRow = {
    ...coordinator, id: `synthetic-member-${suffix}`, username: `synthetic.member.${sequence}`,
    role: "member", password_hash: [13, 14, 15], password_salt: [16, 17, 18],
  };
  const division: DivisionRow = {
    id: `synthetic-division-${suffix}`, name: `Divisi Sintetis ${suffix}`, active: 1,
  };
  const pic: CommitteeMemberRow = {
    id: `synthetic-pic-${suffix}`, display_name: `PIC Sintetis ${suffix}`,
    division_id: division.id, active: 1,
  };
  const activity: ActivityRow = {
    id: `synthetic-activity-${suffix}`, product_name: "Nasi Jaha Sintetis", mode: "campus",
    unit_purchase_price_rp: 12_000, unit_selling_price_rp: 18_000, target_quantity: 50,
    period: "2026-09", status: "active",
  };
  const campus: CampusActivityConfigRow = {
    activity_id: activity.id, pickup_point: `Titik Sintetis ${suffix}`,
    pic_committee_member_id: pic.id,
  };
  const orderBase: Omit<OrderRow, "order_id" | "source_type" | "buyer_name"> = {
    activity_id: activity.id, buyer_phone: null, buyer_address: null, buyer_map_reference: null,
    attributed_committee_member_id: pic.id, attributed_division_id: division.id,
    attribution_note: "Relasi sintetis", regional_area: null, pickup_point: campus.pickup_point,
    assigned_pic_committee_member_id: pic.id, quantity: 2, payment_method: "transfer",
    payment_proof_reference: null, payment_proof_filename: null, payment_proof_mime_type: null,
    notes: "Catatan sintetis", created_by_account_id: coordinator.id, created_at: timestamp(sequence),
  };
  const manual: OrderRow = {
    ...orderBase, order_id: `synthetic-manual-order-${suffix}`, source_type: "manual",
    buyer_name: `Pembeli Manual Sintetis ${suffix}`,
  };
  const form: OrderRow = {
    ...orderBase, order_id: `synthetic-form-order-${suffix}`, source_type: "form_sync",
    buyer_name: `Pembeli Form Sintetis ${suffix}`,
  };
  const secondForm: OrderRow = {
    ...orderBase, order_id: `synthetic-second-form-order-${suffix}`, source_type: "form_sync",
    buyer_name: `Pembeli Form Kedua Sintetis ${suffix}`,
  };
  for (const [table, row] of [
    ["accounts", coordinator], ["accounts", deputy], ["accounts", member], ["divisions", division],
    ["committee_members", pic], ["activities", activity], ["campus_activity_configs", campus],
    ["orders", manual], ["orders", form], ["orders", secondForm],
  ] as const) await insert(db, table, row);
  return { coordinator, deputy, member, activity, manual, form, secondForm };
}

function connectionRow(context: Awaited<ReturnType<typeof createOrderContext>>): SheetConnectionRow {
  const suffix = context.activity.id;
  return {
    id: `synthetic-connection-${suffix}`, activity_id: context.activity.id,
    sheet_identity: `PRIVATE_SYNTHETIC_SHEET_${suffix}`,
    tab_identity: `PRIVATE_SYNTHETIC_TAB_${suffix}`, mapping_version: "synthetic-v1",
    configured_by_account_id: context.coordinator.id, configured_at: timestamp(fixtureSequence + 1),
  };
}

function runRow(
  connection: SheetConnectionRow,
  actor: AccountRow,
  operation: SyncRunRow["operation"],
  suffix: string,
): SyncRunRow {
  const startedAt = timestamp(fixtureSequence + 10);
  return {
    id: `synthetic-run-${suffix}`, sheet_connection_id: connection.id, operation,
    result_status: "succeeded", mapping_version: connection.mapping_version,
    initiated_by_account_id: actor.id, started_at: startedAt, completed_at: startedAt + 1,
  };
}

function rowResult(
  run: SyncRunRow,
  connection: SheetConnectionRow,
  suffix: string,
  overrides: Partial<SyncRowRow> = {},
): SyncRowRow {
  return {
    id: `synthetic-row-${suffix}`, sync_run_id: run.id, sheet_connection_id: connection.id,
    source_row_identity: `synthetic-source-${suffix}`, outcome: "skipped",
    outcome_reason: "ID sintetis sudah tercatat", possible_manual_order_id: null,
    reviewer_decision: null, reviewed_by_account_id: null, reviewed_at: null,
    review_reason: null, selected_order_id: null, recorded_at: run.completed_at,
    ...overrides,
  };
}

function linkRow(
  connection: SheetConnectionRow,
  row: SyncRowRow,
  activityId: string,
  orderId: string,
  resolution: SheetOrderLinkRow["resolution"],
  actor: AccountRow,
  resolvedAt: number,
): SheetOrderLinkRow {
  return {
    id: `synthetic-link-${row.id}`, activity_id: activityId, sheet_connection_id: connection.id,
    source_row_identity: row.source_row_identity, order_id: orderId, resolution,
    sync_row_id: row.id, resolved_by_account_id: actor.id, resolved_at: resolvedAt,
  };
}

describe("T007 Sheet-sync and report-version schema", () => {
  beforeAll(async () => {
    await applyD1Migrations(env.TEST_DB, env.TEST_MIGRATIONS);
  });

  it("retains safe connection, preview/commit rows, reviewed links, and report provenance", async () => {
    const context = await createOrderContext(env.TEST_DB);
    const connection = connectionRow(context);
    await insert(env.TEST_DB, "sheet_connections", connection);

    const preview = runRow(connection, context.coordinator, "preview", `${context.activity.id}-preview`);
    const candidate = rowResult(preview, connection, `${context.activity.id}-candidate`, {
      outcome: "candidate", outcome_reason: null, possible_manual_order_id: context.manual.order_id,
    });
    await insert(env.TEST_DB, "sync_runs", preview);
    await insert(env.TEST_DB, "sync_rows", candidate);

    const commit = runRow(connection, context.deputy, "commit", `${context.activity.id}-commit`);
    const linked = rowResult(commit, connection, `${context.activity.id}-linked`, {
      outcome: "linked", outcome_reason: null, possible_manual_order_id: context.manual.order_id,
      reviewer_decision: "link_existing", reviewed_by_account_id: context.deputy.id,
      reviewed_at: commit.completed_at, review_reason: "Duplikasi manual sintetis ditautkan",
      selected_order_id: context.manual.order_id,
    });
    const imported = rowResult(commit, connection, `${context.activity.id}-imported`, {
      outcome: "imported", outcome_reason: null, possible_manual_order_id: context.manual.order_id,
      reviewer_decision: "import_separately", reviewed_by_account_id: context.deputy.id,
      reviewed_at: commit.completed_at, review_reason: "Respon Form sintetis diimpor terpisah",
      selected_order_id: context.form.order_id,
    });
    const failed = rowResult(commit, connection, `${context.activity.id}-failed`, {
      outcome: "failed", outcome_reason: "Baris sintetis tidak lengkap",
    });
    await insert(env.TEST_DB, "sync_runs", commit);
    await insert(env.TEST_DB, "sync_rows", linked);
    await insert(env.TEST_DB, "sync_rows", imported);
    await insert(env.TEST_DB, "sync_rows", failed);
    await insert(env.TEST_DB, "sheet_order_links", linkRow(
      connection, linked, context.activity.id, context.manual.order_id, "linked", context.deputy, commit.completed_at,
    ));
    await insert(env.TEST_DB, "sheet_order_links", linkRow(
      connection, imported, context.activity.id, context.form.order_id, "imported", context.deputy, commit.completed_at,
    ));

    const report: ReportVersionRow = {
      id: `synthetic-report-${context.activity.id}`, activity_id: context.activity.id,
      closed_activity_reference: `synthetic-closed-reference-${context.activity.id}`,
      generator_version: "synthetic-generator-v1", template_version: "synthetic-template-v1",
      checksum: "synthetic-checksum-v1", generated_by_account_id: context.coordinator.id,
      generated_at: timestamp(fixtureSequence + 20),
    };
    await insert(env.TEST_DB, "report_versions", report);

    expect(await env.TEST_DB.prepare(
      "SELECT operation, result_status, mapping_version FROM sync_runs WHERE id = ?",
    ).bind(commit.id).first()).toEqual({ operation: "commit", result_status: "succeeded", mapping_version: "synthetic-v1" });
    expect(await env.TEST_DB.prepare(
      "SELECT outcome, possible_manual_order_id, reviewer_decision, reviewed_by_account_id, review_reason, selected_order_id FROM sync_rows WHERE id = ?",
    ).bind(linked.id).first()).toEqual({
      outcome: "linked", possible_manual_order_id: context.manual.order_id, reviewer_decision: "link_existing",
      reviewed_by_account_id: context.deputy.id, review_reason: linked.review_reason, selected_order_id: context.manual.order_id,
    });
    expect(await env.TEST_DB.prepare(
      "SELECT resolution, order_id FROM sheet_order_links WHERE source_row_identity = ?",
    ).bind(imported.source_row_identity).first()).toEqual({ resolution: "imported", order_id: context.form.order_id });
    expect(await env.TEST_DB.prepare(
      "SELECT closed_activity_reference, generator_version, template_version, checksum, generated_by_account_id FROM report_versions WHERE id = ?",
    ).bind(report.id).first()).toEqual({
      closed_activity_reference: report.closed_activity_reference, generator_version: report.generator_version,
      template_version: report.template_version, checksum: report.checksum,
      generated_by_account_id: context.coordinator.id,
    });
  });

  it("rejects invalid operation/outcome, reviewer, source-type, and mapping combinations", async () => {
    const context = await createOrderContext(env.TEST_DB);
    const connection = connectionRow(context);
    await expect(insert(env.TEST_DB, "sheet_connections", { ...connection, mapping_version: "" })).rejects.toThrow(/CHECK/i);
    await insert(env.TEST_DB, "sheet_connections", connection);
    await expect(insert(env.TEST_DB, "sync_runs", {
      ...runRow(connection, context.member, "preview", `${context.activity.id}-member`),
    })).rejects.toThrow(/coordinator or deputy/i);
    await expect(insert(env.TEST_DB, "sync_runs", {
      ...runRow(connection, context.coordinator, "preview", `${context.activity.id}-mapping`), mapping_version: "synthetic-v2",
    })).rejects.toThrow(/mapping version/i);

    const preview = runRow(connection, context.coordinator, "preview", `${context.activity.id}-preview-invalid`);
    const commit = runRow(connection, context.coordinator, "commit", `${context.activity.id}-commit-invalid`);
    await insert(env.TEST_DB, "sync_runs", preview);
    await insert(env.TEST_DB, "sync_runs", commit);
    await expect(insert(env.TEST_DB, "sync_rows", rowResult(preview, connection, `${context.activity.id}-preview-import`, {
      outcome: "imported", outcome_reason: null, selected_order_id: context.form.order_id,
    }))).rejects.toThrow(/preview run/i);
    await expect(insert(env.TEST_DB, "sync_rows", rowResult(commit, connection, `${context.activity.id}-commit-candidate`, {
      outcome: "candidate", outcome_reason: null,
    }))).rejects.toThrow(/commit run/i);
    await expect(insert(env.TEST_DB, "sync_rows", rowResult(commit, connection, `${context.activity.id}-manual-import`, {
      outcome: "imported", outcome_reason: null, selected_order_id: context.manual.order_id,
    }))).rejects.toThrow(/form-sync/i);
    await expect(insert(env.TEST_DB, "sync_rows", rowResult(commit, connection, `${context.activity.id}-member-review`, {
      outcome: "imported", outcome_reason: null, possible_manual_order_id: context.manual.order_id,
      reviewer_decision: "import_separately", reviewed_by_account_id: context.member.id,
      reviewed_at: commit.completed_at, review_reason: "Keputusan sintetis", selected_order_id: context.form.order_id,
    }))).rejects.toThrow(/review/i);
  });

  it("keeps one committed source identity after a replay and rejects mismatched link evidence", async () => {
    const linksBeforeReplay = (await count(env.TEST_DB, "sheet_order_links")) ?? 0;
    const context = await createOrderContext(env.TEST_DB);
    const connection = connectionRow(context);
    await insert(env.TEST_DB, "sheet_connections", connection);
    const firstRun = runRow(connection, context.coordinator, "commit", `${context.activity.id}-first`);
    const firstRow = rowResult(firstRun, connection, `${context.activity.id}-retry`, {
      outcome: "imported", outcome_reason: null, selected_order_id: context.form.order_id,
    });
    await insert(env.TEST_DB, "sync_runs", firstRun);
    await insert(env.TEST_DB, "sync_rows", firstRow);
    const firstLink = linkRow(
      connection, firstRow, context.activity.id, context.form.order_id, "imported", context.coordinator, firstRun.completed_at,
    );
    await insert(env.TEST_DB, "sheet_order_links", firstLink);

    const replayRun = runRow(connection, context.coordinator, "commit", `${context.activity.id}-replay`);
    const replayRow = rowResult(replayRun, connection, `${context.activity.id}-retry-replay`, {
      source_row_identity: firstRow.source_row_identity,
      outcome: "imported", outcome_reason: null, selected_order_id: context.secondForm.order_id,
    });
    await insert(env.TEST_DB, "sync_runs", replayRun);
    await insert(env.TEST_DB, "sync_rows", replayRow);
    await expect(insert(env.TEST_DB, "sheet_order_links", linkRow(
      connection, replayRow, context.activity.id, context.secondForm.order_id, "imported", context.coordinator, replayRun.completed_at,
    ))).rejects.toThrow(/UNIQUE/i);
    await expect(insert(env.TEST_DB, "sheet_order_links", {
      ...linkRow(connection, replayRow, context.activity.id, context.secondForm.order_id, "imported", context.coordinator, replayRun.completed_at),
      id: `synthetic-mismatched-${replayRow.id}`, source_row_identity: "synthetic-other-source",
    })).rejects.toThrow(/match a committed sync row/i);
    expect(await count(env.TEST_DB, "sheet_order_links")).toBe(linksBeforeReplay + 1);
  });

  it("uses strict append-only tables and indexes without credential, workbook, or proof columns", async () => {
    const context = await createOrderContext(env.TEST_DB);
    const connection = connectionRow(context);
    const run = runRow(connection, context.coordinator, "commit", `${context.activity.id}-indexes`);
    const row = rowResult(run, connection, `${context.activity.id}-index-row`, {
      outcome: "imported", outcome_reason: null, selected_order_id: context.form.order_id,
    });
    const report: ReportVersionRow = {
      id: `synthetic-index-report-${context.activity.id}`, activity_id: context.activity.id,
      closed_activity_reference: `synthetic-closed-${context.activity.id}`,
      generator_version: "synthetic-generator-v1", template_version: "synthetic-template-v1",
      checksum: "synthetic-checksum-v1", generated_by_account_id: context.coordinator.id,
      generated_at: timestamp(fixtureSequence + 30),
    };
    await insert(env.TEST_DB, "sheet_connections", connection);
    await insert(env.TEST_DB, "sync_runs", run);
    await insert(env.TEST_DB, "sync_rows", row);
    await insert(env.TEST_DB, "sheet_order_links", linkRow(
      connection, row, context.activity.id, context.form.order_id, "imported", context.coordinator, run.completed_at,
    ));
    await insert(env.TEST_DB, "report_versions", report);

    const names = ["sheet_connections", "sync_runs", "sync_rows", "sheet_order_links", "report_versions"];
    const tables = await env.TEST_DB.prepare("PRAGMA table_list").all<{ name: string; strict: number }>();
    expect(tables.results.filter((table) => names.includes(table.name)).every((table) => table.strict === 1)).toBe(true);
    for (const table of ["sheet_connections", "sync_rows", "report_versions"]) {
      const columns = await env.TEST_DB.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
      expect(columns.results.some((column) => /credential|secret|token|workbook|blob|proof/i.test(column.name))).toBe(false);
    }
    for (const [table, index] of [
      ["sync_runs", "sync_runs_result"], ["sync_rows", "sync_rows_retry"],
      ["sync_rows", "sync_rows_run_result"], ["report_versions", "report_versions_closed_activity"],
    ]) {
      const indexes = await env.TEST_DB.prepare(`PRAGMA index_list(${table})`).all<{ name: string }>();
      expect(indexes.results).toContainEqual(expect.objectContaining({ name: index }));
    }
    for (const query of [
      `SELECT id FROM sync_rows WHERE sheet_connection_id = '${connection.id}' AND source_row_identity = '${row.source_row_identity}' ORDER BY recorded_at DESC, id DESC`,
      `SELECT id FROM sync_runs WHERE sheet_connection_id = '${connection.id}' AND operation = 'commit' AND result_status = 'succeeded' ORDER BY completed_at DESC, id DESC`,
      `SELECT id FROM report_versions WHERE activity_id = '${context.activity.id}' ORDER BY generated_at DESC, id DESC`,
    ]) {
      const plan = await env.TEST_DB.prepare(`EXPLAIN QUERY PLAN ${query}`).all<{ detail: string }>();
      expect(plan.results.some((entry) => /USING (?:COVERING )?INDEX/.test(entry.detail))).toBe(true);
    }
    for (const statement of [
      env.TEST_DB.prepare("UPDATE sync_runs SET result_status = 'failed' WHERE id = ?").bind(run.id),
      env.TEST_DB.prepare("DELETE FROM sync_rows WHERE id = ?").bind(row.id),
      env.TEST_DB.prepare("DELETE FROM sheet_order_links WHERE id = ?").bind(`synthetic-link-${row.id}`),
      env.TEST_DB.prepare("UPDATE report_versions SET checksum = 'changed' WHERE id = ?").bind(report.id),
      env.TEST_DB.prepare("UPDATE sheet_connections SET sheet_identity = 'changed' WHERE id = ?").bind(connection.id),
    ]) await expect(statement.run()).rejects.toThrow(/append-only|immutable/i);
    expect((await env.TEST_DB.prepare("PRAGMA foreign_key_check").all()).results).toEqual([]);
  });
});

describe("T007 migration lifecycle on separate disposable D1 databases", () => {
  it("upgrades T006 data, creates no rows, and repeats as a no-op", async () => {
    const db = env.TEST_UPGRADE_DB;
    expect(env.TEST_MIGRATIONS.map((migration) => migration.name)).toEqual([
      "0001_identity_sessions.sql", "0002_committee_activities.sql", "0003_orders_states.sql",
      "0004_audit_corrections_idempotency.sql", "0005_sync_reports.sql",
    ]);
    await applyD1Migrations(db, env.TEST_MIGRATIONS.slice(0, 4));
    const context = await createOrderContext(db);
    await applyD1Migrations(db, env.TEST_MIGRATIONS);
    expect(await count(db, "d1_migrations")).toBe(5);
    expect(await count(db, "sheet_connections")).toBe(0);
    expect(await count(db, "report_versions")).toBe(0);
    expect(await db.prepare("SELECT order_id FROM orders WHERE order_id = ?").bind(context.manual.order_id).first("order_id"))
      .toBe(context.manual.order_id);
    const before = await db.prepare("SELECT type, name, sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all();
    for (let retry = 0; retry < 2; retry++) await applyD1Migrations(db, env.TEST_MIGRATIONS);
    expect((await db.prepare("SELECT type, name, sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all()).results)
      .toEqual(before.results);
  });

  it("rolls back a failed T007 DDL batch and safely retries the original migration", async () => {
    const db = env.TEST_ROLLBACK_DB;
    await applyD1Migrations(db, env.TEST_MIGRATIONS.slice(0, 4));
    const original = env.TEST_MIGRATIONS[4];
    const broken = { ...original, queries: [...original.queries, "INSERT INTO synthetic_missing_table VALUES (1)"] };
    await expect(applyD1Migrations(db, [broken])).rejects.toThrow(/no such table/);
    expect(await db.prepare("SELECT name FROM sqlite_schema WHERE name = 'sheet_connections'").first()).toBeNull();
    expect(await count(db, "d1_migrations")).toBe(4);
    await applyD1Migrations(db, env.TEST_MIGRATIONS);
    expect(await count(db, "d1_migrations")).toBe(5);
    expect(await db.prepare("SELECT name FROM sqlite_schema WHERE name = 'report_versions'").first("name"))
      .toBe("report_versions");
  });
});
