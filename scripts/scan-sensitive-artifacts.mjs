import { readdir, readFile, lstat } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// No matched content, path, filename or exception text is returned. Filenames
// themselves can contain buyer data. Stable ordinal + rule suffice for triage.
const rules = [
  ["google-resource", /(?:docs|drive)\.google\.com\/(?:spreadsheets|file|drive|open|uc)(?:[/?]|$)|(?:sheets|drive)\.googleapis\.com\/|www\.googleapis\.com\/(?:drive|sheets)\//i],
  ["map-reference", /(?:maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.[a-z.]+\/|google\.[a-z.]+\/maps[/?])/i],
  ["phone", /(?<![\w])(?:\+62|0)[\s().-]*8(?:[\s().-]*\d){8,11}(?!\d)/],
  ["street-address", /\b(?:jalan|jl\.)\s+[a-z][a-z\s.]{2,50}\s(?:no\.?\s*)?\d+/i],
  ["private-key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["bearer-token", /\bBearer\s+[a-z0-9._~+/-]{12,}/i],
  ["credential-value", /["']?(?:password|client_secret|private_key|session_token|access_token|refresh_token|api_key)["']?\s*[:=]\s*["'][^"'\r\n]{4,}["']/i],
  ["personal-field", /(?<![\w])["']?(?:buyerName|buyer_name|phone|address)["']?\s*[:=]\s*["'](?!Pembeli Sintetis |SYNTHETIC-PHONE-|ALAMAT-SINTETIS-)[^"'\r\n]+["']/i],
];

export function scanText(content) {
  // Cover ordinary JSON/HTML URL escaping without rendering or executing data.
  const text = content.replaceAll("\\/", "/").replaceAll("&amp;", "&")
    .replace(/\\u([0-9a-f]{4})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  const findings = rules.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
  const emails = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? [];
  if (emails.some((email) => !email.endsWith(".invalid"))) findings.push("email");
  // Google source IDs are opaque mixed-case identifiers, unlike Git hex SHAs.
  const ids = [...text.matchAll(/(?:^|["'`])([A-Za-z0-9_-]{40,50})(?=["'`]|$)/gm)].map((match) => match[1]);
  if (ids.some((id) => /[A-Z]/.test(id) && /[a-z]/.test(id) && /\d/.test(id))) findings.push("source-identifier");
  return [...new Set(findings)];
}

const textExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".jsonc", ".md", ".txt", ".html", ".css", ".sql", ".yml", ".yaml", ".toml", ".log", ".csv", ".tsv", ".xml", ".svg", ".map", ".snap"]);
const excludedDirectories = new Set([".git", "node_modules", ".wrangler"].map((name) => resolve(name)));

export async function scanArtifacts(roots) {
  let files = 0;
  const findings = [];
  async function visit(path) {
    let stat;
    try { stat = await lstat(path); } catch { findings.push({ file: ++files, rule: "unreadable-path" }); return; }
    if (stat.isSymbolicLink()) { findings.push({ file: ++files, rule: "symlink-uninspected" }); return; }
    if (stat.isDirectory()) {
      let entries;
      try { entries = await readdir(path, { withFileTypes: true }); } catch { findings.push({ file: ++files, rule: "unreadable-directory" }); return; }
      for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, "en"))) {
        if (entry.isDirectory() && excludedDirectories.has(resolve(path, entry.name))) continue;
        await visit(resolve(path, entry.name));
      }
      return;
    }
    const file = ++files;
    // Opaque/binary files (including raster screenshots, PDF, ZIP/XLSX) never
    // receive a clean verdict. Future decoders/OCR need their own canary proof.
    if (!stat.isFile() || stat.size > 10 * 1024 * 1024) {
      findings.push({ file, rule: "unsupported-artifact" }); return;
    }
    let bytes;
    try { bytes = await readFile(path); } catch { findings.push({ file, rule: "unreadable-file" }); return; }
    let text;
    try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch {
      findings.push({ file, rule: "opaque-artifact" }); return;
    }
    const extension = extname(path).toLowerCase();
    if ((extension && !textExtensions.has(extension)) || text.includes("\0")) {
      findings.push({ file, rule: "opaque-artifact" });
    }
    for (const rule of scanText(text)) findings.push({ file, rule });
    // Inspect basename too, but never echo it in diagnostics.
    for (const rule of scanText(path.split(/[\\/]/).at(-1))) findings.push({ file, rule });
  }
  for (const root of roots) await visit(resolve(root));
  return { files, findings, scope: "working-tree; excludes .git, node_modules, .wrangler; build output must be in dist" };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result = await scanArtifacts(process.argv.slice(2).length ? process.argv.slice(2) : ["."]);
    process.stdout.write(JSON.stringify(result) + "\n");
    process.exitCode = result.findings.length ? 1 : 0;
  } catch {
    process.stderr.write("SENSITIVE_SCAN_FAILED\n");
    process.exitCode = 1;
  }
}
