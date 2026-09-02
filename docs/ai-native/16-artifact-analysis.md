# Artifact Analysis Report

## Sources Read

- `docs/ai-native/03-prd.md`
- `docs/ai-native/04-architecture.md`
- `docs/ai-native/05-issues.md`
- `docs/ai-native/14-project-constitution.md`
- `docs/ai-native/15-clarification-log.md`
- `docs/ai-native/00-session-handoff.md`
- `docs/ai-native/16-stack-compatibility-spike.md`

## Summary

- Requirements and acceptance IDs represented in the issue backlog: **114/114**.
- User stories represented: **12/12**; US-012 remains explicitly optional P2.
- Implementation issues linked to requirements or stories: **40/40**.
- Dependency references valid: **40/40 tasks**, with no missing dependency and
  no dependency cycle; T001 is the single root task.
- Constitution conflicts found: **none in the stated scope or role boundaries**.
- Critical readiness blockers: **1 process blocker** plus several high-impact
  domain decisions that must be resolved before their owning issues start.
- Overall result: **the project is ready to finalize its implementation rules,
  but not yet ready for unattended implementation beyond T001-T002**.

The documents have strong structural traceability. The remaining risk is
semantic: several IDs are cited by issues even though the exact business rule
needed to implement them is not yet explicit.

## Critical Findings

### C1. The implementation backlog has not received its required owner approval

`05-issues.md` is still marked **Draft for project-owner review**, explicitly
states that it does not authorize feature implementation, and ends with five
unanswered owner-review questions. The current checked-out `main` is also
behind `origin/main`, while the backlog exists only on
`agent/implementation-issues`.

This is a process blocker, not a missing feature. Before implementation, the
owner must approve or amend T001-T039, keep T040 deferred or opt in, approve the
gate policy, and decide whether issues may be published. The approved artifact
then needs to be consolidated into the working branch and the session handoff
updated.

## High Findings

### H1. Financial formulas are named but not fully defined

Recognized, collected, outstanding, remitted, capital, and loss are correctly
separated, but the artifacts do not fully define:

- the exact base for outstanding money when payment happens before delivery;
- how refunds and cancellations affect collected, recognized, outstanding, and
  loss totals;
- whether one remittance is recorded per order or may cover several orders;
- how overpayment, partial refund, and remittance differences are represented.

T005, T006, T017, T021, T022, T030, and the workbook depend on these semantics.
They must be decided before the relevant schema and finance code are accepted.

### H2. Activity immutability after activation is unspecified

The PRD defines draft, active, and closed activities, but does not state whether
product, mode, purchase price, selling price, target, period, and additional
costs may change after activation or after the first order exists. Silent price
or mode changes could rewrite the meaning of historical orders and reports.

A lifecycle rule is required before T004/T015/T016. Recommended default: freeze
product, mode, and prices after the first trusted order; later changes require
an audited correction or a new activity.

### H3. Member/PIC assignment and state-transition boundaries are incomplete

The role matrix says Member/PIC access is assignment-scoped, but does not define
whether assignment is at activity, region, order, or a combination. Allowed
state transitions are also not enumerated, especially reversals such as paid to
partially paid or received to problematic.

This must be explicit before T005, T011, and T017 so authorization and audit
behavior are not invented during implementation.

### H4. Manual order creation is promised but not explicitly owned by an issue

US-005's independent test includes creating an order, SC-002 includes manually
created orders, and the campus flow says a PIC may create a buyer order.
However, no issue has an explicit acceptance criterion for a general manual
order-creation contract, authorization, validation, and idempotency behavior.
T019 implies the capability but does not define it.

Add explicit acceptance criteria to T017 or T019, or add a focused issue before
campus/regional workflows.

### H5. Initial administrator bootstrap and credential delivery are undefined

The app needs an authenticated Coordinator to administer accounts, but the
artifacts do not define how the first Coordinator account is created safely.
They also leave the exact third-failure delay, session lifetime, and operational
delivery of a one-time password to later judgment.

Bootstrap must be defined before T003/T008-T013. Recommended default: an
explicit one-time local or non-production bootstrap command using a Worker
secret/input, disabled after the first Coordinator exists; never a default
credential or public setup route.

### H6. Buyer-data retention and deletion policy is absent

Access control is strong, but there is no rule for how long closed-activity
buyer data, proof metadata, sessions, audit history, and generated report
metadata are retained or when they may be purged. This affects schema design,
privacy, backups, and the meaning of read-only closure.

The owner should define a minimum MVP retention rule before T005-T007. It may be
simple, but indefinite retention should not be an accidental default.

### H7. The client build choice is inconsistent with the accepted stack proof

`04-architecture.md` names a Vite-built static TypeScript client, but the
accepted compatibility spike and pinned package set do not include Vite.
T001 requires the accepted versions to remain pinned and does not explicitly
authorize or version a client build dependency.

Before T001, either approve and pin Vite with audit/build evidence or amend the
architecture to use a simpler static client build that needs no new dependency.

### H8. Real spreadsheet identifiers conflict with the planned privacy scan

The PRD, handoff, and source inventory contain real spreadsheet IDs in tracked
documents, while T002/T025/T038 intend to prevent real source identifiers from
appearing in fixtures, logs, artifacts, and scans. It is unclear whether these
IDs are approved metadata exceptions or findings that must be redacted.

