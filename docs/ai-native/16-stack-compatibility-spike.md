# Stack Compatibility Spike Evidence

## Status and decision

- Date: 2026-07-26
- Scope: throwaway, synthetic-only technical proof authorized by the owner in
  `04-architecture.md`; this is not MVP feature implementation.
- Architecture gates referenced: **Stack Choice**, **Compatibility and
  Free-Tier Validation** steps 1--3, and the constitution's **Reliability and
  deployment** / **Closure and reports** evidence requirements.
- Decision: **REVISE BEFORE ACCEPTING THE COMPLETE STACK.** Hono + one Worker
  + static assets + D1 is a pass for this narrow compatibility proof. The
  selected `xlsx` package is a fail for production selection: it works
  technically but has two high-severity advisories with no registry fix.
  Evaluate a maintained Worker-compatible XLSX writer (or authorized
  client-side generation from a closed-report DTO) before implementation.
- No production feature work, real Google Sheet/Drive access, buyer data,
  proof link, or Google credential was used.

## Reproducible proof

Run from the repository root:

```text
npm install
npm run db:migrate:local
npm run check
npm test -- --reporter=verbose
npm run build
```

The proof code is intentionally small and marked by its synthetic routes:

- `GET /` delegates to the Worker static-assets binding.
- `GET /api/health` proves Hono routing.
- `POST /api/d1-probe` creates and counts a synthetic `spike_probe` row.
- `POST /api/session-probe` constructs a random-token-derived cookie with
  `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`; it does **not** claim
  a complete production session or CSRF design.
- `GET /api/report-probe.xlsx` creates an in-memory workbook and marks it as a
  download. It contains the four required group headings in order, formula
  cells, rupiah number formats, a synthetic `example.invalid` hyperlink, and
  committee-chair/treasurer signature rows.

`migrations/0001_spike_probe.sql` is a checked-in versioned migration. It was
applied locally and remotely to an empty D1 database dedicated to this spike.
The Worker runtime test uses the official Cloudflare Vitest plugin and ran five
tests in Miniflare/workerd: static + API, D1 read/write, cookie attributes,
PBKDF2, and XLSX structure/download.

## Versions and configuration

| Item | Value |
| --- | --- |
| Compatibility date | `2026-07-26` |
| Compatibility flag | `nodejs_compat` |
| Hono | `4.12.32` |
| Wrangler | `4.114.0` |
| Cloudflare Vitest pool | `0.18.8` |
| Vitest | `4.1.10` |
| TypeScript | `7.0.2` |
| `xlsx` tested | `0.18.5` |
| Generated Worker runtime types | workerd `1.20260722.1` |

`wrangler types` generated `worker-configuration.d.ts`; no binding interface
was handwritten. The compiler, type freshness check, and Worker runtime tests
all passed.

## Results

| Evidence | Result |
| --- | --- |
| Local migration | Pass: `0001_spike_probe.sql`, 3 SQL commands |
| Remote migration | Pass: same migration, APAC D1, 0.65 ms reported execution |
| Worker runtime tests | Pass: 5/5 |
| PBKDF2-HMAC-SHA-256 | Pass in workerd: 600,000 iterations, 234.00 ms synthetic local benchmark |
| Build/dry run | Pass: 641.06 KiB total / 145.32 KiB gzip |
| Deployed Worker startup | 18 ms |
| Deployed XLSX response | Pass: 200, 11,552 bytes, attachment disposition and XLSX MIME type |
| Deployed D1 route | Pass: two intentionally created synthetic rows; direct query reported 2 rows read and 0 rows written |
| Deployed cookie route | Pass: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path`, and bounded lifetime present |

Deployment was deliberately isolated:

- Worker: `caridana-stack-compatibility-spike`
- D1: `caridana-stack-compatibility` (`8021abe9-d02d-43fd-821e-b9470c67dedd`)
- URL: `https://caridana-stack-compatibility-spike.gerungan-dj.workers.dev`
- Deployed version: `7b9106fb-e3b2-4d34-8ae9-a397f00392df`

## Risks, limits, and what remains unproven

### First blocking limit

`npm audit --json` reports one direct production dependency with two high
severity advisories and no available registry fix: `xlsx@0.18.5` is affected by
prototype pollution (GHSA-4r6h-8v6p-xvw6) and ReDoS
(GHSA-5pgg-2g8v-p4x9). The current package is therefore proof-only and must
not become the production export implementation. This is the first limit that
forces a stack revision, limited to the XLSX library/placement as anticipated
by the architecture.

The 234 ms PBKDF2 number is a local workerd measurement, not a production CPU
budget guarantee. It supports Web Crypto compatibility only. Re-benchmark the
chosen hash parameters after deploying the final auth flow, and enforce the
PRD's persistent failure counter, delay, lockout, session storage, revocation,
and CSRF control. The cookie proof does not substitute for them.

The 641.06 KiB dry-run bundle is acceptable as a small spike but confirms that
the XLSX package dominates the Worker bundle. The XLSX generation route keeps
the whole workbook in memory, so it is appropriate only for the explicitly
small report proof; final 150-order workbook measurements remain required.

This spike does not prove representative 150-order p95 latency or complete D1
row-read/write quota use, three-pass duplicate-Sheet synchronization, Drive
ACLs, five-role authorization, browser/mobile accessibility, Treasurer report
layout approval, complete server session security, or real Excel desktop
opening. Those are deliberately retained as later architecture/constitution
gates. Free-plan capacity therefore remains plausible but unaccepted: this
proof used one request per endpoint and only two synthetic D1 rows.

## Required owner approval

1. Approve replacing/evaluating the XLSX library without adding a second
   backend by default.
2. Review this spike result and explicitly accept or amend the revised export
   direction before `architecture-to-issues` or product feature coding begins.
3. Keep the later 150-order, duplicate-Sheet, Drive ACL, authorization, and
   Treasurer-layout gates mandatory.
