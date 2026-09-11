import { env } from "cloudflare:workers";
import { applyD1Migrations } from "cloudflare:test";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type {
  ActivityRow, AdditionalCostRow, CampusActivityConfigRow, CommitteeMemberRow,
  DivisionRow, RegionalActivityConfigRow,
} from "../../src/db/schema";

const division: DivisionRow = { id: "division-synthetic", name: "Operasional Sintetis", active: 1 };
const member: CommitteeMemberRow = {
  id: "member-synthetic", display_name: "Komite Sintetis", division_id: division.id, active: 1,
};
const activity: ActivityRow = {
  id: "activity-campus", product_name: "Produk Sintetis", mode: "campus",
  unit_purchase_price_rp: 12000, unit_selling_price_rp: 18000, target_quantity: 50,
  period: "2026-09", status: "draft",
};
const cost: AdditionalCostRow = {
  id: "cost-synthetic", activity_id: activity.id, amount_rp: 0, purpose: "Kemasan sintetis",
};
const campusConfig: CampusActivityConfigRow = {
  activity_id: activity.id, pickup_point: "Titik kampus sintetis", pic_committee_member_id: member.id,
};

function insert(db: D1Database, table: string, row: object) {
  const keys = Object.keys(row);
  return db.prepare(`INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`)
    .bind(...Object.values(row)).run();
}
async function count(db: D1Database, table: string) {
  return db.prepare(`SELECT count(*) FROM ${table}`).first<number>("count(*)");
}
async function insertBase(db: D1Database) {
  await insert(db, "divisions", division);
  await insert(db, "committee_members", member);
}

