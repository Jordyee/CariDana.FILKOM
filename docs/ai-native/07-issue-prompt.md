# AI Coding Prompt

## Sources Read

- `AGENTS.md`
- `docs/ai-native/03-prd.md`
- `docs/ai-native/04-architecture.md`
- `docs/ai-native/05-issues.md`
- `docs/ai-native/14-project-constitution.md`
- `docs/ai-native/15-clarification-log.md`
- `package.json`
- GitHub Issue #12 (`T007`)
- Current Git state and published `migrations/0001`--`0004`

You are working on GitHub Issue #12 / T007: Add Sheet-sync and report-version
migrations.

## Goal

Add only the next sequential, local D1 migration,
`migrations/0005_sync_reports.sql`, and its internal types, migration contract,
and disposable-local constraint tests. Persist safe Sheet-connection metadata,
manual sync runs and row outcomes, reviewed manual-match decisions, retry-safe
Sheet-to-order links, and deterministic report-version metadata. Do not store
credentials, workbook/proof blobs, or any real external identifier.

## Relevant Context

- T007 follows the published `0001`--`0004` product migrations. The issue list
  still names `0006_sync_reports.sql`, but the verified current sequence ends
  at `0004_audit_corrections_idempotency.sql`; therefore `0005_sync_reports.sql`
  is the required next filename. Never edit an applied migration.
- FR-017--FR-023 require a controlled, header-driven, preview-first Sheet
  workflow. Real Sheet access remains disabled until T025 and T028; this task
  is structural persistence only and must not use a Sheet API or data source.
- A manual order has an immutable internal ID and no fabricated Sheet identity.
  A possible Form/manual match is warning/reviewer-driven only: a Coordinator
  or Deputy may explicitly decide to link it or import separately, with actor,
  time, reason, and selected order recorded; automatic matching or merging is
  forbidden.
- A committed source identity can link exactly once to either a new
  `form_sync` order or an explicitly reviewed existing `manual` order. Partial
  failure and write-back retry must never create a second order or link.
- FR-050--FR-052 and the report requirements need durable report provenance:
  the closed activity reference, generator version, template version, checksum,
  creator, and creation time. T023/T033 own closure/report generation behavior;
  this task must not invent it. D1 never stores a workbook, proof binary, or
  raw proof reference.
- NFR-010, NFR-013, NFR-014, and NFR-026 require retry safety, traceable
  preview/commit outcomes, privacy boundaries, and reproducible migrations.
  Store timestamps as bounded UTC epoch milliseconds and use only synthetic
  fixtures; user-facing WITA rendering belongs to later application work.

## Files to Inspect First

- `migrations/README.md`
- `migrations/0001_identity_sessions.sql`
- `migrations/0002_committee_activities.sql`
- `migrations/0003_orders_states.sql`
- `migrations/0004_audit_corrections_idempotency.sql`
- `src/db/schema.ts`
- `test/db/audit-migration.spec.ts`
- `test/db/order-state-migration.spec.ts`
- `test/env.d.ts` and `vitest.config.ts`

## Constraints

- Add `migrations/0005_sync_reports.sql` only. Use strict D1/SQLite tables,
  foreign keys, `CHECK` constraints, append-only/history guards where needed,
  and indexes for row retry, run-result lookup, and closed-report lookup.
- Sheet-connection metadata may contain a private/synthetic Sheet and tab
  identity plus mapping version, but no OAuth/client credential, token, real
  identifier, raw response-row content, buyer contact, address, map, or proof
  reference. It must remain useful without accessing a real Sheet.
- Retain each sync run's preview or commit state; each source-row outcome's
  source identity and `imported`, `linked`, `skipped`, or `failed` outcome; and
  the possible-manual candidate plus reviewer decision, actor, time, nonempty
  reason, and selected Order ID when a decision is made. Enforce coherent
  combinations with raw SQL constraints/triggers rather than trusting a route.
- Implement the committed-source ledger so one committed source identity has
  one selected order only. Permit `form_sync` for imports and `manual` only
  when the associated reviewer decision is explicit. Enforce retry safety at
  the database boundary for replays after partial failure or write-back retry.
- Report-version rows must record activity reference, generator version,
  template version, checksum, creator, and timestamp. They must have no
  workbook/blob/proof-binary column and must not assert a closure policy that
  T023/T033 have not implemented.
- Keep internal D1 row types out of response DTOs. All identifiers and test
  values must be clearly synthetic; redact logs and documentation.

## Do Not

- Do not add Sheet/Drive APIs, configuration credentials, real Sheet/Drive
  access, external writes, routes, authorization services, UI, report
  generation/download, or deployment.
- Do not implement T008 or later work, including header mapping/preview logic,
  sync commit services, Order ID write-back, report creation, closure, or
  activity lifecycle changes.
- Do not add a manual-order route or change T005/T006 state, finance, audit,
  idempotency, or retention semantics. Do not auto-link or auto-merge a manual
  candidate.
- Do not modify existing migrations or add a workbook, payment-proof, source
  row payload, credential, token, buyer PII, map link, proof reference, or
  real external identifier to code, fixtures, logs, schema, or documentation.

## Expected Output

- One unpublished sequential migration, internal `src/db/schema.ts` row types,
  updated `migrations/README.md` contract notes, and a focused
  `test/db/sync-report-migration.spec.ts` disposable-local D1 suite.
- Tests for clean application, upgrade preservation, repeat/no-op application,
  failed-DDL rollback and retry; strict-table, foreign-key, constraint, and
  index/query-plan behavior; preview/commit and row-outcome validity; reviewer
  decision evidence; `form_sync` versus reviewed `manual` linking; duplicate
  source/retry/write-back collisions; and report provenance with no blob/proof
  columns.

## Verification

Run the focused T007 migration suite and relevant D1 regression suites, then
`npm ci`, `npm run check`, `npm test`, `npm run verify`, `npm run build`,
`npm audit --audit-level=high`, `npm run scan:sensitive`, and `git diff --check`.
Inspect a fully synthetic report-version row and query plans for row retry,
run result, and activity report lookup. Review the complete diff against T007
only.

## Loop Handoff

After the build attempt, use `run-the-loop` with the changed files, review
findings, and test evidence. Keep T025/T028 external-Sheet gates and the
T023/T033 closure/report behavior outside this issue.

## Before You Finish

- Summarize changed files and state why `0005_sync_reports.sql` is sequential.
- Explain database enforcement for source-identity uniqueness, reviewed manual
  links, preview/commit outcomes, and no-workbook report metadata.
- Report verification, privacy/redaction inspection, remaining external/human
  gates, and any assumptions without presenting them as owner decisions.
