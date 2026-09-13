// Optional local browser evidence. Uses externally supplied Playwright, no new
// project dependency. Never build this harness into a deployed Worker.
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { Miniflare, Log, LogLevel } from "miniflare";
import { readD1Migrations } from "@cloudflare/vitest-pool-workers";

const playwrightPath = process.env.SESSION_TEST_PLAYWRIGHT;
if (!playwrightPath) throw new Error("Set SESSION_TEST_PLAYWRIGHT to an installed Playwright module");
const { chromium } = await import(pathToFileURL(playwrightPath).href);
const bundled = await build({
  stdin: { contents: `
    import { createApp } from './src/app.ts';
    import { SessionService, sessionCookie } from './src/auth/session.ts';
    const app = createApp();
    export default { async fetch(request, env, ctx) {
      // Local-only fixture handoff. Bundled in memory, not written to dist.
      if (new URL(request.url).pathname === '/synthetic/issue') {
        const row = await env.DB.prepare('SELECT id, session_version FROM accounts LIMIT 1').first();
        const session = await new SessionService(env.DB).issue(row.id, row.session_version);
        if (!session) return new Response(null, {status:401});
        return new Response(null, {status:204, headers:{'Set-Cookie':sessionCookie(session)}});
      }
      return app.fetch(request, env, ctx);
    }};
  `, resolveDir: process.cwd(), sourcefile: "synthetic-browser-harness.ts" },
  bundle: true, write: false, format: "esm", platform: "browser", target: "es2022",
});

const mf = new Miniflare({
  script: bundled.outputFiles[0].text, modules: true, compatibilityDate: "2026-07-26",
  host: "127.0.0.1", port: 0, https: true, d1Databases: ["DB"], d1Persist: false,
  log: new Log(LogLevel.NONE),
  outboundService: () => new Response("TEST_NETWORK_BLOCKED", { status: 599 }),
  serviceBindings: { ASSETS: () => new Response("<!doctype html><html lang='id'><title>Sesi sintetis</title><p>Verifikasi sesi lokal</p></html>",
    { headers: { "Content-Type": "text/html" } }) },
});
let browser;
let stage = "local setup";
try {
  const address = (await mf.ready).origin;
  const db = await mf.getD1Database("DB");
  for (const migration of await readD1Migrations("./migrations")) {
    await db.batch(migration.queries.map((query) => db.prepare(query)));
  }
  const id = `synthetic-${crypto.randomUUID()}`;
  await db.prepare(`INSERT INTO accounts (id, username, role, password_hash, password_salt,
    password_version, password_parameters, active, must_change_password)
    VALUES (?, ?, 'member', ?, ?, 1, '{"synthetic":true}', 1, 0)`)
    .bind(id, id, [1, 2, 3], [4, 5, 6]).run();
  browser = await chromium.launch({ channel: process.env.SESSION_TEST_BROWSER_CHANNEL || "msedge", headless: true });
  // Self-signed certificate is confined to this disposable loopback test context.
  for (const viewport of [{ width: 360, height: 800 }, { width: 390, height: 844 }]) {
    stage = "browser cookie issuance";
    const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport });
    const page = await context.newPage();
    await page.goto(address);
    assert.equal(await page.evaluate(async () => (await fetch("/synthetic/issue", { method: "POST" })).status), 204);
    const cookies = await context.cookies();
    const cookie = cookies.find((entry) => entry.name === "__Host-caridana");
    // Only booleans/statuses can enter assertion output; never a cookie/token.
    assert.equal(Boolean(cookie && cookie.secure && cookie.httpOnly && cookie.sameSite === "Lax" && cookie.path === "/"), true);
    assert.equal(await page.evaluate(() => document.cookie.includes("__Host-caridana")), false);
    stage = "browser missing CSRF";
    const denied = await page.evaluate(async () => (await fetch("/api/auth/logout", { method: "POST" })).status);
    assert.equal(denied, 403);
    stage = "browser logout/replay";
    const result = await page.evaluate(async () => {
      const response = await fetch("/api/auth/csrf");
      const { csrfToken } = await response.json();
      const invalid = await fetch("/api/auth/logout", { method: "POST", headers: { "X-CSRF-Token": "invalid" } });
      const logout = await fetch("/api/auth/logout", { method: "POST", headers: { "X-CSRF-Token": csrfToken } });
      const replay = await fetch("/api/auth/csrf");
      return [response.status, response.headers.get("Cache-Control"), invalid.status, logout.status, replay.status];
    });
    assert.deepEqual(result, [200, "no-store", 403, 204, 401]);
    assert.equal((await context.cookies()).some((entry) => entry.name === "__Host-caridana"), false);
    await context.close();
  }
  // Distinct browser sessions for the same account cannot share CSRF tokens.
  const contexts = await Promise.all([0, 1].map(() => browser.newContext({ ignoreHTTPSErrors: true })));
  stage = "cross-session browser CSRF";
  const pages = await Promise.all(contexts.map((context) => context.newPage()));
  for (const page of pages) {
    await page.goto(address);
    await page.evaluate(() => fetch("/synthetic/issue", { method: "POST" }));
  }
  const crossToken = await pages[0].evaluate(async () => (await (await fetch("/api/auth/csrf")).json()).csrfToken);
  assert.equal(await pages[1].evaluate(async (token) => (await fetch("/api/auth/logout", {
    method: "POST", headers: { "X-CSRF-Token": token },
  })).status, crossToken), 403);
  // A real browser form submission from another origin has no accepted CSRF control.
  stage = "cross-origin browser form";
  await pages[1].goto("about:blank");
  await pages[1].setContent(`<form method="post" action="${address}/api/auth/logout"><button>Uji</button></form>`);
  await Promise.all([pages[1].waitForNavigation(), pages[1].locator("button").click()]);
  await pages[1].goto(address);
  assert.equal(await pages[1].evaluate(async () => (await fetch("/api/auth/csrf")).status), 200);
  await db.prepare("UPDATE accounts SET active = 0 WHERE id = ?").bind(id).run();
  stage = "browser account deactivation";
  for (const page of pages) assert.equal(await page.evaluate(async () => (await fetch("/api/auth/csrf")).status), 401);
  await Promise.all(contexts.map((context) => context.close()));
  process.stdout.write("PASS: local Chromium secure/HttpOnly/SameSite cookie, CSRF, logout, cross-session/cross-origin denial and deactivation; 360x800 + 390x844. No deployed evidence.\n");
} catch (error) {
  // Avoid accidental assertion traces containing browser/session material.
  const status = typeof error.actual === "number" ? `; received status ${error.actual}` : "";
  process.stderr.write(`FAIL: local synthetic session browser verification at ${stage}${status}\n`);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await mf.dispose();
}
