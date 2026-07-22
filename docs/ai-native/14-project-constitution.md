# Project Constitution

## Status

Approved by the project owner on 2026-07-22. This constitution governs all later
architecture, issue, implementation, test, and review decisions for
CariDana.FILKOM. When a later artifact conflicts with it, this constitution
wins unless the project owner explicitly amends it.

## Sources Read

- `docs/ai-native/00-session-handoff.md`
- `docs/ai-native/03-prd.md` — approved product requirements and acceptance criteria.
- `docs/ai-native/15-clarification-log.md` — resolved product ambiguities and downstream evidence.
- `docs/ai-native/02-intent-brief.md` — approved intent, scope, tradeoffs, and success criteria.
- `docs/ai-native/00-source-inventory.md` — sensitive source-data inventory and inspection status.
- `docs/ai-native/00-process-setup.md` — required engineering sequence and guardrails.

## Core Principles

### I. Trustworthy Operational Record

The application is the authoritative operational record after an order is
imported. It must keep order, payment, fulfillment, and PIC-remittance states
as separate axes; changing one cannot silently change another. Every
application order has one unique, immutable Order ID.

Financial meaning must remain explicit: recognized revenue, collected money,
outstanding money, remitted money, capital, and approved losses are separate
values. Money is stored and calculated as integer rupiah, never binary
floating-point values. Calculations and report totals must be independently
testable outside the user interface.

### II. No Silent Financial or Confirmed-Record Changes

Only disposable drafts may be hard-deleted. Confirmed records, including
financial records, may only be voided or corrected through an auditable action.
Each such action records the record ID, previous value, new value, reason,
actor, timestamp, and approval when required. Only Coordinator or Deputy may
approve cancellations, refunds, financial corrections, loss classification,
final audit, or activity closure.

An activity cannot close while orders, remittances, discrepancies, or issues
are unresolved or unapproved. Closure makes operational records read-only in
the MVP; reopening is out of scope.

### III. Least-Privilege, Server-Enforced Access

Every protected read and mutation is authorized on the server for the current
individual local account; hiding a control is never sufficient. Roles have the
following non-negotiable boundary:

| Role | Permitted boundary |
| --- | --- |
| Coordinator | Full operational, approval, audit, closure, reporting, and account-administration access. |
| Deputy | Coordinator-level operational, approval, audit, closure, and reporting access; account administration is only allowed if explicitly configured. |
| Member/PIC | Operational work and buyer data only in assigned scope; cannot approve financial effects, close activities, or export reports. |
| Officer | Read-only permitted aggregates and closed-report download; no buyer contacts, addresses, raw proof links, or mutations. |
| Treasurer | Read-only closed aggregates and closed-report download; no buyer contacts, addresses, raw proof links, generation, approval, audit, closure, or mutations. |

Credentials are never stored or logged as plaintext. Password verifiers use a
salted approved hash; secrets never enter source control, client bundles, or
logs. Login responses do not reveal whether an account exists. Failure counts
and lock state persist server-side: generic warning plus delay begins after the
third consecutive failure, lock begins after the fifth, and the lock expires in
15 minutes or is unlocked by an administrator. A reset uses a random one-time
password that must be changed immediately after login.

### IV. Buyer Privacy and Evidence Are Need-to-Know

Buyer names, phone numbers, addresses, map links, payment proofs, and financial
details are sensitive. Original source data must never be used for development,
testing, or demos and must not be copied into fixtures, demo artifacts,
screenshots, logs, source control, or public reports. Sanitized Nasi Jaha data
may preserve workflow shape only.

Members/PICs see personal data only for assigned work. Officers and Treasurers
never receive buyer contact/address data or raw operational proof references in
application views. Payment-proof files remain in a designated private Google
Drive folder; the database stores only the manually entered Drive reference and
supporting metadata, never proof binaries. Approved evidence links are allowed
only in a generated closed Excel report, and private Drive permissions must be
verified before production use. Unsynced local drafts are cleared on successful
sync, explicit discard, logout, and session invalidation.

### V. Repeatable, Header-Driven Sheet Synchronization

Google Forms remains buyer intake. Synchronization is manual and incremental;
realtime or scheduled synchronization is not an MVP feature. Only Coordinator
or Deputy can initiate it.

Before any write, sync validates the required headers and shows a preview. It
locates `Order ID` by header name, never a fixed column letter, and ignores the
ambiguous `Column 1` until explicitly defined. For a valid row with an empty ID,
the application creates exactly one order and writes only the same immutable ID
to that source cell. Rows with an existing imported ID are skipped. Imports,
partial-failure retries, local-draft retries, and other duplicate-prone
financial mutations must be idempotent and report imported, skipped, and failed
rows with row-level reasons. Later Sheet edits must never silently overwrite
trusted application data.

No write is enabled against the real response Sheet until this behavior is
proven on a duplicate response Sheet using sanitized data.

### VI. Mobile-First, Accessible Core Work