describe("T004 committee/activity schema", () => {
  beforeAll(async () => {
    await applyD1Migrations(env.TEST_DB, env.TEST_MIGRATIONS);
  });
  beforeEach(async () => {
    await env.TEST_DB.batch([
      env.TEST_DB.prepare("DELETE FROM additional_costs"),
      env.TEST_DB.prepare("DELETE FROM campus_activity_configs"),
      env.TEST_DB.prepare("DELETE FROM regional_activity_configs"),
      env.TEST_DB.prepare("DELETE FROM activities"),
      env.TEST_DB.prepare("DELETE FROM committee_members"),
      env.TEST_DB.prepare("DELETE FROM divisions"),
    ]);
  });

  it("keeps committee attribution independent from login accounts", async () => {
    await insertBase(env.TEST_DB);
    const columns = await env.TEST_DB.prepare("PRAGMA table_info(committee_members)").all<{ name: string }>();
    expect(columns.results.map((column) => column.name)).toEqual(Object.keys(member));
    expect((await env.TEST_DB.prepare("PRAGMA foreign_key_list(committee_members)").all()).results)
      .toEqual([expect.objectContaining({ table: "divisions", from: "division_id", to: "id" })]);
    expect(await env.TEST_DB.prepare("SELECT count(*) FROM accounts").first("count(*)")).toBe(0);
  });

  it("stores a one-product campus activity, optional integer-rupiah cost, and active PIC", async () => {
    await insertBase(env.TEST_DB);
    await insert(env.TEST_DB, "activities", activity);
    await insert(env.TEST_DB, "additional_costs", cost);
    await insert(env.TEST_DB, "campus_activity_configs", campusConfig);
    expect(await env.TEST_DB.prepare("SELECT product_name, mode, target_quantity, status FROM activities").first())
      .toEqual({ product_name: activity.product_name, mode: "campus", target_quantity: 50, status: "draft" });
    expect(await env.TEST_DB.prepare("SELECT typeof(amount_rp) AS type, purpose FROM additional_costs").first())
      .toEqual({ type: "integer", purpose: cost.purpose });
  });

  it("stores a regional activity only with its area and active PIC configuration", async () => {
    await insertBase(env.TEST_DB);
    const regionalActivity: ActivityRow = { ...activity, id: "activity-regional", mode: "regional", status: "active" };
    const regionalConfig: RegionalActivityConfigRow = {
      activity_id: regionalActivity.id, area_name: "Area sintetis", pic_committee_member_id: member.id,
    };
    await insert(env.TEST_DB, "activities", regionalActivity);
    await insert(env.TEST_DB, "regional_activity_configs", regionalConfig);
    expect(await env.TEST_DB.prepare("SELECT area_name, pic_committee_member_id FROM regional_activity_configs").first())
      .toEqual({ area_name: regionalConfig.area_name, pic_committee_member_id: member.id });
  });

  const invalidActivityValues: [string, unknown][] = [
    ["id", ""], ["product_name", ""], ["product_name", "  "], ["mode", "hybrid"], ["mode", null],
    ["unit_purchase_price_rp", -1], ["unit_purchase_price_rp", 0.5], ["unit_purchase_price_rp", null],
    ["unit_selling_price_rp", -1], ["unit_selling_price_rp", 0.5], ["unit_selling_price_rp", null],
    ["target_quantity", 0], ["target_quantity", -1], ["target_quantity", 0.5], ["target_quantity", null],
    ["period", ""], ["period", "  "], ["status", "paused"], ["status", null],
  ];
  it.each(invalidActivityValues)("rejects invalid activity field %s (case %#) on insert and update", async (field, value) => {
    await expect(insert(env.TEST_DB, "activities", { ...activity, [field]: value })).rejects.toThrow(/CHECK|NOT NULL|datatype/i);
    await insert(env.TEST_DB, "activities", activity);
    await expect(env.TEST_DB.prepare(`UPDATE activities SET ${field} = ?`).bind(value).run()).rejects.toThrow(/CHECK|NOT NULL|datatype/i);
  });

  const invalidCostValues: [string, unknown][] = [
    ["id", ""], ["activity_id", "missing-activity"], ["amount_rp", -1], ["amount_rp", 0.5], ["amount_rp", null],
    ["purpose", ""], ["purpose", "  "], ["purpose", "\0"], ["purpose", null],
  ];
  it.each(invalidCostValues)("rejects invalid additional cost field %s (case %#) on insert and update", async (field, value) => {
    await insert(env.TEST_DB, "activities", activity);
    await expect(insert(env.TEST_DB, "additional_costs", { ...cost, [field]: value })).rejects.toThrow(/CHECK|NOT NULL|FOREIGN KEY|datatype/i);
    await insert(env.TEST_DB, "additional_costs", cost);
    await expect(env.TEST_DB.prepare(`UPDATE additional_costs SET ${field} = ?`).bind(value).run()).rejects.toThrow(/CHECK|NOT NULL|FOREIGN KEY|datatype/i);
  });

  it("requires each configuration to match its activity mode and makes a second mode impossible", async () => {
    await insertBase(env.TEST_DB);
    await insert(env.TEST_DB, "activities", activity);
    await insert(env.TEST_DB, "campus_activity_configs", campusConfig);
    const regional: RegionalActivityConfigRow = {
      activity_id: activity.id, area_name: "Area sintetis", pic_committee_member_id: member.id,
    };
    await expect(insert(env.TEST_DB, "regional_activity_configs", regional)).rejects.toThrow(/regional configuration requires regional activity/i);
    await expect(insert(env.TEST_DB, "campus_activity_configs", campusConfig)).rejects.toThrow(/UNIQUE/);
    await expect(env.TEST_DB.prepare("UPDATE activities SET mode = 'regional'").run()).rejects.toThrow(/conflicts/i);
    expect(await count(env.TEST_DB, "campus_activity_configs")).toBe(1);
    expect(await count(env.TEST_DB, "regional_activity_configs")).toBe(0);
  });

  it("requires an active PIC for configuration insert/update and for continued attribution", async () => {
    await insertBase(env.TEST_DB);
    await insert(env.TEST_DB, "activities", activity);
    await env.TEST_DB.prepare("UPDATE committee_members SET active = 0").run();
    await expect(insert(env.TEST_DB, "campus_activity_configs", campusConfig)).rejects.toThrow(/active committee member/i);
    await env.TEST_DB.prepare("UPDATE committee_members SET active = 1").run();
    await insert(env.TEST_DB, "campus_activity_configs", campusConfig);
    await expect(env.TEST_DB.prepare("UPDATE campus_activity_configs SET pic_committee_member_id = 'missing-member'").run())
      .rejects.toThrow(/active committee member/i);
    await expect(env.TEST_DB.prepare("UPDATE committee_members SET active = 0").run()).rejects.toThrow(/must remain active/i);
  });

  it("has strict FK-backed tables and indexes for activity status/period and member lookup", async () => {
    const tables = await env.TEST_DB.prepare("PRAGMA table_list").all<{ name: string; strict: number }>();
    const names = ["divisions", "committee_members", "activities", "additional_costs", "campus_activity_configs", "regional_activity_configs"];
    expect(tables.results.filter((table) => names.includes(table.name)).every((table) => table.strict === 1)).toBe(true);
    for (const [table, index] of [
      ["activities", "activities_status"], ["activities", "activities_period"],
      ["committee_members", "committee_members_division"], ["committee_members", "committee_members_active"],
    ]) {
      const indexes = await env.TEST_DB.prepare(`PRAGMA index_list(${table})`).all<{ name: string }>();
      expect(indexes.results).toContainEqual(expect.objectContaining({ name: index }));
    }
    await insertBase(env.TEST_DB);
    await insert(env.TEST_DB, "activities", activity);
    for (const query of [
      "SELECT id FROM activities WHERE status = 'draft'", "SELECT id FROM activities WHERE period = '2026-09'",
      "SELECT id FROM committee_members WHERE division_id = 'division-synthetic'",
      "SELECT id FROM committee_members WHERE active = 1",
    ]) {
      const plan = await env.TEST_DB.prepare(`EXPLAIN QUERY PLAN ${query}`).all<{ detail: string }>();
      expect(plan.results.some((row) => /USING (?:COVERING )?INDEX/.test(row.detail))).toBe(true);
    }
  });
});
