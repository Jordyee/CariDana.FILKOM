# Code Review Report — Issue #11 / T006

## Sources Read

- `AGENTS.md`
- `docs/ai-native/03-prd.md`
- `docs/ai-native/04-architecture.md`
- `docs/ai-native/05-issues.md`
- `docs/ai-native/08-loop-log.md`
- `docs/ai-native/14-project-constitution.md`
- `docs/ai-native/15-clarification-log.md`
- GitHub Issue #11 and the complete T006 working-tree diff

## Verdict

Pass for final local verification and PR review.

## Matches the Issue?

`0004_audit_corrections_idempotency.sql` is the next sequential migration and
does not alter published `0001`--`0003`. It adds strict, append-only records
for issue reports, correction proposals, financial-effect proposals, decisions,
minimal audit events, and idempotency outcomes. The schema is intentionally
persistence-only: it does not add a route, UI, calculation, external system, or
remote D1 operation.

## Requirement Coverage

| Requirement / story | Evidence in code | Status |
| --- | --- | --- |
| FR-038, US-008 | Non-negative `financial_effect_proposals` are separate from T005 payment/remittance history and become countable only alongside one approved decision. | Covered structurally |
| FR-039, US-009 | `issues` preserves issue type, target, reporter/time, and reason for every supported issue category. | Covered structurally |
| FR-040, NFR-005 | Financial correction kinds require exactly one Coordinator/Deputy approval/rejection after a matching effect proposal; every decision must reference a matching immutable audit event. | Covered structurally |
| FR-041, SC-008 | `corrections` retains target, JSON before/after values, reason, proposer/time, and approval reference; target and timestamp consistency are guarded. | Covered structurally |
| FR-042 | T006 tables reject update/delete; no cascade path is introduced for confirmed T005/T006 history. No draft table or deletion route is added. | Covered structurally |
| NFR-010 | `idempotency_keys` has a composite account/route/key primary key, digest, safe result status/reference, expiry, and a same-key/different-digest rejection trigger. | Covered structurally |
| NFR-012 | `STRICT`, FK, enum, JSON, timestamp, amount, linkage, chronology, append-only, and index tests exercise raw invalid inserts/updates. | Covered structurally |

## Matches the PRD and Architecture?

Yes. The owner-approved T005 policy remains intact: refunds, voids, and
financial corrections are non-negative T006 proposals and never mutate or
delete a payment/remittance event. Pending is represented by the absence of a
decision; a unique immutable `approved` or `rejected` decision prevents a
contradictory double-resolution. Corrections retain necessary before/after
evidence, while generic audit events use a redacted summary and reject sensitive
snapshot-key categories.

## Unrelated Changes

None found. The diff is limited to one sequential migration, internal row
types, migration contract documentation, lifecycle expectation updates, focused
local-D1 tests, the required prompt/loop/review artifacts, and the append-only
action log. There are no dependency, route, client, runtime-binding,
external-integration, or published-migration changes.

## Must Fix

None. Review initially found missing chronological guards and no enforced
approval-to-audit linkage; both are now implemented and covered by raw-write
tests.

## Should Fix

None in T006 scope. T022 must create correction/effect/decision/audit rows in a
single transaction and apply role/assignment authorization at the server
boundary; T021 owns calculation of approved effects. Those later responsibilities
are not claimed as complete here.

## Security / Privacy Notes

- Audit rows contain actor, entity, action, optional redacted JSON, and no
  dedicated password, session, token, buyer, contact, address, map, or proof
  column. The D1 trigger rejects these sensitive snapshot-key categories.
- Idempotency persists a nonempty digest and safe result reference only—never a
  raw request or response body.
- Tests use visibly synthetic identities and no external request, D1 resource,
  Sheet, Drive, proof reference, credential, or financial source value.
- The approval-role trigger is a schema integrity backstop, not a replacement
  for T011/T017/T022 server-side authorization and scope checks.

## Missing Verification

The T006-local migration boundary is covered. Deferred gates are remote
migration rehearsal (T037), role/scope API denials and Member/PIC assignments
(T011/T017), correction workflow/transaction rollback and timeline UI (T022),
financial read-model calculations (T021), Sheet/Drive gates (T007/T024--T028),
and closure/report behavior. They remain unpassed rather than implied by this
schema review.

## Student Explanation Check

The owner should be able to explain why an unapproved refund is only a proposal,
why a financial decision needs an audit event but a Member/PIC cannot make it,
why original payment/remittance rows are never negated or rewritten, and how a
stored request digest blocks idempotency-key substitution while allowing a retry
to find the original safe result reference.

## Loop Decision

Accept Cycle 1 for final complete verification, Task-ID commit/push, and the
reviewed PR merge gate.
