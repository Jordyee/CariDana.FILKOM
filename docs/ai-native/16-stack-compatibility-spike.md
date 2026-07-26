# Stack Compatibility Spike Evidence

## Status and decision

- Date: 2026-07-26
- Scope: throwaway, synthetic-only technical proof authorized by the owner in
  `04-architecture.md`; this is not MVP feature implementation.
- Architecture gates referenced: **Stack Choice**, **Compatibility and
  Free-Tier Validation** steps 1--3, and the constitution's **Reliability and
  deployment** / **Closure and reports** evidence requirements.
- Decision: **PASS; FINAL STACK ACCEPTED BY THE PROJECT OWNER ON 2026-07-26.**
  Hono + one Worker + static assets + D1 passed. The
  original `xlsx@0.18.5` candidate was rejected and removed because it had two
  high-severity advisories with no registry fix. `write-excel-file@4.1.1` was
  selected as the smallest safe candidate found, then passed the same Worker
  runtime, workbook-structure, build, audit, and deployment proof.
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
  download. It contains the four required group headings in order, dark table
  headers, formula cells, rupiah number formats, a synthetic `example.invalid`
  hyperlink formula, and committee-chair/treasurer signature rows.

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
| XLSX writer accepted by the proof | `write-excel-file` `4.1.1` |
| ZIP implementation | `fflate` `0.8.2` (the writer's sole runtime dependency) |
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
| PBKDF2-HMAC-SHA-256 | Pass in workerd: 600,000 iterations, 288.00 ms latest synthetic local benchmark |
| Dependency audit | Pass on 2026-07-26: 0 known vulnerabilities at every severity |
| Build/dry run | Pass: 224.15 KiB total / 47.80 KiB gzip (down from 641.06 / 145.32 KiB) |
| Deployed Worker startup | 9 ms |
| Deployed XLSX response | Pass: 200, 6,040 bytes, attachment disposition and XLSX MIME type |
| Deployed D1 route | Pass: three intentionally created synthetic rows after final verification |
| Deployed cookie route | Pass: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path`, and bounded lifetime present |

Deployment was deliberately isolated:

- Worker: `caridana-stack-compatibility-spike`
- D1: `caridana-stack-compatibility` (`8021abe9-d02d-43fd-821e-b9470c67dedd`)
- URL: `https://caridana-stack-compatibility-spike.gerungan-dj.workers.dev`
- Deployed version: `3412ad89-7139-4c29-9202-493a033a8fe0`

## Risks, limits, and what remains unproven

### Rejected dependency and resolved blocker

The original audit reported two high-severity advisories with no available
registry fix: `xlsx@0.18.5` was affected by prototype pollution
(GHSA-4r6h-8v6p-xvw6) and ReDoS (GHSA-5pgg-2g8v-p4x9). That package is now
absent from both `package.json` and the lockfile. The replacement
`write-excel-file@4.1.1` was published in June 2026, has one runtime dependency,
and produced an audit result of zero known vulnerabilities on 2026-07-26.

An audit result is a point-in-time check, not a permanent guarantee. Dependency
audit must remain part of implementation CI/release review, and any later high
or critical advisory must be reported to the project owner rather than silently
accepted.

The 288 ms PBKDF2 number is a local workerd measurement, not a production CPU
budget guarantee. It supports Web Crypto compatibility only. Re-benchmark the
chosen hash parameters after deploying the final auth flow, and enforce the
PRD's persistent failure counter, delay, lockout, session storage, revocation,
and CSRF control. The cookie proof does not substitute for them.

The replacement reduced the dry-run bundle by about 65% uncompressed and 67%
gzip. The XLSX generation route still keeps the whole workbook in memory, so it
is appropriate only for the explicitly small report proof; final 150-order
workbook measurements remain required.

This spike does not prove representative 150-order p95 latency or complete D1
row-read/write quota use, three-pass duplicate-Sheet synchronization, Drive
ACLs, five-role authorization, browser/mobile accessibility, Treasurer report
layout approval, complete server session security, or real Excel desktop
opening. Those are deliberately retained as later architecture/constitution
gates. Free-plan capacity therefore remains plausible but unaccepted: this
proof used one request per endpoint and only three synthetic D1 rows.

## Owner review record and remaining gates

On 2026-07-26, the project owner accepted the Hono/Worker/D1 evidence, rejected
high-risk dependencies, authorized selection of the best safer XLSX
alternative, confirmed the spike scope, and asked to be notified about future
security risks. This authorization produced the tested replacement above. After
reviewing that result, the owner accepted `write-excel-file@4.1.1` as the final
XLSX choice and authorized the project to proceed to `architecture-to-issues`.

No further stack confirmation is required before issue planning. The later
150-order, duplicate-Sheet, Drive ACL, five-role authorization, full session
security, and Treasurer-layout gates remain mandatory and are not waived by
this proof.
