import { env } from "cloudflare:workers";
import { applyD1Migrations } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import type {
  AccountRow, ActivityRow, AuditEventRow, CampusActivityConfigRow, CommitteeMemberRow,
  CorrectionApprovalRow, CorrectionRow, DivisionRow, FinancialEffectProposalRow,
  IdempotencyKeyRow, IssueRow, OrderRow,
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
  return 1_701_000_000_000 + offset;
}

async function createOrderContext(db: D1Database) {
  const suffix = `t006-${++fixtureSequence}`;
  const coordinator: AccountRow = {
    id: `synthetic-coordinator-${suffix}`, username: `synthetic.coordinator.${fixtureSequence}`,
    role: "coordinator", password_hash: [1, 2, 3], password_salt: [4, 5, 6],
    password_version: 1, password_parameters: '{"synthetic":true}',
    active: 1, must_change_password: 0, failure_count: 0, locked_until: null,
  };
  const member: AccountRow = {
    ...coordinator, id: `synthetic-member-${suffix}`, username: `synthetic.member.${fixtureSequence}`,
    role: "member", password_hash: [7, 8, 9], password_salt: [10, 11, 12],
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
  const campusConfig: CampusActivityConfigRow = {
    activity_id: activity.id, pickup_point: `Titik Sintetis ${suffix}`,
    pic_committee_member_id: pic.id,
  };
  const order: OrderRow = {
    order_id: `synthetic-order-${suffix}`, activity_id: activity.id, source_type: "manual",
    buyer_name: `Pembeli Sintetis ${suffix}`, buyer_phone: null, buyer_address: null,
    buyer_map_reference: null, attributed_committee_member_id: pic.id,
    attributed_division_id: division.id, attribution_note: "Relasi sintetis",
    regional_area: null, pickup_point: campusConfig.pickup_point,
    assigned_pic_committee_member_id: pic.id, quantity: 2, payment_method: "transfer",
    payment_proof_reference: null, payment_proof_filename: null, payment_proof_mime_type: null,
    notes: "Catatan sintetis", created_by_account_id: coordinator.id, created_at: timestamp(fixtureSequence),
  };
  await insert(db, "accounts", coordinator);
  await insert(db, "accounts", member);
  await insert(db, "divisions", division);
  await insert(db, "committee_members", pic);
  await insert(db, "activities", activity);
  await insert(db, "campus_activity_configs", campusConfig);
  await insert(db, "orders", order);
  return { coordinator, member, order };
}

function issueRow(order: OrderRow, reporter: AccountRow): IssueRow {
  return {
    id: `synthetic-issue-${order.order_id}`, target_type: "order", target_id: order.order_id,
    issue_type: "typo", reason: "Perbaikan sintetis diperlukan", reported_by_account_id: reporter.id,
    reported_at: timestamp(fixtureSequence + 10),
  };
}

function correctionRow(issue: IssueRow, proposer: AccountRow): CorrectionRow {
  return {
    id: `synthetic-correction-${issue.id}`, issue_id: issue.id, target_type: issue.target_type,
    target_id: issue.target_id, correction_kind: "data_correction",
    before_json: '{"field":"quantity","value":2}', after_json: '{"field":"quantity","value":1}',
    reason: "Kuantitas sintetis dikoreksi", proposed_by_account_id: proposer.id,
    proposed_at: timestamp(fixtureSequence + 11), approval_required: 0,
  };
}

function financialCorrectionRow(issue: IssueRow, proposer: AccountRow, kind: FinancialEffectProposalRow["effect_kind"] = "refund"): CorrectionRow {
  return {
    ...correctionRow(issue, proposer), id: `synthetic-financial-${issue.id}-${kind}`,
    correction_kind: kind, before_json: '{"amount_rp":12000}', after_json: '{"amount_rp":0}',
    reason: "Efek keuangan sintetis perlu ditinjau", approval_required: 1,
  };
}

function financialEffectRow(correction: CorrectionRow): FinancialEffectProposalRow {
  return {
    id: `synthetic-effect-${correction.id}`, correction_id: correction.id,
    effect_kind: correction.correction_kind as FinancialEffectProposalRow["effect_kind"],
    amount_rp: 12_000, proposed_at: timestamp(fixtureSequence + 12),
  };
}

function auditRow(correction: CorrectionRow, actor: AccountRow): AuditEventRow {
  return {
    id: `synthetic-audit-${correction.id}`, entity_type: "correction", entity_id: correction.id,
    action: "correction_proposed", before_json: '{"field":"quantity","value":2}',
    after_json: '{"field":"quantity","value":1}', reason: correction.reason,
    actor_account_id: actor.id, occurred_at: timestamp(fixtureSequence + 13),
  };
}

function approvalAuditRow(approval: CorrectionApprovalRow, actor: AccountRow): AuditEventRow {
  return {
    id: approval.audit_event_id, entity_type: "correction_approval", entity_id: approval.id,
    action: "financial_correction_decided", before_json: null, after_json: null, reason: null,
    actor_account_id: actor.id, occurred_at: approval.decided_at,
  };
}

function idempotencyRow(account: AccountRow, order: OrderRow): IdempotencyKeyRow {
  return {
    account_id: account.id, route: `/api/orders/${order.order_id}/payment`,
    idempotency_key: `synthetic-key-${order.order_id}`, request_hash: [1, 2, 3, 4],
    result_status: "succeeded", result_kind: "order_history", result_reference: "synthetic-payment-result",
    created_at: timestamp(fixtureSequence + 14), expires_at: timestamp(fixtureSequence + 15),
  };
}

describe("T006 audit, correction, approval, and idempotency schema", () => {
  beforeAll(async () => {
    await applyD1Migrations(env.TEST_DB, env.TEST_MIGRATIONS);
  });

  it("keeps a correction's target, before/after, reason, proposer/time, and minimal audit event queryable", async () => {
    const { coordinator, member, order } = await createOrderContext(env.TEST_DB);
    const issue = issueRow(order, member);
    const correction = correctionRow(issue, member);
    await insert(env.TEST_DB, "issues", issue);
    await insert(env.TEST_DB, "corrections", correction);
    await insert(env.TEST_DB, "audit_events", auditRow(correction, coordinator));

    expect(await env.TEST_DB.prepare(
      "SELECT target_type, target_id, before_json, after_json, reason, proposed_by_account_id, proposed_at, approval_required FROM corrections WHERE id = ?",
    ).bind(correction.id).first()).toEqual({
      target_type: "order", target_id: order.order_id, before_json: correction.before_json,
      after_json: correction.after_json, reason: correction.reason, proposed_by_account_id: member.id,
      proposed_at: correction.proposed_at, approval_required: 0,
    });
    expect(await env.TEST_DB.prepare(
      "SELECT entity_type, entity_id, action, actor_account_id FROM audit_events WHERE id = ?",
    ).bind(`synthetic-audit-${correction.id}`).first()).toEqual({
      entity_type: "correction", entity_id: correction.id, action: "correction_proposed", actor_account_id: coordinator.id,
    });
  });

  it("permits one Coordinator/Deputy decision only after a matching financial-effect proposal", async () => {
    const { coordinator, member, order } = await createOrderContext(env.TEST_DB);
    const issue = issueRow(order, member);
    const correction = financialCorrectionRow(issue, member);
    const effect = financialEffectRow(correction);
    const approval: CorrectionApprovalRow = {
      id: `synthetic-approval-${correction.id}`, correction_id: correction.id, decision: "approved",
      approver_account_id: coordinator.id, decided_at: timestamp(fixtureSequence + 13),
      audit_event_id: `synthetic-approval-audit-${correction.id}`,
    };
    await insert(env.TEST_DB, "issues", issue);
    await insert(env.TEST_DB, "corrections", correction);
    await insert(env.TEST_DB, "financial_effect_proposals", effect);
    await insert(env.TEST_DB, "audit_events", approvalAuditRow(approval, coordinator));
    await insert(env.TEST_DB, "correction_approvals", approval);
    expect(await env.TEST_DB.prepare(
      "SELECT effect_kind, amount_rp FROM financial_effect_proposals WHERE correction_id = ?",
    ).bind(correction.id).first()).toEqual({ effect_kind: "refund", amount_rp: 12_000 });
    expect(await env.TEST_DB.prepare(
      "SELECT decision, approver_account_id, decided_at FROM correction_approvals WHERE correction_id = ?",
    ).bind(correction.id).first()).toEqual({
      decision: "approved", approver_account_id: coordinator.id, decided_at: approval.decided_at,
    });
  });

  it("rejects mismatched targets and contradictory financial approval/resolution states on raw writes", async () => {
    const first = await createOrderContext(env.TEST_DB);
    const firstIssue = issueRow(first.order, first.member);
    await insert(env.TEST_DB, "issues", firstIssue);
    await expect(insert(env.TEST_DB, "corrections", {
      ...correctionRow(firstIssue, first.member), target_id: "synthetic-other-target",
    })).rejects.toThrow(/match its issue/i);
    await expect(insert(env.TEST_DB, "corrections", {
      ...correctionRow(firstIssue, first.member), id: `synthetic-early-${firstIssue.id}`,
      proposed_at: firstIssue.reported_at - 1,
    })).rejects.toThrow(/cannot predate its issue/i);
    await expect(insert(env.TEST_DB, "corrections", {
      ...financialCorrectionRow(firstIssue, first.member), approval_required: 0,
    })).rejects.toThrow(/CHECK/i);

    const nonFinancial = correctionRow(firstIssue, first.member);
    await insert(env.TEST_DB, "corrections", nonFinancial);
    await expect(insert(env.TEST_DB, "correction_approvals", {
      id: `synthetic-approval-${nonFinancial.id}`, correction_id: nonFinancial.id, decision: "approved",
      approver_account_id: first.coordinator.id, decided_at: timestamp(fixtureSequence + 20),
      audit_event_id: `synthetic-approval-audit-${nonFinancial.id}`,
    })).rejects.toThrow(/only approval-required/i);

    const second = await createOrderContext(env.TEST_DB);
    const secondIssue = issueRow(second.order, second.member);
    const unproposed = financialCorrectionRow(secondIssue, second.member, "void");
    await insert(env.TEST_DB, "issues", secondIssue);
    await insert(env.TEST_DB, "corrections", unproposed);
    await expect(insert(env.TEST_DB, "correction_approvals", {
      id: `synthetic-approval-${unproposed.id}`, correction_id: unproposed.id, decision: "approved",
      approver_account_id: second.coordinator.id, decided_at: timestamp(fixtureSequence + 21),
      audit_event_id: `synthetic-approval-audit-${unproposed.id}`,
    })).rejects.toThrow(/requires its financial effect proposal/i);
    await expect(insert(env.TEST_DB, "financial_effect_proposals", {
      ...financialEffectRow(unproposed), effect_kind: "refund",
    })).rejects.toThrow(/must match an approval-required correction/i);

    const third = await createOrderContext(env.TEST_DB);
    const thirdIssue = issueRow(third.order, third.member);
    const decided = financialCorrectionRow(thirdIssue, third.member, "loss_classification");
    const effect = financialEffectRow(decided);
    await insert(env.TEST_DB, "issues", thirdIssue);
    await insert(env.TEST_DB, "corrections", decided);
    await insert(env.TEST_DB, "financial_effect_proposals", effect);
    await expect(insert(env.TEST_DB, "correction_approvals", {
      id: `synthetic-early-decision-${decided.id}`, correction_id: decided.id, decision: "approved",
      approver_account_id: third.coordinator.id, decided_at: effect.proposed_at - 1,
      audit_event_id: `synthetic-approval-audit-early-${decided.id}`,
    })).rejects.toThrow(/cannot predate its proposal/i);
    await expect(insert(env.TEST_DB, "correction_approvals", {
      id: `synthetic-member-decision-${decided.id}`, correction_id: decided.id, decision: "approved",
      approver_account_id: third.member.id, decided_at: timestamp(fixtureSequence + 22),
      audit_event_id: `synthetic-approval-audit-member-${decided.id}`,
    })).rejects.toThrow(/only coordinator or deputy/i);
    const rejected: CorrectionApprovalRow = {
      id: `synthetic-rejected-${decided.id}`, correction_id: decided.id, decision: "rejected",
      approver_account_id: third.coordinator.id, decided_at: timestamp(fixtureSequence + 23),
      audit_event_id: `synthetic-approval-audit-rejected-${decided.id}`,
    };
    await insert(env.TEST_DB, "audit_events", approvalAuditRow(rejected, third.coordinator));
    await insert(env.TEST_DB, "correction_approvals", rejected);
    const conflicting: CorrectionApprovalRow = {
      id: `synthetic-conflicting-${decided.id}`, correction_id: decided.id, decision: "approved",
      approver_account_id: third.coordinator.id, decided_at: timestamp(fixtureSequence + 24),
      audit_event_id: `synthetic-approval-audit-conflicting-${decided.id}`,
    };
    await insert(env.TEST_DB, "audit_events", approvalAuditRow(conflicting, third.coordinator));
    await expect(insert(env.TEST_DB, "correction_approvals", conflicting)).rejects.toThrow(/UNIQUE/i);

    const fourth = await createOrderContext(env.TEST_DB);
    const fourthIssue = issueRow(fourth.order, fourth.member);
    const unaudited = financialCorrectionRow(fourthIssue, fourth.member, "financial_correction");
    const unauditedApproval: CorrectionApprovalRow = {
      id: `synthetic-unaudited-${unaudited.id}`, correction_id: unaudited.id, decision: "approved",
      approver_account_id: fourth.coordinator.id, decided_at: timestamp(fixtureSequence + 25),
      audit_event_id: `synthetic-missing-audit-${unaudited.id}`,
    };
    await insert(env.TEST_DB, "issues", fourthIssue);
    await insert(env.TEST_DB, "corrections", unaudited);
    await insert(env.TEST_DB, "financial_effect_proposals", financialEffectRow(unaudited));
    await expect(insert(env.TEST_DB, "correction_approvals", unauditedApproval))
      .rejects.toThrow(/requires its matching audit event/i);
  });

  it("rejects unredacted audit snapshot fields and makes all T006 history append-only", async () => {
    const { coordinator, member, order } = await createOrderContext(env.TEST_DB);
    const issue = issueRow(order, member);
    const correction = financialCorrectionRow(issue, member);
    const effect = financialEffectRow(correction);
    const approval: CorrectionApprovalRow = {
      id: `synthetic-approval-${correction.id}`, correction_id: correction.id, decision: "approved",
      approver_account_id: coordinator.id, decided_at: timestamp(fixtureSequence + 30),
      audit_event_id: `synthetic-approval-audit-${correction.id}`,
    };
    const audit = auditRow(correction, coordinator);
    const key = idempotencyRow(coordinator, order);
    await insert(env.TEST_DB, "issues", issue);
    await insert(env.TEST_DB, "corrections", correction);
    await insert(env.TEST_DB, "financial_effect_proposals", effect);
    await expect(insert(env.TEST_DB, "audit_events", {
      ...audit, id: `${audit.id}-incomplete`, before_json: null, after_json: null, reason: null,
    })).rejects.toThrow(/requires a correction and redacted change summary/i);
    await insert(env.TEST_DB, "audit_events", audit);
    await insert(env.TEST_DB, "audit_events", approvalAuditRow(approval, coordinator));
    await insert(env.TEST_DB, "correction_approvals", approval);
    await insert(env.TEST_DB, "idempotency_keys", key);
    await expect(insert(env.TEST_DB, "audit_events", {
      ...audit, id: `${audit.id}-unredacted`,
      before_json: JSON.stringify({ ["buyer" + "_name"]: "synthetic" }),
    })).rejects.toThrow(/redacted/i);

    const auditColumns = await env.TEST_DB.prepare("PRAGMA table_info(audit_events)").all<{ name: string }>();
    expect(auditColumns.results.some((column) => /password|session|token|buyer|phone|address|map|proof/i.test(column.name))).toBe(false);
    for (const statement of [
      env.TEST_DB.prepare("UPDATE issues SET reason = 'changed' WHERE id = ?").bind(issue.id),
      env.TEST_DB.prepare("DELETE FROM corrections WHERE id = ?").bind(correction.id),
      env.TEST_DB.prepare("UPDATE financial_effect_proposals SET amount_rp = 1 WHERE id = ?").bind(effect.id),
      env.TEST_DB.prepare("DELETE FROM correction_approvals WHERE id = ?").bind(approval.id),
      env.TEST_DB.prepare("UPDATE audit_events SET action = 'changed' WHERE id = ?").bind(audit.id),
      env.TEST_DB.prepare("DELETE FROM idempotency_keys WHERE account_id = ? AND route = ? AND idempotency_key = ?")
        .bind(key.account_id, key.route, key.idempotency_key),
    ]) {
      await expect(statement.run()).rejects.toThrow(/append-only/i);
    }
  });

  it("binds one safe stored result to account, route, key, and request hash", async () => {
    const { coordinator, member, order } = await createOrderContext(env.TEST_DB);
    const key = idempotencyRow(coordinator, order);
    await insert(env.TEST_DB, "idempotency_keys", key);
    expect(await env.TEST_DB.prepare(
      "SELECT result_status, result_kind, result_reference, request_hash FROM idempotency_keys WHERE account_id = ? AND route = ? AND idempotency_key = ?",
    ).bind(key.account_id, key.route, key.idempotency_key).first()).toEqual({
      result_status: "succeeded", result_kind: "order_history", result_reference: "synthetic-payment-result", request_hash: [1, 2, 3, 4],
    });
    await expect(insert(env.TEST_DB, "idempotency_keys", key)).rejects.toThrow(/UNIQUE/i);
    await expect(insert(env.TEST_DB, "idempotency_keys", { ...key, request_hash: [4, 3, 2, 1] }))
      .rejects.toThrow(/different request/i);
    await insert(env.TEST_DB, "idempotency_keys", { ...key, route: `/api/orders/${order.order_id}/fulfillment` });
    await insert(env.TEST_DB, "idempotency_keys", { ...key, account_id: member.id });
    await expect(insert(env.TEST_DB, "idempotency_keys", {
      ...key, idempotency_key: `${key.idempotency_key}-invalid`, result_status: "failed",
      result_kind: "order", result_reference: null,
    })).rejects.toThrow(/CHECK/i);
    await expect(insert(env.TEST_DB, "idempotency_keys", {
      ...key, idempotency_key: `${key.idempotency_key}-route`, route: "/orders",
    })).rejects.toThrow(/CHECK/i);
  });

  it("uses strict tables, indexes, and foreign keys for audit and idempotency retrieval", async () => {
    const { coordinator, member, order } = await createOrderContext(env.TEST_DB);
    const issue = issueRow(order, member);
    const correction = correctionRow(issue, member);
    const audit = auditRow(correction, coordinator);
    const key = idempotencyRow(coordinator, order);
    await insert(env.TEST_DB, "issues", issue);
    await insert(env.TEST_DB, "corrections", correction);
    await insert(env.TEST_DB, "audit_events", audit);
    await insert(env.TEST_DB, "idempotency_keys", key);
    const strictTables = await env.TEST_DB.prepare("PRAGMA table_list").all<{ name: string; strict: number }>();
    const names = ["issues", "corrections", "financial_effect_proposals", "correction_approvals", "audit_events", "idempotency_keys"];
    expect(strictTables.results.filter((table) => names.includes(table.name)).every((table) => table.strict === 1)).toBe(true);
    for (const [table, index] of [
      ["issues", "issues_target"], ["corrections", "corrections_target"],
      ["audit_events", "audit_events_entity"], ["idempotency_keys", "idempotency_keys_expiry"],
    ]) {
      const indexes = await env.TEST_DB.prepare(`PRAGMA index_list(${table})`).all<{ name: string }>();
      expect(indexes.results).toContainEqual(expect.objectContaining({ name: index }));
    }
    for (const query of [
      `SELECT id FROM issues WHERE target_type = 'order' AND target_id = '${order.order_id}' ORDER BY reported_at DESC, id DESC`,
      `SELECT id FROM corrections WHERE target_type = 'order' AND target_id = '${order.order_id}' ORDER BY proposed_at DESC, id DESC`,
      `SELECT id FROM audit_events WHERE entity_type = 'correction' AND entity_id = '${correction.id}' ORDER BY occurred_at DESC, id DESC`,
      `SELECT result_reference FROM idempotency_keys WHERE account_id = '${key.account_id}' AND route = '${key.route}' AND idempotency_key = '${key.idempotency_key}'`,
    ]) {
      const plan = await env.TEST_DB.prepare(`EXPLAIN QUERY PLAN ${query}`).all<{ detail: string }>();
      expect(plan.results.some((row) => /USING (?:COVERING )?INDEX/.test(row.detail))).toBe(true);
    }
    expect((await env.TEST_DB.prepare("PRAGMA foreign_key_check").all()).results).toEqual([]);
  });
});

describe("T006 migration lifecycle on separate disposable D1 databases", () => {
  it("upgrades T005 data, creates no rows, and repeats as a no-op", async () => {
    const db = env.TEST_UPGRADE_DB;
    expect(env.TEST_MIGRATIONS.map((migration) => migration.name)).toEqual([
      "0001_identity_sessions.sql", "0002_committee_activities.sql", "0003_orders_states.sql",
      "0004_audit_corrections_idempotency.sql",
    ]);
    await applyD1Migrations(db, env.TEST_MIGRATIONS.slice(0, 3));
    const context = await createOrderContext(db);
    await applyD1Migrations(db, env.TEST_MIGRATIONS);
    expect(await count(db, "d1_migrations")).toBe(4);
    expect(await count(db, "issues")).toBe(0);
    expect(await db.prepare("SELECT order_id FROM orders WHERE order_id = ?").bind(context.order.order_id).first("order_id"))
      .toBe(context.order.order_id);
    const before = await db.prepare("SELECT type, name, sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all();
    for (let retry = 0; retry < 2; retry++) await applyD1Migrations(db, env.TEST_MIGRATIONS);
    expect((await db.prepare("SELECT type, name, sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all()).results)
      .toEqual(before.results);
  });

  it("rolls back a failed T006 DDL batch and safely retries the original migration", async () => {
    const db = env.TEST_ROLLBACK_DB;
    await applyD1Migrations(db, env.TEST_MIGRATIONS.slice(0, 3));
    const original = env.TEST_MIGRATIONS[3];
    const broken = { ...original, queries: [...original.queries, "INSERT INTO synthetic_missing_table VALUES (1)"] };
    await expect(applyD1Migrations(db, [broken])).rejects.toThrow(/no such table/);
    expect(await db.prepare("SELECT name FROM sqlite_schema WHERE name = 'issues'").first()).toBeNull();
    expect(await count(db, "d1_migrations")).toBe(3);
    await applyD1Migrations(db, env.TEST_MIGRATIONS);
    expect(await count(db, "d1_migrations")).toBe(4);
    expect(await db.prepare("SELECT name FROM sqlite_schema WHERE name = 'idempotency_keys'").first("name"))
      .toBe("idempotency_keys");
  });
});
