# Code Review Report — Issue #12 / T007

## Sources Read

- `docs/ai-native/03-prd.md`
- `docs/ai-native/04-architecture.md`
- `docs/ai-native/05-issues.md`
- `docs/ai-native/08-loop-log.md`
- `docs/ai-native/07-issue-prompt.md`
- `AGENTS.md`
- GitHub Issue #12 and the complete T007 working-tree diff

## Verdict

Pass for Task-ID commit, PR review, and CI verification.

## Matches the Issue?

`0005_sync_reports.sql` is the verified next sequential migration after the
published `0001`--`0004` product migrations; no earlier migration changes.
It adds strict local-D1 storage for Sheet/tab metadata, final manual
preview/commit run results, per-run source-row outcomes, reviewed manual-match
decisions, unique committed source links, and report provenance. The change is
persistence-only: it adds no API route, UI, Sheet/Drive client, credential,
external operation, remote D1 action, report generator, or closure behavior.

## Requirement Coverage

| Requirement / story | Evidence in code | Status |
| --- | --- | --- |
| US-004, FR-017--FR-018 | `sheet_connections` stores only Sheet/tab identity and mapping version; `sync_runs` snapshots preview/commit operation and mapping version; `sync_rows` stores no response payload. | Covered structurally |
| US-004, FR-019--FR-023 | Raw SQL guards permit preview candidates/skips/failures and commit imports/links/skips/failures; row outcomes retain a reason; manual candidates require an explicit Coordinator/Deputy decision, actor, time, reason, and selected order. | Covered structurally |
| US-004, NFR-010 | The unique `(sheet_connection_id, source_row_identity)` ledger can bind a committed source once only. Replay rows remain observable but cannot create another link. | Covered structurally |
| US-011, FR-050--FR-052 | `report_versions` retains activity and closed-reference metadata, generator/template versions, checksum, creator, and timestamp without an artifact blob. | Covered structurally |
| NFR-013, NFR-014 | Source identity and outcomes are append-only local evidence; SQL/type inventory excludes credentials, tokens, proof values, source payloads, and workbooks. | Covered structurally |
| NFR-026 | Focused tests cover clean application, upgrade preservation, no-op replay, failed-DDL rollback/retry, strict/FK/check/index behavior, and legacy migration lifecycle expectations. | Covered |

## Matches the PRD and Architecture?

Yes. The schema follows the architecture's `sheet_connections`, `sync_runs`,
`sync_rows`, `sheet_order_links`, and `report_versions` boundaries. A `manual`
order has no independent Sheet identity; it can become linked only through an
explicit reviewed commit row. A `form_sync` order can be ledgered only as an
import. The ledger is committed before future write-back behavior and prevents
a partial failure/retry from creating another link. The report closed-reference
is opaque metadata, so T023/T033 remain responsible for closure and workbook
generation.

## Unrelated Changes

None found. The only pre-existing test changes update their expected full
migration sequence/count from `0004` to `0005`; they are required to preserve
the project's global migration upgrade/no-op/rollback regression coverage.
All other paths are the T007 migration, internal types, contract notes,
focused tests, required loop/review artifacts, and action ledger.

## Must Fix

None.

## Should Fix

None within T007. T025/T028 must still authorize a sanitized external target
and prove header mapping/three-pass behavior. T026--T027 own mapping, preview,
commit transaction, write-back, and server-side route authorization. T023/T033
own closed-activity validation, workbook generation, and download lifecycle.

## Security / Privacy Notes

- Only synthetic values appear in the new migration/tests; no external request
  is made and no credential, real identifier, buyer payload, map/proof link, or
  workbook is added.
- Coordinator/Deputy checks are D1 integrity backstops for configuration,
  manual-candidate review, sync run, and ledger resolution. They do not replace
  the later server-side authorization and scope checks.
- Result and review reason text must remain redacted/safe when T026--T027 write
  it; this structural task intentionally stores no raw source-row payload from
  which an unsafe reason could be reconstructed.

## Missing Verification

The local schema boundary is covered. Still pending and not implied by this
review: real/duplicate Sheet authorization and integration proof (T025--T028),
private Drive review (T024), full route authorization/scope proof (T011/T017/
T034), activity closure/report production (T023/T033), and remote D1 rehearsal
(T037).

## Student Explanation Check

The owner should be able to explain why source identities are kept separately
from source-row payloads, why a retry can record another outcome but not bind a
second order, why an explicit manual review is required before a manual link,
and why a report version retains a checksum/provenance rather than its workbook.

## Loop Decision

Accept Cycle 1 for Task-ID commit, push, complete PR/CI review, and the merge
gate.