Define the policy before T002. Recommended default: remove real IDs from tracked
planning documents, keep only hashed aliases or external private references,
and inject production IDs through secrets/configuration.

## Medium Findings

### M1. UI language, locale, and authoritative timezone are not specified

The product is for Indonesian users and uses rupiah, but the UI language and
date/timezone rules are missing. One inspected source uses `Asia/Makassar`,
while the current development environment may differ. Decide the application
timezone and user-facing language before activity dates and audit timestamps
are implemented.

### M2. Target quantity versus stock limit is ambiguous

Campus language says sales continue until stock is exhausted, while the model
defines a target quantity and explicitly excludes advanced inventory. Decide
whether target quantity is informational or a hard order cap. Recommended MVP
default: informational target with an explicit warning, not a stock system.

### M3. Committee master-data provisioning is not operationally defined

T014 supports CRUD using synthetic data but intentionally does not import the
existing committee Sheet. With approximately 70 members, the owner should
choose manual entry, a one-time sanitized/controlled import, or another safe
bootstrap method before T014 is accepted.

### M4. Google authentication/provisioning is only described as a server-held credential

The artifacts correctly require least privilege but do not select the concrete
credential flow or who owns rotation/revocation. This may wait until T025, but
must be a named human/operational checkpoint before T026.

### M5. External proof gates are intentionally unresolved, not missing

The following human reviews are correctly represented and should not block
T001, but agent rules must force a stop at them:

- T024: private Drive ACL and safe proof-link workflow;
- T025/T028: `Column 1`, duplicate Sheet authorization, and three-run proof;
- T032: Treasurer review of the generated workbook;
- T034-T039: final role, usability, performance, migration, privacy, and release
  judgments;
- any decision to enable writes to the real response Sheet or deploy production.

## Low Findings

### L1. Session handoff is stale

`00-session-handoff.md` still says the next action is
`architecture-to-issues`, although the issue artifact now exists. Update it
after the backlog is approved.

### L2. Artifact numbering is duplicated

The stack proof and this analysis both use the `16-` prefix. This does not
change behavior, but a later documentation cleanup should give artifacts unique
sequence numbers to reduce navigation mistakes.

## Coverage Map

| Requirement / Story | Architecture Coverage | Issue Coverage | Testability | Status |
|---|---|---|---|---|
| US-001-US-002, FR-001-FR-010 | Accounts, sessions, lockout, central policy | T003, T008-T014, T034 | Worker/API and role-matrix tests | Covered; bootstrap/session policy needs decision |
| US-003, FR-011-FR-016 | Activity and mode model | T004, T015-T016 | Pure calculation, API, viewport tests | Covered; active-record mutability needs decision |
| US-004, FR-017-FR-023 | Sync ledger and header-driven adapter | T005, T007, T025-T028 | Test doubles plus duplicate-Sheet proof | Covered; external gate intentionally pending |
| US-005-US-007, FR-024-FR-033 | Independent states and scoped mobile views | T005, T011, T017-T020, T023 | Transition, authorization, viewport tests | Partial semantic gap: manual create and scope rules |
| US-008-US-009, FR-034-FR-042 | Finance read models, correction, audit | T006, T017, T021-T022, T030 | Independent fixture totals and audit tests | Partial semantic gap: formulas/refunds/remittance |
| US-010-US-011, FR-043-FR-052 | Dashboard, closure, report generation | T007, T024, T029-T033 | Role DTO, blocker, XLSX structural/manual tests | Covered; later external approvals correctly gated |
| US-012, FR-053-FR-056 | Optional local draft envelope | T040 | Interrupted-network tests | Covered and correctly deferred |
| NFR-001-NFR-026 | Security, privacy, mobile, reliability, deployment | T001-T039 | Automated plus manual/external evidence | Covered; retention, locale, and client build need decisions |
| SC-001-SC-010, AC-001-AC-010 | Evidence plan across architecture gates | T002, T012, T024-T039 | Reproducible quality gates | Covered; owner acceptance still pending |

## Recommended Fixes Before Coding

1. Obtain explicit owner approval or amendment of T001-T039, its dependency
   order, proof gates, and the continued deferral of T040.
2. Record a short pre-implementation decision log covering finance semantics,
   active-activity mutability, Member/PIC scope and transitions, manual order
   creation, first-admin bootstrap, retention, locale/timezone, target behavior,
   and committee provisioning.
3. Resolve the T001 client-build choice and the repository policy for real
   spreadsheet identifiers.
4. Update `05-issues.md` so each resolved decision has an owning acceptance
   criterion and human stop point; do not rely on chat memory.
5. Consolidate the approved architecture/backlog into the working branch and
   update `00-session-handoff.md`.
6. Only then create project agent rules and begin T001 through the agreed
   issue-by-issue build/review/test loop.

## Readiness Decision

**Not ready for fully autonomous issue execution yet.** The source set is
substantial and structurally complete, but the backlog approval plus the
semantic decisions above must be recorded first. T001-T002 are technically
preparable, but allowing the agent to continue beyond them now would create
exactly the hidden assumptions and cognitive debt this audit is meant to avoid.
