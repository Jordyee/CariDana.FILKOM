import * as XLSX from "xlsx";
import { env, SELF } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { derivePbkdf2 } from "../src/auth";

describe("synthetic Worker compatibility spike", () => {
  beforeAll(async () => {
    await env.DB.exec("CREATE TABLE IF NOT EXISTS spike_probe (id INTEGER PRIMARY KEY AUTOINCREMENT, marker TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)");
  });

  it("serves a static asset and a Hono API route", async () => {
    const asset = await SELF.fetch("https://example.test/");
    expect(asset.status).toBe(200);
    expect(await asset.text()).toContain("Static asset compatibility proof");
    const api = await SELF.fetch("https://example.test/api/health");
    expect(await api.json()).toMatchObject({ ok: true });
  });

  it("writes and reads a synthetic D1 row after the versioned migration", async () => {
    await env.DB.exec("DELETE FROM spike_probe");
    const response = await SELF.fetch("https://example.test/api/d1-probe", { method: "POST" });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ count: 1 });
  });

  it("sets a secure, HttpOnly, SameSite cookie without exposing a token", async () => {
    const response = await SELF.fetch("https://example.test/api/session-probe", { method: "POST" });
    const cookie = response.headers.get("Set-Cookie") ?? "";
    expect(cookie).toMatch(/^spike_session=[a-f0-9]{64};/);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
  });

  it("benchmarks PBKDF2-HMAC-SHA-256 in the Worker runtime at the candidate parameter", async () => {
    const start = performance.now();
    const hash = await derivePbkdf2("synthetic-password", crypto.getRandomValues(new Uint8Array(16)), 600_000);
    const elapsedMs = performance.now() - start;
    console.info(`PBKDF2 synthetic benchmark: iterations=600000 elapsed_ms=${elapsedMs.toFixed(2)}`);
    expect(hash.byteLength).toBe(32);
    expect(elapsedMs).toBeLessThan(10_000);
  });

  it("generates a downloadable XLSX with all four required groups", async () => {
    const response = await SELF.fetch("https://example.test/api/report-probe.xlsx");
    expect(response.headers.get("Content-Disposition")).toContain("attachment");
    const workbook = XLSX.read(await response.arrayBuffer(), { type: "array" });
    expect(workbook.SheetNames).toEqual(["1 Product Target", "2 All Revenue", "3 Problems", "4 Final Decision"]);
    expect(workbook.Sheets["2 All Revenue"]?.C3?.f).toBe("B2*C2");
    expect(workbook.Sheets["2 All Revenue"]?.A2?.l?.Target).toContain("example.invalid");
    expect(workbook.Sheets["2 All Revenue"]?.A7?.v).toBe("Committee Chair");
  });
});
