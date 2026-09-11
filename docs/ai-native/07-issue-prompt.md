# Issue Coding Prompt — T002

## Sources Read

- AGENTS.md; docs/ai-native/03-prd.md; 04-architecture.md; 05-issues.md;
  14-project-constitution.md; 15-clarification-log.md (all read in full).
- docs/ai-native/16-artifact-analysis.md (H1, H8), 00-source-inventory.md
  (local metadata, redacted), 17-agent-action-log.md.
- GitHub Issue #7; package.json; vitest.config.ts; test/worker.spec.ts;
  test/tsconfig.json; .gitignore; .github/workflows/ci.yml.

## Goal and Context

Implement only GitHub Issue #7 / T002: synthetic Nasi Jaha-shaped fixtures and
privacy guardrails (NFR-003, NFR-008, SC-006, SC-010, AC-010). T001 merged via
PR #47 at b083174. Regional fixtures describe later workflow, not new features.
Owner authorizes autonomous prompt/loop progression and reviewed PR merge.
On 2026-09-11 WITA owner approved replacing real Sheet IDs in active planning
documents with private aliases; Git history is handled separately at T038.
This resolves the T002 privacy checkpoint without authorizing real-data access.

## Files to Inspect First

Read the sources above, test/build configuration, Worker entry point, and CI.
Process legacy identifiers locally with redacted/count-only output.

## Constraints / Do Not

- Branch codex/t002-sanitized-fixture-privacy from latest approved main.
- Preserve pins and existing tests; no schema/auth/UI/integration or later issue.
- Synthetic names/contact/address sentinels, .invalid evidence URLs, synthetic
  source IDs, and invented integer rupiah only. Manual orders have no Sheet row.
- Four separate axes; independent literal finance expectations, no production
  calculation imports. Do not decide unresolved prepayment/refund/assignment
  semantics; distinguish state-shape examples from unambiguous finance samples.
- Scanner must not echo matches or unsafe filenames. Opaque formats fail closed
  until inspected; do not claim text scanning reads screenshot pixels.
- Deny external test network access; use in-memory reserved-invalid mocks only.
- No real Sheet/Drive/credentials, deployment, remote migration, release, paid
  resource, or history rewrite. Action log is append-only.

## Expected Output / Acceptance Mapping

| T002 criterion | Required evidence |
| --- | --- |
| Campus/regional, four axes, partial payment, remittance, issues, correction, closure | Typed fixture catalog, structural/coverage tests, inspection of audit fields. |
| Six independent finance totals | Literal expected-finance.ts; documented hand arithmetic and independent consistency checks. |
| Synthetic sensitive fields and invalid evidence domains | Strict fixture-policy tests and synthetic negative canaries; legacy ID alias replacement. |
| Repeatable redacted artifact scan | CLI; clean and temporary bad tests for fixtures/logs/screenshots/exports; fail closed on opaque formats. |
| No real Sheets/Drive network | Default Worker outbound denial, safe mock helper, local denial/mock-success tests. |

## Verification

Run npm ci; focused fixture/scanner/network tests; npm run check; npm test;
npm run build (dry-run); npm audit --audit-level=high; configuration/source/
fixture/log/artifact/client-and-Worker-bundle scan; git diff --check and full
review. No migration/UI edits: those specialized checks are not applicable.
Require all configured CI checks and reviewed current PR head/base.

## Loop Handoff / Before You Finish

Use run-the-loop immediately, without another artifact approval pause, per
owner authorization. Save 08-loop-log.md; append WITA action/failure evidence.
Four-attempt policy applies. Verify Git identity privately, commit/push passing
T002 changes, open PR with Closes #7, review all gates, then merge with merge
commit if eligible. Verify merge, synchronize clean main, and post final PR audit.
Only afterward create fresh T003 task with gpt-6-astra/high; identity/session
migrations only, reload all sources, no T004. Report evidence and limitations.
