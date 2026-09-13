import { env } from "cloudflare:workers";
import { applyD1Migrations } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import type {
  AccountRow, ActivityRow, CampusActivityConfigRow, CommitteeMemberRow, DivisionRow,
  FulfillmentHistoryRow, OrderRow, OrderStateHistoryRow, PaymentHistoryRow,
  RegionalActivityConfigRow, RemittanceHistoryRow,
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
  return 1_700_000_000_000 + offset;
}

async function createOrderContext(db: D1Database, mode: "campus" | "regional") {
  const suffix = `t005-${++fixtureSequence}`;
  const account: AccountRow = {
    id: `synthetic-account-${suffix}`, username: `synthetic.${suffix}`,
    role: "coordinator", password_hash: [1, 2, 3], password_salt: [4, 5, 6],
    password_version: 1, password_parameters: '{"synthetic":true}',
    active: 1, must_change_password: 0, failure_count: 0, locked_until: null,
  };
  const division: DivisionRow = {
    id: `synthetic-division-${suffix}`, name: `Divisi Sintetis ${suffix}`, active: 1,
  };
  const pic: CommitteeMemberRow = {
    id: `synthetic-pic-${suffix}`, display_name: `PIC Sintetis ${suffix}`,
    division_id: division.id, active: 1,
  };
  const activity: ActivityRow = {
    id: `synthetic-activity-${suffix}`, product_name: "Nasi Jaha Sintetis", mode,
    unit_purchase_price_rp: 12_000, unit_selling_price_rp: 18_000, target_quantity: 50,
    period: "2026-09", status: "active",
  };
  await insert(db, "accounts", account);
  await insert(db, "divisions", division);
  await insert(db, "committee_members", pic);
  await insert(db, "activities", activity);
  if (mode === "campus") {
    const config: CampusActivityConfigRow = {
      activity_id: activity.id, pickup_point: `Titik Sintetis ${suffix}`,
      pic_committee_member_id: pic.id,
    };
    await insert(db, "campus_activity_configs", config);
  } else {
    const config: RegionalActivityConfigRow = {
      activity_id: activity.id, area_name: `Wilayah Sintetis ${suffix}`,
      pic_committee_member_id: pic.id,
    };
    await insert(db, "regional_activity_configs", config);
  }
  const order: OrderRow = {
    order_id: `synthetic-order-${suffix}`, activity_id: activity.id, source_type: "manual",
    buyer_name: `Pembeli Sintetis ${suffix}`,
    buyer_phone: mode === "regional" ? `SYNTHETIC-PHONE-${suffix}` : null,
    buyer_address: mode === "regional" ? `ALAMAT-SINTETIS-${suffix}` : null,
    buyer_map_reference: mode === "regional" ? `https://maps.example.invalid/synthetic-${suffix}` : null,
    attributed_committee_member_id: pic.id, attributed_division_id: division.id,
    attribution_note: "Relasi sintetis", regional_area: mode === "regional" ? `Wilayah Sintetis ${suffix}` : null,
    pickup_point: mode === "campus" ? `Titik Sintetis ${suffix}` : null,
    assigned_pic_committee_member_id: pic.id, quantity: 2, payment_method: "transfer",
    payment_proof_reference: `https://proof.example.invalid/synthetic-${suffix}`,
    payment_proof_filename: `bukti-sintetis-${suffix}.png`, payment_proof_mime_type: "image/png",
    notes: "Catatan sintetis", created_by_account_id: account.id, created_at: timestamp(fixtureSequence),
  };
  return { account, activity, division, order, pic };
}

