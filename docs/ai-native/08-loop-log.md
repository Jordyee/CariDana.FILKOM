# Loop Log — Issue #7 / T002

## Sources Read

AGENTS.md; docs/ai-native/05-issues.md; docs/ai-native/07-issue-prompt.md,
plus PRD, architecture, constitution, clarification and artifact-analysis notes.

## Source of Truth and Setup

Goal: synthetic fixtures and privacy guardrails. Follow the five acceptance rows
and verification commands in 07-issue-prompt.md. No production code, schema,
external data, credential, UI, or later Task ID implementation. Owner authorized
prompt/loop progression; owner resolved legacy Sheet IDs in favor of active-doc
alias replacement, leaving history for T038. Work from b083174 on
codex/t002-sanitized-fixture-privacy. Four meaningfully different failed
remediations maximum; never weaken a gate. Preserve previous ledger rows.

## Cycle 1 — in progress

- Build: inspect existing Worker test pool; add fixtures, independent expected
  totals, privacy tests/scanner and external-network guard; replace legacy IDs.
- Review: pending. Cover scope, privacy, no production imports in finance oracle,
  no match echo, clean/bad canaries, fail-closed opaque files and network denial.
- Tests: npm ci passed (four moderate, no high advisories); focused/full suite
  and artifact scans pending.
- Preparation failure: apply_patch rejected a delete/add of the same path;
  no file was changed by that failed call. Replaced the requested prompt artifact
  with a single file write. This is not an acceptance-criterion remediation.
- Decision: continue under owner authorization; implementation not complete.

## Stop / Acceptance Conditions

Every T002 criterion evidenced; all required local/CI checks pass; full current
PR diff reviewed; no unresolved privacy or human gate; clean merge verified;
main synchronized; final PR audit/handoff complete before fresh T003 task.

## Explanation and Limitations

Fixtures describe workflow shape without copying source values. Independent
literal totals make future calculation tests capable of catching wrong code.
State-only examples will not decide unresolved finance semantics. Scanner must
fail on unreadable/opaque artifacts rather than falsely claiming OCR coverage.
Git-history privacy and actual release evidence remain T038-owned.

## Cycle 1 evidence — 2026-09-11 WITA

- Implemented test-only campus/regional catalog, five state-shape samples,
  independent literal six-total oracles, corrections, issues, closure evidence,
  strict synthetic-field checks, scanner CLI/canaries, and native outbound deny.
- Replaced three legacy Sheet IDs and one tab ID with private aliases in four
  active documents under owner decision. No external resource was read/written.
- Scanner attempt 1: an ID at start of text escaped a lookbehind boundary.
  Expanded boundary; all three initial scanner tests passed.
- Scanner attempt 2: clean-scan false positives came from package integrity
  fragments, generated TypeScript identifiers, and raw-shaped test literals.
  Restricted opaque-ID rule to whole quoted/standalone tokens; assembled the
  canaries at runtime. Those findings cleared, leaving one field-name suffix.
- Scanner attempt 3: `badPhone` was mistaken for field `phone`; required a field
  word boundary. All canaries still pass; clean working-tree/bundle scan passed.
- Typecheck attempt 1: TypeScript rejected direct equality of disjoint literal
  unions in an assertion. Changed to an equivalent typed inequality assertion,
  preserving the behavior; TypeScript checks then passed.
- Binding-check attempt 1: checkout CRLF differed bytewise from Wrangler's LF
  generated file. Regenerated with the pinned Wrangler, confirmed no logical
  generated-type diff, and added a file-specific LF attribute. Check passed.
- Full checks passed: npm ci; npm run check; npm test (21 Worker + 3 Node cases
  before final review addition); npm run build (dry-run, ASSETS only);
  npm audit --audit-level=high (four moderate findings remain); scanner (49 files,
  zero findings after build); git diff --check. No migrations/UI changed.
- Final review tightened exclusions to repository-root dependency/cache/history
  directories only, adding a nested-evidence regression case. Reverification
  below supersedes prior test counts. No tests were removed, skipped or weakened.
- Identity checked privately against accepted T001 commit author; present and
  matching. Refreshed origin/main remains b083174. PR review/merge still pending.

## Acceptance review

All five issue criteria have local implementation/evidence: the fixture-policy
suite covers shape, independent states, partial/unremitted cases, correction and
closure; expected-finance.ts and README contain independent literal totals and
hand calculations; policy/negative tests enforce synthetic fields and invalid
URLs; scanner uses ordinal/rule-only diagnostics and temporary known-bad
canaries; network tests exercise native fetch denial for Sheets/Drive public
hosts without contacting them and test registered synthetic mock success.
Opaque raster/ZIP/XLSX/PDF files fail closed, not falsely clean. Arbitrary prose
PII/financial classification and Git history remain limitations for T038; no
release, live integration, OCR, or production finance gate is claimed here.

## Final local decision — 2026-09-11T12:52:00+08:00

Accepted for PR review, not yet merged. Complete staged diff reviewed against
Issue #7 and source context. Production routes, schema, bindings and dependency
pins remain unchanged. Preserve default Vitest discovery, excluding only the
Node scanner suite that npm test explicitly executes. Latest npm test passed
21 Worker tests and 4 Node tests. Final scanner/canary reruns passed; no ignored
or weakened tests, unexplained findings, unrelated changes or pending T002 human
gate remain. The initial in-progress status above is historical. GitHub CI,
current head/base review, merge verification and clean-main audit remain required.
