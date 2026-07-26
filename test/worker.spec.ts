import { strFromU8, unzipSync } from "fflate";
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
    const archive = unzipSync(new Uint8Array(await response.arrayBuffer()));
    const workbookXml = strFromU8(archive["xl/workbook.xml"]!);
    const worksheetXml = Object.entries(archive)
      .filter(([name]) => name.startsWith("xl/worksheets/sheet") && name.endsWith(".xml"))
      .map(([, bytes]) => strFromU8(bytes))
      .join("\n");
    const allXml = Object.values(archive).map((bytes) => strFromU8(bytes)).join("\n");

    expect(workbookXml).toContain('name="1 Product Target"');
    expect(workbookXml).toContain('name="2 All Revenue"');
    expect(workbookXml).toContain('name="3 Problems"');
    expect(workbookXml).toContain('name="4 Final Decision"');
    expect(worksheetXml).toContain("<f>B2*15000</f>");
    expect(worksheetXml).toContain("<f>SUM(C2:C2)</f>");
    expect(worksheetXml).toContain("HYPERLINK");
    expect(allXml).toContain("https://example.invalid/synthetic-evidence");
    expect(allXml).toContain("Committee Chair");
    expect(allXml).toContain("Treasurer");
    expect(allXml).toContain("FF1F2937");
    expect(allXml).toContain("[$Rp-421] #,##0");
  });
});