function stateRows(orderId: string, actorAccountId: string) {
  const orderState: OrderStateHistoryRow = {
    id: `synthetic-order-state-${orderId}-a`, order_id: orderId,
    state: "pending_confirmation", actor_account_id: actorAccountId, occurred_at: timestamp(10),
  };
  const payment: PaymentHistoryRow = {
    id: `synthetic-payment-${orderId}-a`, order_id: orderId,
    state: "unpaid", amount_collected_rp: 0, actor_account_id: actorAccountId, occurred_at: timestamp(11),
  };
  const fulfillment: FulfillmentHistoryRow = {
    id: `synthetic-fulfillment-${orderId}-a`, order_id: orderId,
    state: "not_processed", actor_account_id: actorAccountId, occurred_at: timestamp(12),
  };
  const remittance: RemittanceHistoryRow = {
    id: `synthetic-remittance-${orderId}-a`, order_id: orderId,
    state: "not_remitted", amount_remitted_rp: 0, actor_account_id: actorAccountId, occurred_at: timestamp(13),
  };
  return { fulfillment, orderState, payment, remittance };
}

describe("T005 order and independent-state schema", () => {
  beforeAll(async () => {
    await applyD1Migrations(env.TEST_DB, env.TEST_MIGRATIONS);
  });

  it("creates an immutable manual order with no Sheet identity and metadata-only proof storage", async () => {
    const { account, order } = await createOrderContext(env.TEST_DB, "campus");
    await insert(env.TEST_DB, "orders", order);
    expect(await env.TEST_DB.prepare("SELECT order_id, source_type, pickup_point, regional_area FROM orders WHERE order_id = ?")
      .bind(order.order_id).first()).toEqual({
      order_id: order.order_id, source_type: "manual", pickup_point: order.pickup_point, regional_area: null,
    });
    const columns = await env.TEST_DB.prepare("PRAGMA table_info(orders)").all<{ name: string; type: string }>();
    expect(columns.results.map((column) => column.name)).toEqual(Object.keys(order));
    expect(columns.results.some((column) => /sheet|source_row/i.test(column.name))).toBe(false);
    expect(columns.results.some((column) => /blob/i.test(column.type))).toBe(false);
    await expect(env.TEST_DB.prepare("UPDATE orders SET order_id = 'synthetic-order-rewritten'").run())
      .rejects.toThrow(/immutable/i);
    await expect(env.TEST_DB.prepare("DELETE FROM orders WHERE order_id = ?").bind(order.order_id).run())
      .rejects.toThrow(/retained/i);
    await expect(env.TEST_DB.prepare("DELETE FROM accounts WHERE id = ?").bind(account.id).run())
      .rejects.toThrow(/FOREIGN KEY/);
  });

  it("allows the distinct form_sync source without adding source-row fields", async () => {
    const { order } = await createOrderContext(env.TEST_DB, "campus");
    await insert(env.TEST_DB, "orders", { ...order, source_type: "form_sync" });
    expect(await env.TEST_DB.prepare("SELECT source_type FROM orders WHERE order_id = ?").bind(order.order_id).first("source_type"))
      .toBe("form_sync");
  });

  it("requires pickup/PIC for campus and area/contact/address/PIC for regional orders", async () => {
    const campus = await createOrderContext(env.TEST_DB, "campus");
    await expect(insert(env.TEST_DB, "orders", { ...campus.order, pickup_point: null }))
      .rejects.toThrow(/campus order requires pickup point/i);
    await insert(env.TEST_DB, "orders", campus.order);

    const regional = await createOrderContext(env.TEST_DB, "regional");
    for (const field of ["regional_area", "buyer_phone", "buyer_address"] as const) {
      await expect(insert(env.TEST_DB, "orders", { ...regional.order, [field]: null }))
        .rejects.toThrow(/regional order requires area, contact, and address/i);
    }
    await insert(env.TEST_DB, "orders", regional.order);
    const inactivePic: CommitteeMemberRow = { ...regional.pic, id: `${regional.pic.id}-inactive`, active: 0 };
    await insert(env.TEST_DB, "committee_members", inactivePic);
    await expect(insert(env.TEST_DB, "orders", {
      ...regional.order, order_id: `${regional.order.order_id}-inactive-pic`, assigned_pic_committee_member_id: inactivePic.id,
    })).rejects.toThrow(/order PIC must be an active committee member/i);
    await expect(env.TEST_DB.prepare("UPDATE orders SET pickup_point = NULL WHERE order_id = ?").bind(campus.order.order_id).run())
      .rejects.toThrow(/campus order requires pickup point/i);
    await expect(env.TEST_DB.prepare("UPDATE orders SET buyer_address = NULL WHERE order_id = ?").bind(regional.order.order_id).run())
      .rejects.toThrow(/regional order requires area, contact, and address/i);
  });

  it("rejects duplicate IDs, invalid sources, float-like quantities, and binary proof data on raw writes", async () => {
    const { order } = await createOrderContext(env.TEST_DB, "campus");
    await insert(env.TEST_DB, "orders", order);
    await expect(insert(env.TEST_DB, "orders", { ...order, source_type: "sheet" })).rejects.toThrow(/UNIQUE|CHECK/i);
    await expect(insert(env.TEST_DB, "orders", { ...order, order_id: `${order.order_id}-bad-source`, source_type: "sheet" }))
      .rejects.toThrow(/CHECK/i);
    await expect(insert(env.TEST_DB, "orders", { ...order, order_id: `${order.order_id}-fraction`, quantity: 1.5 }))
      .rejects.toThrow(/CHECK|datatype/i);
    await expect(env.TEST_DB.prepare("UPDATE orders SET quantity = 0.5 WHERE order_id = ?").bind(order.order_id).run())
      .rejects.toThrow(/CHECK|datatype/i);
    await expect(env.TEST_DB.prepare("UPDATE orders SET payment_proof_reference = ? WHERE order_id = ?")
      .bind(new Uint8Array([1, 2]), order.order_id).run()).rejects.toThrow(/datatype|TEXT/i);
  });

  it("records and retrieves the latest state and actor independently on every axis", async () => {
    const { account, order } = await createOrderContext(env.TEST_DB, "regional");
    await insert(env.TEST_DB, "orders", order);
    const initial = stateRows(order.order_id, account.id);
    await insert(env.TEST_DB, "order_state_history", initial.orderState);
    await insert(env.TEST_DB, "payment_history", initial.payment);
    await insert(env.TEST_DB, "fulfillment_history", initial.fulfillment);
    await insert(env.TEST_DB, "remittance_history", initial.remittance);
    const latestActor = `${account.id}-latest`;
    await insert(env.TEST_DB, "accounts", { ...account, id: latestActor, username: `${account.username}.latest` });
    await insert(env.TEST_DB, "order_state_history", {
      ...initial.orderState, id: `${initial.orderState.id}-latest`, state: "confirmed", actor_account_id: latestActor, occurred_at: timestamp(20),
    });
    await insert(env.TEST_DB, "payment_history", {
      ...initial.payment, id: `${initial.payment.id}-latest`, state: "partially_paid", amount_collected_rp: 12_000, actor_account_id: latestActor, occurred_at: timestamp(21),
    });
    await insert(env.TEST_DB, "fulfillment_history", {
      ...initial.fulfillment, id: `${initial.fulfillment.id}-latest`, state: "received_by_buyer", actor_account_id: latestActor, occurred_at: timestamp(22),
    });
    await insert(env.TEST_DB, "remittance_history", {
      ...initial.remittance, id: `${initial.remittance.id}-latest`, state: "remitted", amount_remitted_rp: 12_000, actor_account_id: latestActor, occurred_at: timestamp(23),
    });
    for (const [table, state] of [
      ["order_state_history", "confirmed"], ["payment_history", "partially_paid"],
      ["fulfillment_history", "received_by_buyer"], ["remittance_history", "remitted"],
    ]) {
      expect(await env.TEST_DB.prepare(`SELECT state, actor_account_id FROM ${table} WHERE order_id = ? ORDER BY occurred_at DESC, id DESC LIMIT 1`)
        .bind(order.order_id).first()).toEqual({ state, actor_account_id: latestActor });
    }
    expect(await env.TEST_DB.prepare("SELECT typeof(amount_collected_rp) AS collected, typeof(amount_remitted_rp) AS remitted FROM payment_history, remittance_history WHERE payment_history.id = ? AND remittance_history.id = ?")
      .bind(`${initial.payment.id}-latest`, `${initial.remittance.id}-latest`).first()).toEqual({ collected: "integer", remitted: "integer" });
  });

  it("rejects invalid states, fractional or negative money, orphan events, and history rewrites", async () => {
    const { account, order } = await createOrderContext(env.TEST_DB, "campus");
    await insert(env.TEST_DB, "orders", order);
    const initial = stateRows(order.order_id, account.id);
    await expect(insert(env.TEST_DB, "order_state_history", { ...initial.orderState, state: "ready" })).rejects.toThrow(/CHECK/i);
    await expect(insert(env.TEST_DB, "payment_history", { ...initial.payment, state: "overpaid" })).rejects.toThrow(/CHECK/i);
    await expect(insert(env.TEST_DB, "payment_history", { ...initial.payment, amount_collected_rp: 0.5 })).rejects.toThrow(/CHECK|datatype/i);
    await expect(insert(env.TEST_DB, "payment_history", { ...initial.payment, amount_collected_rp: -1 })).rejects.toThrow(/CHECK/i);
    await expect(insert(env.TEST_DB, "fulfillment_history", { ...initial.fulfillment, state: "delivered" })).rejects.toThrow(/CHECK/i);
    await expect(insert(env.TEST_DB, "remittance_history", { ...initial.remittance, state: "settled" })).rejects.toThrow(/CHECK/i);
    await expect(insert(env.TEST_DB, "remittance_history", { ...initial.remittance, amount_remitted_rp: -1 })).rejects.toThrow(/CHECK/i);
    await expect(insert(env.TEST_DB, "remittance_history", { ...initial.remittance, order_id: "synthetic-missing-order" }))
      .rejects.toThrow(/FOREIGN KEY/i);
    await insert(env.TEST_DB, "order_state_history", initial.orderState);
    await insert(env.TEST_DB, "payment_history", initial.payment);
    await insert(env.TEST_DB, "fulfillment_history", initial.fulfillment);
    await insert(env.TEST_DB, "remittance_history", initial.remittance);
    for (const [table, id] of [
      ["order_state_history", initial.orderState.id], ["payment_history", initial.payment.id],
      ["fulfillment_history", initial.fulfillment.id], ["remittance_history", initial.remittance.id],
    ]) {
      await expect(env.TEST_DB.prepare(`UPDATE ${table} SET occurred_at = ? WHERE id = ?`).bind(timestamp(99), id).run())
        .rejects.toThrow(/append-only/i);
      await expect(env.TEST_DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run())
        .rejects.toThrow(/append-only/i);
    }
  });

  it("has strict tables and indexes for order/PIC lookup and latest independent histories", async () => {
    const { account, order } = await createOrderContext(env.TEST_DB, "campus");
    await insert(env.TEST_DB, "orders", order);
    const initial = stateRows(order.order_id, account.id);
    await insert(env.TEST_DB, "order_state_history", initial.orderState);
    await insert(env.TEST_DB, "payment_history", initial.payment);
    await insert(env.TEST_DB, "fulfillment_history", initial.fulfillment);
    await insert(env.TEST_DB, "remittance_history", initial.remittance);
    const expectedIndexes: [string, string][] = [
      ["orders", "orders_activity_order_id"], ["orders", "orders_assigned_pic"],
      ["order_state_history", "order_state_history_latest"], ["payment_history", "payment_history_latest"],
      ["fulfillment_history", "fulfillment_history_latest"], ["remittance_history", "remittance_history_latest"],
    ];
    const tables = await env.TEST_DB.prepare("PRAGMA table_list").all<{ name: string; strict: number }>();
    expect(tables.results.filter((table) => ["orders", "order_state_history", "payment_history", "fulfillment_history", "remittance_history"].includes(table.name))
      .every((table) => table.strict === 1)).toBe(true);
    for (const [table, index] of expectedIndexes) {
      const indexes = await env.TEST_DB.prepare(`PRAGMA index_list(${table})`).all<{ name: string }>();
      expect(indexes.results).toContainEqual(expect.objectContaining({ name: index }));
    }
    for (const query of [
      `SELECT order_id FROM orders WHERE activity_id = '${order.activity_id}' AND order_id = '${order.order_id}'`,
      `SELECT order_id FROM orders WHERE assigned_pic_committee_member_id = '${order.assigned_pic_committee_member_id}'`,
      ...["order_state_history", "payment_history", "fulfillment_history", "remittance_history"].map(
        (table) => `SELECT state, actor_account_id FROM ${table} WHERE order_id = '${order.order_id}' ORDER BY occurred_at DESC, id DESC LIMIT 1`,
      ),
    ]) {
      const plan = await env.TEST_DB.prepare(`EXPLAIN QUERY PLAN ${query}`).all<{ detail: string }>();
      expect(plan.results.some((row) => /USING (?:COVERING )?INDEX/.test(row.detail))).toBe(true);
    }
    expect((await env.TEST_DB.prepare("PRAGMA foreign_key_check").all()).results).toEqual([]);
  });
});

