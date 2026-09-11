# Code Review Report — Issue #10 / T005

## Sources Read

- `AGENTS.md`
- `docs/ai-native/03-prd.md`
- `docs/ai-native/04-architecture.md`
- `docs/ai-native/05-issues.md`
- `docs/ai-native/08-loop-log.md`
- `docs/ai-native/15-clarification-log.md`
- GitHub Issue #10 and the complete T005 diff

## Verdict

Pass for PR review.

## Matches the Issue?

`0003_orders_states.sql` is the next sequential migration and does not edit the
published `0001` or `0002` files. It introduces one order record keyed by an
immutable application Order ID, mode-aware structural checks, separate
append-only histories, and only proof-reference metadata. It does not add a
route, authorization policy, Sheet ledger, Drive call, external resource, or
later-issue financial read model.

## Requirement Coverage

| Requirement / Story | Evidence in code | Status |
| --- | --- | --- |
| FR-019, SC-002 | `orders.order_id` primary key, immutable-ID trigger, `manual`/`form_sync` CHECK, and raw duplicate/update tests | Covered |
| FR-024 | Order buyer/attribution/mode/PIC/payment/proof-reference fields and activity-mode/PIC triggers | Covered structurally |
| FR-025--FR-029, SC-003 | Four separate state-history tables with per-axis CHECKs, actor/time, append-only triggers, latest-history indexes, and retrieval test | Covered structurally |
| FR-032 | Reference/name/MIME metadata only; strict schema inventory test proves no proof BLOB or Sheet/source-row column | Covered |
| NFR-011 | Strict non-negative integer-rupiah amount columns and fractional/negative-write tests | Covered |
| NFR-012 | Primary/FK/CHECK/STRICT/append-only constraints and invalid raw-write tests | Covered |

## Matches the PRD and Architecture?

Yes. The schema leaves every independent axis in a separate history and does
not derive payment, fulfillment, remittance, or order state from another axis.
The owner-approved no-automatic-deletion and append-only non-negative-event
policy is recorded in the clarification log and enforced for order/history
deletions and rewrites. T006 remains responsible for approved refund, void,
and correction effects; T007 remains responsible for Sheet source identity.

## Unrelated Changes

None found. Changes are limited to T005 migration/types/tests/migration
documentation, the owner-decision record, required prompt/loop/review artifacts,
and the append-only action log. There are no dependency, runtime-binding, UI,
route, external-integration, or published-migration changes.

## Must Fix

None found.

## Should Fix

None in T005 scope. A future T017 service must initialize and transition these
histories transactionally; this migration intentionally does not choose that
command policy.

## Security / Privacy Notes

- `OrderRow` is explicitly internal; role DTO redaction belongs to T011/T018.
- Proof fields are text metadata only; no table has a proof binary column.
- Tests use visibly synthetic identities and `.invalid` references, and no
  external call or remote D1 migration occurred.
- Order/history mutation guards are schema-side integrity controls, not a
  substitute for later server-side authorization.

## Missing Verification

The T005-local lifecycle and constraint evidence is complete. Remote migration
rehearsal remains T037; role/scope API denial is T011/T017; Sheet/Drive gates
remain T007/T024--T028; financial aggregate/correction behavior remains
T006/T021--T023. Those boundaries are not treated as passed here.

## Student Explanation Check

The owner should be able to explain why `orders.order_id` is not a Sheet ID,
why the four histories have no shared status field, why payment/remittance
amounts are non-negative events rather than correction rows, and why refunds
cannot be represented by mutating or deleting T005 records.

## Loop Decision

Accept Cycle 1 for final local re-verification, commit, push, PR/CI review, and
merge gate.
