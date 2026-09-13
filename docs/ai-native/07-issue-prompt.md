# AI Coding Prompt

## Sources Read

- `AGENTS.md`
- `docs/ai-native/03-prd.md`
- `docs/ai-native/04-architecture.md`
- `docs/ai-native/05-issues.md`
- `docs/ai-native/14-project-constitution.md`
- `docs/ai-native/15-clarification-log.md`
- GitHub Issue #11 (`T006`)

You are working on Issue #11 / T006: Add audit, correction, approval, and
idempotency migrations.

## Goal

Add only the next sequential D1 migration after published `0001`--`0003` for
append-oriented issue, correction, approval, audit, and idempotency persistence.
The schema must retain proposed/approved correction evidence and repeat-request
outcomes without rewriting or deleting confirmed T005 history.

## Relevant Context

- FR-038--FR-042 and SC-008 require explicit issues/losses, Member/PIC issue
  proposals, Coordinator/Deputy-only approval of voids, refunds, financial
  corrections, and final loss classifications, plus preserved ID, before/after,
  actor, timestamp, and reason for every confirmed-record correction.
- NFR-005 requires audit events for financial approvals. NFR-010 requires
  duplicate-prone financial mutations to be idempotent. NFR-012 requires D1
  constraints that reject invalid persistence states.
- The owner-approved T005 policy is binding: confirmed order, state-history,
  payment-proof-reference metadata, payment history, and remittance history
  receive no automated P1 deletion. Payment/remittance events are append-only,
  non-negative integer rupiah. Refunds, voids, and financial corrections are
  approved T006 effects, not negative T005 events or rewritten prior history.
- Architecture requires append-only audit events; correction/approval records
  retain target type/ID, proposed/resolved values, reason, actor/time, and
  approver/time. Idempotency binds account, route, key, request hash, result
  reference, and expiry.

## Files to Inspect First

- `migrations/0001_identity_sessions.sql`
- `migrations/0002_committee_activities.sql`
- `migrations/0003_orders_states.sql`
- `migrations/README.md`
- `src/db/schema.ts`
- `test/db/identity-migration.spec.ts`
- `test/db/order-state-migration.spec.ts`
- `test/env.d.ts` and `vitest.config.ts`

## Constraints

- Add one unpublished sequential migration, expected
  `migrations/0004_audit_corrections_idempotency.sql`; never edit published
  migrations.
- Use strict local D1/SQLite tables, foreign keys, `CHECK` constraints,
  append-only guards, and audit/idempotency lookup indexes. All timestamps are
  bounded UTC epoch milliseconds and all money is integer rupiah.
- Preserve target type/ID, before/after JSON objects, nonempty reason,
  proposer/time, and approval identity/time whenever approval is required.
  Void, refund, financial-correction, and final-loss proposals require approval;
  a nonfinancial typo/proof correction does not gain a financial effect merely
  through its persistence row.
- Model approval/resolution combinations so a raw insert or update cannot be
  both pending and resolved, cannot be rejected with an approved effect, and
  cannot apply an approval-required financial effect before approval.
- Store audit intent rather than passwords, password verifiers/salts, session
  token/digest values, buyer fields, or proof reference values. The audit
  before/after representation must be structured, nonempty, and intelligible
  without copying unnecessary sensitive fields.
- Bind idempotency uniqueness to account ID, route, client key, and request
  hash/stored result. Same key plus a different hash must be representable as a
  collision to reject, never a second stored result. A stored result is a safe
  internal status/reference, never a raw response containing personal data.
- Only explicitly labelled disposable drafts may be hard-deleted. No foreign
  key cascade, update, or delete path may silently remove confirmed order,
  payment, remittance, correction, approval, or audit history.

## Do Not

- Do not add routes, authorization services, UI, financial calculations,
  correction workflow behavior, manual-order creation, Sheet/Drive integration,
  weak-network drafts, external resources, remote migration, or deployment.
- Do not represent refunds, voids, or corrections as negative payment/remittance
  rows; do not decide retention beyond the approved no-automatic-P1-deletion
  policy; do not implement T007 or later work.
- Do not store raw credentials, tokens, buyer contacts/addresses, map links,
  payment-proof links/files, or proof binaries in the new audit/idempotency
  schema, fixtures, logs, or documentation.

## Expected Output

- One sequential audit/correction/approval/idempotency migration, internal D1
  row types, migration contract notes, and a focused disposable-local D1 suite.
- Tests for fresh/upgrade/repeat/no-op/failed-migration rollback and retry;
  raw invalid inserts/updates; append-only/no-delete behavior; mandatory
  correction/audit fields; approval/resolution contradictions; and same-key
  same-request versus same-key different-request idempotency collisions.

## Verification

Run focused T006 migration tests, then `npm ci`, `npm run check`, `npm test`,
`npm run verify`, `npm run build`, `npm audit --audit-level=high`,
`npm run scan:sensitive`, and `git diff --check`. Inspect a synthetic correction
and prove every mandatory audit field stays queryable. Review the complete diff.

## Loop Handoff

After the build attempt, use `run-the-loop` with the changed files, review
findings, and test evidence. The owner-approved persistence policy above is
binding for every loop cycle.

## Before You Finish

- Summarize changed files and the approval/retention assumptions.
- Explain how the schema prevents contradictory approval/resolution states and
  idempotency-key request substitution.
- Report verification evidence, redaction inspection, and remaining human gates.