describe("T005 migration lifecycle on separate disposable D1 databases", () => {
  it("upgrades the T004 schema, preserves existing rows, and repeats as a no-op", async () => {
    const db = env.TEST_UPGRADE_DB;
    expect(env.TEST_MIGRATIONS.map((migration) => migration.name)).toEqual([
      "0001_identity_sessions.sql", "0002_committee_activities.sql", "0003_orders_states.sql",
      "0004_audit_corrections_idempotency.sql", "0005_sync_reports.sql",
    ]);
    await applyD1Migrations(db, env.TEST_MIGRATIONS.slice(0, 2));
    const context = await createOrderContext(db, "campus");
    expect(await count(db, "activities")).toBe(1);
    await applyD1Migrations(db, env.TEST_MIGRATIONS);
    expect(await count(db, "d1_migrations")).toBe(5);
    expect(await count(db, "orders")).toBe(0);
    expect(await db.prepare("SELECT id FROM accounts WHERE id = ?").bind(context.account.id).first("id")).toBe(context.account.id);
    const before = await db.prepare("SELECT type, name, sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all();
    await applyD1Migrations(db, env.TEST_MIGRATIONS);
    expect((await db.prepare("SELECT type, name, sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all()).results)
      .toEqual(before.results);
  });

  it("rolls back a failed T005 DDL batch and safely applies the original migration", async () => {
    const db = env.TEST_ROLLBACK_DB;
    await applyD1Migrations(db, env.TEST_MIGRATIONS.slice(0, 2));
    const original = env.TEST_MIGRATIONS[2];
    const broken = { ...original, queries: [...original.queries, "INSERT INTO synthetic_missing_table VALUES (1)"] };
    await expect(applyD1Migrations(db, [broken])).rejects.toThrow(/no such table/);
    expect(await db.prepare("SELECT name FROM sqlite_schema WHERE name = 'orders'").first()).toBeNull();
    expect(await count(db, "d1_migrations")).toBe(2);
    await applyD1Migrations(db, env.TEST_MIGRATIONS);
    expect(await count(db, "d1_migrations")).toBe(5);
    expect(await db.prepare("SELECT name FROM sqlite_schema WHERE name = 'remittance_history'").first("name")).toBe("remittance_history");
  });
});
