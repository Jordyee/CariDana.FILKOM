import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { scanArtifacts, scanText } from "../../scripts/scan-sensitive-artifacts.mjs";

// Deliberately invalid/synthetic bad shapes, assembled so tracked source never
// contains a raw prohibited canary. Assertion output reports booleans only.
const canaries = [
  ["google-resource", "https://" + "drive.google.com/" + "file/d/synthetic-canary/view"],
  ["google-resource", "https://" + "docs.google.com/" + "spreadsheets/d/synthetic-canary/edit"],
  ["map-reference", "https://" + ["maps", "app", "goo", "gl"].join(".") + "/synthetic-canary"],
  ["phone", "+62" + " 800 0000 0000"],
  ["street-address", "Jalan " + "Canary Sintetis No 000"],
  ["email", "synthetic-canary" + "@example.com"],
  ["credential-value", JSON.stringify({ ["client_" + "secret"]: "synthetic-canary-only" })],
  ["bearer-token", "Bearer " + "synthetic-canary-only"],
  ["private-key", "-----BEGIN " + "PRIVATE KEY-----"],
  ["personal-field", JSON.stringify({ ["buyer" + "Name"]: "CANARY-UNAPPROVED-NAME" })],
  ["source-identifier", "A0b_".repeat(11)],
];

test("known sensitive shapes are detected without returning the value", () => {
  for (const [rule, value] of canaries) {
    const findings = scanText(value);
    assert.equal(findings.includes(rule), true, `missing rule: ${rule}`);
    assert.equal(JSON.stringify(findings).includes(value), false);
  }
  assert.deepEqual(scanText('https://proof.example.invalid/synthetic-c1 Pembeli Sintetis A'), []);
  assert.equal(scanText(canaries[0][1].replaceAll("/", "\\/")).includes("google-resource"), true);
});

test("temporary fixtures, logs, screenshot text and exports fail with redacted CLI output", async () => {
  const root = await mkdtemp(join(tmpdir(), "synthetic-scan-"));
  try {
    for (const name of ["fixtures", "logs", "screenshots", "exports"]) await mkdir(join(root, name));
    await writeFile(join(root, "fixtures", "clean.json"), '{"buyerName":"Pembeli Sintetis A"}');
    assert.equal((await scanArtifacts([root])).findings.length, 0);
    for (const [directory, extension] of [["fixtures", "json"], ["logs", "log"], ["screenshots", "svg"], ["exports", "csv"]]) {
      await writeFile(join(root, directory, `canary.${extension}`), canaries.map(([, value]) => value).join("\n"));
    }
    const run = spawnSync(process.execPath, ["scripts/scan-sensitive-artifacts.mjs", root], { encoding: "utf8" });
    assert.equal(run.status, 1);
    const output = run.stdout + run.stderr;
    assert.equal(output.includes(root), false);
    for (const [, value] of canaries) assert.equal(output.includes(value), false);
    assert.equal(JSON.parse(run.stdout).findings.length >= 40, true);
  } finally {
    // mkdtemp creates exactly this disposable test root; no user path accepted.
    assert.equal(resolve(root).startsWith(resolve(tmpdir()) + (process.platform === "win32" ? "\\" : "/")), true);
    await rm(root, { recursive: true });
  }
});

test("opaque screenshots/workbooks, malformed text and missing inputs fail closed", async () => {
  const root = await mkdtemp(join(tmpdir(), "synthetic-opaque-"));
  try {
    for (const extension of ["png", "jpg", "xlsx", "pdf", "zip"]) {
      await writeFile(join(root, `synthetic.${extension}`), new Uint8Array([0, 255, 1]));
    }
    await writeFile(join(root, "fake.txt"), new Uint8Array([0, 255]));
    assert.equal((await scanArtifacts([root])).findings.length, 6);
    assert.equal((await scanArtifacts([join(root, "missing")])).findings[0].rule, "unreadable-path");
  } finally {
    assert.equal(resolve(root).startsWith(resolve(tmpdir()) + (process.platform === "win32" ? "\\" : "/")), true);
    await rm(root, { recursive: true });
  }
});

test("nested evidence cannot hide behind dependency-directory names", async () => {
  const root = await mkdtemp(join(tmpdir(), "synthetic-nested-"));
  try {
    await mkdir(join(root, "node_modules"));
    await writeFile(join(root, "node_modules", "canary.log"), canaries[0][1]);
    assert.equal((await scanArtifacts([root])).findings.some((finding) => finding.rule === "google-resource"), true);
  } finally {
    assert.equal(resolve(root).startsWith(resolve(tmpdir()) + (process.platform === "win32" ? "\\" : "/")), true);
    await rm(root, { recursive: true });
  }
});
