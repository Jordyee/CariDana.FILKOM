# Architecture Plan

## Status and Scope

Approved by the project owner on 2026-07-26. The final TypeScript + Hono + one
Cloudflare Worker + D1 + `write-excel-file@4.1.1` stack was accepted on the same
date after the sanitized compatibility proof passed. This plan designs the
approved MVP only: one product and one mode per activity, manual Google Forms
import, independent operational/financial states, audit, closure, and Excel
export. Stack acceptance authorizes implementation-issue planning, but not
feature implementation, a production Sheet write, or a Drive integration.

The approved constitution is binding. No conflict was found between it and the
PRD/clarification log. In particular, a convenient single `status` field, a
public proof-link workflow, client-only permissions, or a realtime sync would
conflict with the constitution and are rejected.

## Sources Read

- `docs/ai-native/00-session-handoff.md`
- `docs/ai-native/14-project-constitution.md`
- `docs/ai-native/03-prd.md`
- `docs/ai-native/15-clarification-log.md`
- `docs/ai-native/02-intent-brief.md`
- `docs/ai-native/00-source-inventory.md`
- `docs/ai-native/00-process-setup.md`
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/),
  [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/),
  [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/),
  and [Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)
  (checked 2026-07-23).
- [Hono on Cloudflare Workers](https://hono.dev/docs/getting-started/cloudflare-workers),
  [Google Sheets API quotas](https://developers.google.com/workspace/sheets/api/limits),
  [Google Drive sharing](https://developers.google.com/workspace/drive/api/guides/manage-sharing),
  and [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
  (checked 2026-07-23).

## Requirement Mapping

| Requirement / story | Architecture support | Evidence before release |
| --- | --- | --- |
| US-001, FR-001--FR-008, NFR-001--NFR-005 | D1 accounts, password verifiers, server sessions, lockout state, and centralized authorization middleware | Role matrix and auth integration tests, including direct API denials |
| US-002--US-003, FR-009--FR-016 | Controlled account/committee/activity tables; one-product constraint and integer-rupiah calculation module | Migration, validation, and calculation tests |
| US-004, FR-017--FR-023, SC-001--SC-002 | Explicit manual sync run and row ledger; header mapping; DB uniqueness; write-back of `Order ID` only | Duplicate fixture Sheet synced three times; no real-Sheet write beforehand |
| US-005--US-007, FR-024--FR-033 | Mobile-first screens, scoped queries, independent state records and server checks | 360x800/390x844 manual checks and Member/PIC cross-scope denial tests |
| US-008--US-009, FR-034--FR-042, SC-006--SC-008 | Integer-rupiah calculation module, append-only audit events, correction/approval workflow | Independently calculated sanitized fixture and audit-history tests |
| US-010--US-011, FR-043--FR-052, SC-005/SC-009 | Read models, closure validator, immutable closed report metadata, worker-generated `.xlsx` | Privacy/closure tests; open generated file in Excel; Treasurer layout review |
| US-012, FR-053--FR-056 | Optional browser-local new-entry draft envelope with idempotency key; excluded from server read models | Ship only after interrupted-network proof; otherwise omit |
| NFR-006--NFR-026, SC-010 | Redacted DTOs, Drive operational policy, indexed D1 queries, static assets, migrations, and proof gate | Privacy scan, performance measurement, deployment rehearsal, and usage record |

## Stack Choice

**Provisional candidate:** TypeScript, Hono as the small Worker router, a
static mobile web client built by Vite (no SSR), one Cloudflare Worker serving
the client assets and `/api/*`, and one Cloudflare D1 database. Use Web
standard APIs rather than Node-only runtime assumptions. Use a worker-compatible
XLSX library only after the proof below succeeds.

This is the smallest setup that gives one deployment, server-side policy,
relational constraints, static mobile UI, and no separate backend/service. Hono
documents Cloudflare Worker deployment, static assets, typed bindings, and
Worker-pool testing. It is a routing convenience, not the source of security or
business rules. The browser client has no privileged database or Google token.

**Accepted as the final implementation stack on 2026-07-26.** The required
minimal, sanitized compatibility proof built and deployed the candidate,
exercised a D1 binding and cookie response, bundled/generated/downloaded a small
four-section `.xlsx`, and ran in the Worker test runtime. Package versions,
compatibility date, bundle size, build output, tests, and the XLSX dependency
replacement are recorded in `docs/ai-native/16-stack-compatibility-spike.md`.
This acceptance does not waive the representative load, authorization,
external-system, privacy, or report-layout gates below.

## System Parts

- **Static client:** Mobile-first HTML/CSS/TypeScript screens; it renders only
  server-authorized data and sends an idempotency key for duplicate-prone POSTs.
- **One Worker API:** Hono routes, authentication/session middleware, role and
  assignment policy, input validation, calculation/closure/export orchestration,
  and Google Sheets API calls. It returns role-specific DTOs, never raw tables.
- **D1:** Source of truth after import: relational operational data, sessions,
  lock state, audit events, sync ledger, and report metadata. Payment-proof
  bytes are expressly excluded.
- **Google Sheets API:** Coordinator/Deputy-only manual read/preview and a
  narrow `Order ID` cell write after order commit. A server-held Google
  credential is a deployment secret, never a client credential.
- **Google Drive:** An external private evidence folder. Users enter a link/file
  reference and metadata; the app neither uploads binaries nor grants Drive
  permissions. Its ACL is a production operational review, not app RBAC.
- **Excel generator:** A Worker-compatible library produces a closed activity
  workbook in-memory. D1 retains report version/checksum/generated metadata;
  the workbook is regenerated deterministically for authorized download rather
  than stored as a proof binary in D1.

## Data Flow

1. The browser posts credentials over HTTPS. The Worker verifies a salted,
   slow password hash, updates D1 failure/lock state transactionally, and sets a
   Secure, HttpOnly, SameSite cookie containing only a random session token.
2. Each protected request resolves the hashed token in D1, verifies account
   active/reset state, role, activity assignment, and closure rules before
   querying or mutating data. UI hiding is only presentation.
3. A Coordinator/Deputy starts a manual sync. The Worker reads Sheet headers,
   rejects missing/ambiguous required mapping, shows a preview, then handles
   each row with an empty `Order ID` in a transaction that creates exactly one
   immutable application ID and sync-row result.
4. After that transaction commits, the Worker writes **only** that ID into the
   header-located Sheet cell. Retry first checks the D1 order/ledger and Sheet
   ID, so a failed write-back cannot create a second order. Existing IDs are
   skipped; malformed rows receive row-level errors. Later Sheet edits never
   update the application order.
5. Authorized operations create state/financial/correction records and an
   audit event in the same D1 transaction. Read models calculate totals from
   those records, not from a denormalized UI total.
6. Closure runs a deterministic blocker query. Only a Coordinator/Deputy can
   close; closure writes an audit event and makes operational mutations fail.
   An authorized export reads the closed snapshot/rules and streams the XLSX.

## Data Model

| Entity | Essential fields | Relationships / validation |
| --- | --- | --- |
| `accounts` | id, username unique, role, password_hash/salt/parameters, active, must_change_password, failure_count, locked_until | One individual local account; no plaintext credential; Coordinator and Deputy may administer accounts |
| `sessions` | id, account_id, token_hash, created/expires/revoked timestamps | Cookie token is random; revoke on logout, deactivation, reset, and invalidation |
| `committee_members` / `divisions` | id, display name, division_id, active | Separate from accounts so attribution does not create access |
| `activities` | id, product, mode, integer unit prices, target_qty, period, status | Exactly one product; campus pickup configuration XOR regional area/PIC configuration |
| `additional_costs` | id, activity_id, integer amount_rp, description | Description required; contributes to planned capital |
| `orders` | immutable order_id, activity_id, source row identity, buyer fields, qty, assigned_pic_id, attribution | Unique order ID; unique source identity when imported; mode-specific fields required |
| `order_state`, `payments`, `fulfillments`, `remittances` | order_id plus independent state, amounts where applicable, actor/time | Separate tables/history; CHECK constraints restrict enumerations; no transition updates another axis |
| `issues` / `corrections` / `approvals` | target type/id, proposed and resolved values, reason, actor/time, approver/time | Confirmed values void/correct, not delete; financial effect requires Coordinator/Deputy approval |
| `audit_events` | id, entity type/id, action, before_json, after_json, reason, actor_id, occurred_at | Append-only application history; records mandatory correction fields |
| `sheet_connections`, `sync_runs`, `sync_rows` | Sheet/tab config, header mapping version, run state, source row, outcome, order_id, reason | Manual runs only; row ledger enables safe retry and imported/skipped/failed report |
| `report_versions` | id, activity_id, generated_by/time, checksum, template version, closed snapshot reference | Download only if activity is closed and role permits; no buyer/proof DTO for Officer/Treasurer views |
| `idempotency_keys` | account, route, key, request hash, result reference, expiry | Prevent repeated financial mutation/local-draft retry from creating more than one effect |

All money columns are signed/unsigned integer rupiah according to their
business meaning; no float/decimal conversion enters calculations. Query indexes
cover `orders(activity_id, order_id)`, source identity, assigned PIC, state
filters, and audit/sync lookup. This fits the 150-order limit while avoiding
full scans; Cloudflare notes indexes reduce D1 rows read.

## Contracts

| Contract | Input | Output / errors | Requirements |
| --- | --- | --- | --- |
| `POST /api/auth/login` | username, password | Generic success/failure; delayed warning after third failure; locked response after fifth | FR-001--008, NFR-002--004 |
| Protected API middleware | cookie + route/resource | Redacted principal or 401/403; current role and assignment evaluated server-side | FR-002, FR-030--031, NFR-001 |
| `POST /api/activities/:id/sync/preview` | configured Sheet/tab | Validated headers and candidate rows; no writes | FR-017--018 |
| `POST /api/activities/:id/sync/commit` | confirmed preview/run id | imported/skipped/failed rows; exactly-one ID write intent; retry-safe | FR-019--023, NFR-010/013/014 |
| `PATCH /api/orders/:id/*` | permitted state/payment/remittance/correction + idempotency key | Updated independent axis and audit reference; 409 closed/duplicate, 403 scope/approval | FR-024--042 |
| `POST /api/activities/:id/close` | closure confirmation | blocker list or closed result/audit event | FR-047--049 |
| `POST /api/activities/:id/reports` and `GET .../reports/:version` | closed activity / authorized download | XLSX stream or 403/409 | FR-050--052 |

## Key Routes / Screens

- Sign-in and forced password-change screen; Coordinator/Deputy account and committee
  administration.
- Activity list/dashboard; compact cards and drill-down rather than desktop
  spreadsheet tables.
- Activity setup with mode-conditional sections and cost items.
- Sync preview/results with header validation, row outcomes, and one guarded
  commit action.
- Search/filter, order detail, state updates, issue/correction timeline, and
  regional PIC/area queue. Officers/Treasurers receive aggregate-only routes.
- Reconciliation, closure blocker list, closed-report generate/download.

At 360x800 and 390x844, lists use cards, filters and detail drawers/pages;
wide financial detail is not a required table. Controls have visible focus,
labels, status text/icons, touch targets, pending state, and field errors that
retain valid input.

## Security and Privacy Notes

- PBKDF2-HMAC-SHA-256 using a per-account random salt and versioned parameters
  is the Worker-native candidate: Workers documents PBKDF2 Web Crypto support;
  OWASP currently recommends a slow salted password hash and gives PBKDF2
  HMAC-SHA-256 600,000 iterations when PBKDF2 is used. Benchmark its actual
  Worker CPU cost before fixing the parameters; do not use raw SHA-256.
- Session records are server-side and token values are stored only as hashes.
  Cookie flags are Secure, HttpOnly, SameSite=Lax (or stricter after flow test),
  scoped to the app, and CSRF protection is required for state-changing routes.
- Google credentials and any session pepper are Worker secrets; redact tokens,
  passwords, buyer data, Drive links, and financial values from logs/errors.
- DTO/query policy removes contact, address, map, and raw proof references for
  Officer/Treasurer. Member/PIC filters are enforced in SQL/service policy using
  assignment, never requested client IDs.
- Drive URLs are sensitive metadata. Validate that the reference is a permitted
  Drive file/folder form; do not fetch/preview its binary. Drive ACLs control
  link access, so the owner must verify the designated folder is private and
  grants only intended people. Google documents that links are stable and access
  is evaluated against the file ACL.
- P2 local drafts, if approved later, use minimal browser storage, are visibly
  unsynced, and are cleared on successful sync, discard, logout, and session
  invalidation. Failure to prove cleanup excludes the feature.

## Failure Cases and Required Behaviour

| Failure | Required behaviour |
| --- | --- |
| Wrong credential / enumeration attempt | Same generic response; persistent counter, delay after third, 15-minute lock after fifth |
| Session expired/deactivated/reset | Revoke/deny, clear local draft, require authentication/password change as applicable |
| Missing/renamed Sheet header or `Column 1` | Stop before any write; identify header issue; `Column 1` remains ignored |
| Partial import or Sheet write failure | Preserve row result and committed order/ID; retry safely without duplicate order; report each row |
| Repeated POST/double tap/weak retry | Return stored idempotent result, not a second financial or order mutation |
| Unauthorized/cross-scope/closed mutation | Return 403/409; no partial update and no sensitive detail in error |
| Invalid proof link or private Drive access lost | Flag for review; never delete confirmed order silently; operational owner repairs ACL/link |
| Unresolved order/remittance/discrepancy/issue | Closure returns complete blocker list; activity remains active |
| D1/Google/export transient failure or free-tier limit | Show non-duplicating failed/pending outcome, retain retry context, record safe diagnostic metadata; operator retries later or owner upgrades quota |

## Compatibility and Free-Tier Validation

Cloudflare's current Free plan documents 100,000 Worker requests/day, 50
subrequests per invocation, D1 5 million rows read/day, 100,000 rows
written/day, and 5 GB storage. Static assets are free/unlimited and D1 query
metadata exposes rows read/written. A 150-order activity is far below capacity
if the design keeps list queries indexed and sync is manual, but compatibility
must be measured—not asserted—because every update and index also writes rows.
Free limits reset at 00:00 UTC; when exceeded, D1 queries fail until reset.

Run this evidence plan using only sanitized fixtures. The stack spike recorded
steps 1 and 3 plus the local Worker-compatibility benchmark portion of step 2 in
`docs/ai-native/16-stack-compatibility-spike.md`. The deployed login CPU/lock
subcheck in step 2 and steps 4--6 remain implementation/release gates:

1. Build and deploy a minimal Hono + static-assets Worker with D1; prove one
   D1 read/write, secure cookie header, static route, API route, and Worker test
   runtime work with pinned versions and the chosen compatibility date.
2. Benchmark PBKDF2 at the selected parameters in the deployed Worker; retain
   a bounded login delay/lock test and verify normal login stays within the P1
   performance target without excessive CPU.
3. Bundle the selected XLSX package in the Worker and generate/open a workbook
   containing the four mandated groups, formula cells, currency formatting,
   hyperlink, and signature rows. If this fails, evaluate the smallest
   Worker-compatible library; no framework is accepted on documentation alone.
4. Seed 150 synthetic orders, execute the representative dashboard/filter,
   state-update, sync-preview/commit, closure, and export paths; record p95 API
   latency plus D1 `rows_read`/`rows_written` metadata. Confirm well below daily
   quotas and under 50 subrequests/request.
5. On a duplicate, sanitized response Sheet, add the header-located `Order ID`,
   sync three times, include malformed and interrupted rows, and prove only that
   cell is written and zero duplicates result. Keep real Sheet writes disabled.
6. Inspect the Drive folder ACL and a representative link as intended role
   holders; then run five-role API authorization/privacy tests, a PII artifact
   scan, mobile/accessibility checks, migration rehearsal locally and remotely,
   and Treasurer review of the XLSX layout.

## Versioned Migrations and Test Boundaries

Use checked-in, sequential SQL migrations in `migrations/` and apply the same
ordered files locally and to the named remote D1 database. Cloudflare's D1
migration system records applied versions in `d1_migrations`; migration
rehearsal must validate a fresh database, upgrade from the prior schema, and
constraints/indexes. Do not use an ORM merely for migrations: plain versioned
SQL is sufficient at this MVP size.

Business calculations, state transition validators, closure blockers, and
workbook data shaping remain pure TypeScript modules with sanitized fixture
tests. Worker integration tests cover bindings/routes/transactions; browser
tests and manual viewport checks cover the mobile UI; external Sheet/Drive/Excel
checks remain explicit acceptance evidence rather than mocked claims.

## Architecture Decisions

1. **One full-stack Worker plus D1, provisionally** — minimizes deployments and
   satisfies the preferred target; acceptance is gated on the documented proof.
2. **Hono + static client, not SSR or microservices** — supports Worker routing
   and assets with less operational surface; no framework-specific assumption
   substitutes for compatibility testing.
3. **D1 is authoritative only after import** — Sheet is intake and ID ledger;
   later Sheet edits never overwrite trusted records.
4. **Four independent state axes and history** — preserves distinct order,
   payment, fulfillment, and remittance meaning and makes totals auditable.
5. **Server sessions and centralized authorization** — satisfies individual
   accountability and prevents route/UI bypass; role policy is tested as data.
6. **Private Drive evidence remains external** — avoids storing proof binaries
   while recognizing that app roles cannot replace Drive ACL review.
7. **No realtime sync, no new storage service, no P2 draft by default** — keeps
   the MVP within the constitution and the free-tier operating model.
8. **Simple extension seams, not a generic rules engine** — authorization,
   state transitions, calculations, closure blockers, and export shaping remain
   separate tested modules. Later approved rules can be added through an
   artifact amendment, focused module change, tests, and a versioned migration
   when data changes; current MVP behaviour is not weakened for hypothetical
   future requirements.

## Owner Review and Remaining Validation

On 2026-07-26, the project owner approved the workflow, five-role boundary, MVP
scope, financial/audit rules, privacy approach, and proposed report direction.
The owner explicitly enabled account administration for both Coordinator and
Deputy, requested that later approved rules remain easy to add, and authorized
the recommended narrow technical compatibility spike. The architecture is
therefore approved. The compatibility proof subsequently passed, the unsafe
original XLSX candidate was removed, and the owner accepted
`write-excel-file@4.1.1` as the final replacement on 2026-07-26.

The later validation and release gates still require: controlled
duplicate-Sheet authorization before real writes; definition/removal of
`Column 1`; private Drive permission review; Treasurer approval of workbook
layout; all-five-role authorization evidence; and representative 150-order
performance plus free-tier quota evidence. If later validation finds an
incompatible package update, CPU budget, or quota threshold, report it to the
owner and revise this plan rather than silently expanding infrastructure.

The compatibility evidence is recorded in
`docs/ai-native/16-stack-compatibility-spike.md`, and the final stack is
confirmed. The next authorized action is `architecture-to-issues`; it must
produce issue planning only and must not begin feature implementation.