P1 activity setup, search, order viewing, permitted updates, reconciliation,
and closure work must be usable at 360 x 800 and 390 x 844 viewports without
page-level horizontal scrolling or a desktop-table dependency. Campus mode must
not require regional fields; regional mode must require area, contact/address,
and PIC.

Interactive controls must be touch-appropriate, keyboard accessible, visibly
focused, and programmatically named. Statuses use text or icons in addition to
colour. Forms provide field-level errors and retain valid input after failed
submissions. Long-running sync and export operations expose progress/pending
state and prevent accidental duplicate submission.

### VII. One Complete, Simple MVP Loop

The MVP proves one product, one operating mode, and one complete activity loop:
setup, manual import or permitted entry, independent state tracking,
reconciliation, audit, closure, and Excel export. It does not add realtime
sync, buyer-facing ordering, third-party sign-in, full offline editing,
multi-product/catalog support, multi-tenancy, accounting/procurement,
advanced analytics, automatic payment verification, or reopening closed
activities.

Any P2 weak-network draft feature is optional and may ship only if it visibly
remains local and unsynced, creates at most one server record after retry, and
never affects trusted shared totals. If that cannot be demonstrated, it is
excluded rather than approximated.

## Quality Gates

No later stage may pass a gate by assertion alone; it needs reproducible test,
inspection, or demo evidence.

- [ ] **Requirements traceability:** each architecture component, implementation issue, test, and demo step maps to one or more approved PRD requirements; no feature expands an explicit MVP non-goal without owner approval.
- [ ] **Authorization:** automated tests cover all five roles and deny 100% of forbidden role-action combinations, including direct protected-route/API requests and cross-scope Member/PIC reads.
- [ ] **Authentication:** tests verify salted password storage, non-enumerating login responses, server-persistent failure counters, third-failure delay, fifth-failure 15-minute lock, admin unlock, and forced one-time-password replacement.
- [ ] **Privacy:** development, testing, and demos use sanitized synthetic fixtures only; a repository, fixture, screenshot, log, and exported-test-artifact scan finds no real buyer PII, map links, payment-proof links, or financial data; role-view tests confirm Officer/Treasurer exclusions; private Drive evidence permissions are reviewed before production use.
- [ ] **Finance and audit:** sanitized fixtures have independently calculated expected recognized, collected, outstanding, remitted, capital, and approved-loss totals; tests prove integer-rupiah calculations, independent state axes, no silent confirmed-record deletion, and complete correction audit fields.
- [ ] **Synchronization:** a controlled duplicate response Sheet is synced three times with zero duplicate orders after the first import; mapping is header-driven; only `Order ID` is written; malformed rows and partial failures yield retry-safe row-level results. Real-Sheet writes remain disabled until this proof passes.
- [ ] **Mobile and accessibility:** all P1 flows are manually checked at 360 x 800 and 390 x 844 with no page-level horizontal scroll; keyboard, focus, programmatic-name, labelled-status, and validation behaviour are checked.
- [ ] **Closure and reports:** closure is blocked for every unresolved/unapproved condition; closed records are read-only; generated `.xlsx` opens in Excel and contains the four required table groups in order, required columns, rupiah formats, formulas, authorized evidence links, and optional signature rows. Treasurer approves the layout before production use.
- [ ] **Reliability and deployment:** duplicate-prone endpoints are idempotent; database constraints prevent duplicate IDs and invalid states; versioned migrations reproduce locally and in deployment; architecture proves the selected stack and Cloudflare free-tier viability for a representative 150-order activity, or documents the first limit.
- [ ] **Review evidence:** every P1 requirement has automated tests where feasible plus manual/demo evidence where UI or external services require it; failures are resolved or explicitly deferred with owner approval before release.

## Governance

This document is the decision rulebook for later AI and human work. AI may
draft alternatives, tests, or implementation details, but the project owner
approves scope changes and remains responsible for decisions. Work proceeds in
small, reviewable loops and is saved under `docs/ai-native/`; unsaved reasoning
is not project memory.

Any proposed exception must identify the affected principle, the risk, the
mitigation, the acceptance evidence, and explicit project-owner approval. An
unapproved exception is rejected.

## Open Questions and Owner Approval

No product or constitution decision remains unresolved. On 2026-07-22, the
project owner explicitly approved the following binding decisions:

1. Every quality gate in this constitution is mandatory before release.
2. The real Google Sheet remains write-disabled until idempotency tests on a
   duplicate Sheet pass; `Column 1` remains unmapped until defined or removed.
3. Original source data is prohibited in development, testing, and demos;
   sanitized synthetic fixtures are required.
4. The Treasurer must review the generated Excel layout before it is used for
   production reporting.
5. No feature outside the approved MVP may be added without explicit
   project-owner approval. The P2 weak-network draft feature remains subject to
   its stated safety proof.

These approvals also make the privacy scan and private-Drive permission review
within the mandatory quality gates binding before release.

## Next Step

The constitution review gate is complete. The next authorized planning stage is
`prd-to-architecture`; this document does not itself authorize implementation.
