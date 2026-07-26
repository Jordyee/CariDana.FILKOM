# Implementation Issues

## Status

Draft for project-owner review. This backlog was prepared from the approved
requirements, constitution, architecture, and final stack. It does not authorize
feature implementation, production deployment, a real Google Sheet write, or
access to real buyer data, proof links, or Drive ACLs.

Individual GitHub issues must not be published from this backlog until the
project owner accepts this artifact. After acceptance, publish only the approved
tasks and preserve their Task IDs, dependencies, scope, and gates.

## Sources Read

- `docs/ai-native/00-session-handoff.md`
- `docs/ai-native/14-project-constitution.md`
- `docs/ai-native/03-prd.md`
- `docs/ai-native/15-clarification-log.md`
- `docs/ai-native/02-intent-brief.md`
- `docs/ai-native/00-source-inventory.md`
- `docs/ai-native/00-process-setup.md`
- `docs/ai-native/04-architecture.md`
- `docs/ai-native/16-stack-compatibility-spike.md`
- Current spike scaffold: `package.json`, `wrangler.jsonc`, `tsconfig.json`,
  `src/`, `test/`, and `migrations/0001_spike_probe.sql`

## Approved Baseline and Scope Rules

- Final stack: TypeScript, Hono, one Cloudflare Worker with static assets, D1,
  and `write-excel-file@4.1.1`.
- The application is authoritative after import. The Google Sheet remains an
  intake source and `Order ID` ledger, not a later update source.
- Order, payment, fulfillment, and remittance are independent state axes.
- All money uses integer rupiah. Confirmed or financial records are corrected
  or voided with audit history, never silently deleted.
- Every protected read and mutation is authorized on the server for one of the
  five approved roles and, for Member/PIC, the assigned scope.
- Only sanitized synthetic data may be used for implementation, tests, demos,
  screenshots, logs, exports, or external-system validation.
- P2 weak-network drafts remain excluded from the P1 release unless the owner
  separately authorizes T040.
- Each task is intended to fit one review sitting. If implementation reveals
  that a task cannot be reviewed clearly in one sitting, split it without
  weakening its acceptance criteria or changing its Task ID traceability.

## Gate Policy

The following tasks are proof gates, not optional documentation:

| Gate | Blocks |
| --- | --- |
| T012 deployed login CPU/lock proof | Account administration and all protected product flows |
| T024 private Drive ACL/proof-link proof | Workbook evidence links and final report lifecycle |
| T025 duplicate-Sheet and `Column 1` readiness | Any external Sheet integration |
| T028 three-pass sanitized duplicate-Sheet proof | Dashboard-to-closure implementation and every real-Sheet write |
| T032 Treasurer workbook-layout approval | Final report generation/download lifecycle |
| T034 full five-role authorization/privacy proof | Release validation |
| T035 mobile/accessibility proof | Release validation |
| T036 representative 150-order/free-tier proof | Release validation |
| T037 local/remote migration rehearsal | Release validation |
| T038 privacy/PII artifact scan | Demo, production deployment, and release |
| T039 final traceability review | P1 release decision |

If a gate fails, stop its dependants, preserve the evidence, and return the
finding to the project owner. Do not silently change the stack, infrastructure,
security parameters, privacy boundary, or product scope.

## Implementation Order

1. **Foundation and data boundaries:** T001-T007.
2. **Authentication and authorization:** T008-T012.
3. **Controlled setup and operational core:** T013-T023.
4. **External-system gates and Sheet sync:** T024-T028.
5. **Dashboard, closure, and reporting:** T029-T033.
6. **Cross-cutting release proof:** T034-T039.
7. **Optional P2 work, only after separate approval:** T040.

Tasks marked parallelizable may run concurrently only after all dependencies
pass and only when their listed files do not overlap.

## Issue 1: Turn the accepted spike into a safe product foundation

**Task ID:** T001
**User Story:** Cross-cutting foundation for US-001-US-011
**Requirement IDs:** NFR-023, NFR-025, NFR-026
**Priority:** P1
**Parallelizable:** No
**Goal:** Establish the production-shaped project structure while retaining the
accepted pinned stack and clearly isolating the throwaway spike behavior.
**Depends on:** None
**Likely Files:** `package.json`, `package-lock.json`, `wrangler.jsonc`,
`tsconfig.json`, `src/index.ts`, `src/app.ts`, `src/env.ts`, `public/`,
`test/worker.spec.ts`, `.github/workflows/ci.yml`

**Acceptance Criteria:**

- Package metadata, commands, and entry points describe CariDana.FILKOM rather
  than a deployable spike.
- Hono, Wrangler, TypeScript, the Worker test pool, and
  `write-excel-file@4.1.1` remain pinned to the accepted versions unless an
  owner-reviewed spike amendment is recorded.
- Synthetic probe routes and the isolated spike D1 identifiers cannot be
  exposed by a production configuration.
- CI commands cover type checking, Worker-runtime tests, dry-run build, lockfile
  install, and dependency audit without requiring secrets.
- Environment bindings are typed and no production database ID, Google
  credential, session secret, or buyer data is committed.

**Verification:**

- Run `npm ci`, `npm run check`, `npm test`, `npm run build`, and
  `npm audit --audit-level=high`.
- Inspect the dry-run bundle and generated binding types.
- Search the product configuration for spike resource IDs and secret values.

**AI Can Help With:** Scaffold modules, scripts, CI, and tests while preserving
the accepted versions.
**Student Must Judge:** Whether spike-only files remain useful as historical
evidence and whether any compatibility-date or dependency change requires a
new owner-reviewed spike.
**Risk Level:** Medium

## Issue 2: Establish the sanitized fixture and privacy boundary

**Task ID:** T002
**User Story:** US-004, US-005, US-008, US-009, US-011
**Requirement IDs:** NFR-003, NFR-008, SC-006, SC-010, AC-010
**Priority:** P1
**Parallelizable:** No
**Goal:** Provide synthetic fixtures and automated guardrails so development
never needs real buyer, Sheet, proof-link, or financial data.
**Depends on:** T001
**Likely Files:** `test/fixtures/`, `test/fixtures/expected-finance.ts`,
`scripts/scan-sensitive-artifacts.*`, `package.json`, `.gitignore`,
`test/privacy/fixture-policy.spec.ts`

**Acceptance Criteria:**

- Sanitized Nasi Jaha-shaped fixtures cover campus and regional orders, all four
  state axes, partial payment, remittance, issues, corrections, and closure.
- Expected recognized, collected, outstanding, remitted, capital, and
  approved-loss totals are independently declared rather than calculated by
  the production module under test.
- Names, phones, addresses, maps, proof links, Sheet IDs, and financial values
  are demonstrably synthetic; evidence URLs use reserved invalid domains.
- A repeatable scan rejects known PII/proof-link patterns in fixtures, logs,
  screenshots, and exported test artifacts without printing matched secrets.
- Test helpers prevent accidental network access to the real Sheets and Drive
  resources.

**Verification:**

- Run the fixture-policy and sensitive-artifact scan tests against both clean
  fixtures and a temporary known-bad synthetic canary.
- Manually inspect the fixture catalog and independent expected totals.

**AI Can Help With:** Generate synthetic datasets, canary tests, and scan rules.
**Student Must Judge:** Whether fixtures preserve the real workflow shape
without reproducing any identifiable or sensitive source value.
**Risk Level:** High

## Issue 3: Add identity and session migrations

**Task ID:** T003
**User Story:** US-001, US-002
**Requirement IDs:** FR-001, FR-004, FR-008, FR-009, NFR-002, NFR-012,
NFR-026
**Priority:** P1
**Parallelizable:** No
**Goal:** Create the D1 schema foundation for individual accounts, persistent
lock state, and revocable hashed sessions.
**Depends on:** T001
**Likely Files:** `migrations/0002_identity_sessions.sql`,
`src/db/schema.ts`, `test/db/identity-migration.spec.ts`

**Acceptance Criteria:**

- Accounts have unique normalized usernames, one of the five approved roles,
  active/reset flags, versioned password parameters, failure count, and
  `locked_until`.
- Sessions store only a token hash plus bounded lifecycle timestamps and an
  account reference.
- Constraints reject unknown roles, negative failure counts, duplicate
  usernames, and orphan sessions.
- Indexes support username lookup, active session lookup, and account session
  revocation.
- Migration tests apply from an empty D1 database and inspect the constraints
  and indexes.

**Verification:**

- Apply the migration to a fresh local D1 database.
- Run positive and negative schema tests, including duplicate username and raw
  invalid role inserts.

**AI Can Help With:** Draft SQL, schema types, and migration tests.
**Student Must Judge:** Account-administration ownership and whether Deputy
administration remains enabled exactly as approved.
**Risk Level:** High

## Issue 4: Add committee and activity migrations

**Task ID:** T004
**User Story:** US-002, US-003
**Requirement IDs:** FR-010-FR-016, NFR-011, NFR-012, NFR-026, AC-002
**Priority:** P1
**Parallelizable:** Yes, after T003 if migration numbering is coordinated
**Goal:** Model controlled attribution and one-product campus/regional activity
setup with integer-rupiah planning data.
**Depends on:** T003
**Likely Files:** `migrations/0003_committee_activities.sql`,
`src/db/schema.ts`, `test/db/activity-migration.spec.ts`

**Acceptance Criteria:**

- Divisions and committee members remain separate from login accounts.
- An activity stores exactly one product and exactly one mode.
- Purchase price, selling price, target quantity, and additional costs are
  integer values with appropriate non-negative/positive constraints.
- Additional costs require a non-empty purpose; campus and regional
  configuration tables cannot both be active for one activity.
- Indexes support status, period, division, and active committee-member lookup.

**Verification:**

- Apply migrations from empty and prior-version local databases.
- Test invalid negative money, missing cost description, duplicate mode
  configuration, and inactive attribution cases.

**AI Can Help With:** Draft normalized SQL and constraint tests.
**Student Must Judge:** Whether the schema names express the committee's domain
language clearly without creating a generic catalog or multi-tenant model.
**Risk Level:** Medium

## Issue 5: Add order and independent-state migrations

**Task ID:** T005
**User Story:** US-004-US-008
**Requirement IDs:** FR-019, FR-024-FR-029, FR-032, NFR-011, NFR-012,
SC-002, SC-003
**Priority:** P1
**Parallelizable:** No
**Goal:** Persist immutable Order IDs, mode-specific order data, and four
independent state histories without denormalizing them into one status.
**Depends on:** T004
**Likely Files:** `migrations/0004_orders_states.sql`, `src/db/schema.ts`,
`test/db/order-state-migration.spec.ts`

**Acceptance Criteria:**

- `orders.order_id` is unique and immutable by application contract; imported
  source identity is unique within its Sheet/tab connection.
- Order, payment, fulfillment, and remittance histories use separate tables
  with constrained state values, actor, and timestamp.
- Collected and remitted amounts are integer rupiah fields and do not infer
  state changes on another axis.
- Regional records can require area/contact/address/PIC while campus records can
  omit them and use pickup point/PIC.
- Proof storage contains reference metadata only and has no binary/blob column.

**Verification:**

- Run migration constraint tests for duplicate IDs, invalid states, float-like
  values, and cross-mode invalid records.
- Query a fixture order and prove all four current states and latest actors are
  retrievable independently.

**AI Can Help With:** Draft SQL, indexes, typed records, and constraint tests.
**Student Must Judge:** Whether the state/history representation remains
understandable to operators and preserves every approved financial distinction.
**Risk Level:** High

## Issue 6: Add audit, correction, approval, and idempotency migrations

**Task ID:** T006
**User Story:** US-008, US-009
**Requirement IDs:** FR-038-FR-042, NFR-005, NFR-010, NFR-012, SC-008,
AC-005
**Priority:** P1
**Parallelizable:** No
**Goal:** Create append-oriented persistence for proposed issues, approved
financial effects, correction history, and repeated-request protection.
**Depends on:** T005
**Likely Files:** `migrations/0005_audit_corrections_idempotency.sql`,
`src/db/schema.ts`, `test/db/audit-migration.spec.ts`

**Acceptance Criteria:**

- Corrections preserve target ID, before/after values, reason, proposer,
  timestamp, and approver fields where approval is required.
- Audit events capture actor and action without storing passwords, session
  tokens, or unnecessary buyer/proof data.
- Idempotency records bind account, route, key, and request hash to one stored
  result and reject key reuse with a different request.
- Hard-delete support is limited to explicitly disposable draft records; no
  schema path silently deletes confirmed financial history.
- Constraints reject self-contradictory approval and resolution states.

**Verification:**

- Run append/history and idempotency collision tests.
- Inspect database changes from one correction and prove all mandatory audit
  fields remain queryable.

**AI Can Help With:** Draft schema and adversarial constraint tests.
**Student Must Judge:** Which corrections require explicit approval and whether
the stored before/after representation is intelligible during an audit.
**Risk Level:** High

## Issue 7: Add Sheet-sync and report-version migrations

**Task ID:** T007
**User Story:** US-004, US-011
**Requirement IDs:** FR-017-FR-023, FR-050-FR-052, NFR-010, NFR-013,
NFR-014, NFR-026
**Priority:** P1
**Parallelizable:** No
**Goal:** Persist manual sync configuration/results and deterministic closed
report metadata without storing external proof binaries or workbook blobs.
**Depends on:** T006
**Likely Files:** `migrations/0006_sync_reports.sql`, `src/db/schema.ts`,
`test/db/sync-report-migration.spec.ts`

**Acceptance Criteria:**

- Sheet connections store Sheet/tab identity and mapping version but no client
  credential.
- Sync runs and row outcomes retain preview/commit state, source row identity,
  imported/skipped/failed outcome, reason, and linked Order ID.
- A uniqueness rule prevents a committed source identity from creating a second
  order after partial failure or write-back retry.
- Report versions store closed activity reference, generator/template version,
  checksum, creator, and timestamp; no workbook/proof blob is stored in D1.
- Required indexes support row retry, run result, and closed-report lookup.

**Verification:**

- Apply all migrations to a clean local database and run uniqueness/retry tests.
- Inspect a synthetic report-version row and confirm no proof binary or raw
  session/Google secret can be stored through the typed repository.

**AI Can Help With:** Draft SQL, repositories, and migration tests.
**Student Must Judge:** Whether the ledgers contain enough operational evidence
to explain partial failures without collecting excessive sensitive data.
**Risk Level:** High

## Issue 8: Implement versioned password hashing and credential primitives

**Task ID:** T008
**User Story:** US-001, US-002
**Requirement IDs:** FR-001, FR-003, FR-007, FR-008, NFR-003, NFR-004,
AC-001
**Priority:** P1
**Parallelizable:** No
**Goal:** Implement Worker-native salted PBKDF2 password verification and
one-time credential primitives without plaintext persistence or logging.
**Depends on:** T002, T003
**Likely Files:** `src/auth/password.ts`, `src/auth/credentials.ts`,
`src/logging/redaction.ts`, `test/auth/password.spec.ts`

**Acceptance Criteria:**

- Each verifier uses a cryptographically random per-account salt and versioned
  PBKDF2-HMAC-SHA-256 parameters; raw SHA-256 is not accepted.
- Verification is constant-shape for existing and nonexistent accounts and
  supports parameter upgrades after a valid login.
- Temporary passwords are random, one-time, never logged, and mark the account
  for forced replacement.
- Plaintext passwords and salts/verifiers are never returned in DTOs.
- Tests use synthetic credentials and do not assert secret values in snapshots.

**Verification:**

- Run Worker-runtime tests for valid, invalid, nonexistent-user, rehash, and
  temporary-password cases.
- Search logs/test output/source fixtures for plaintext canaries.

**AI Can Help With:** Implement Web Crypto helpers and deterministic tests around
randomness boundaries.
**Student Must Judge:** The chosen parameter policy after deployed CPU evidence;
local spike timing alone must not finalize it.
**Risk Level:** High

## Issue 9: Implement complete server-side session security

**Task ID:** T009
**User Story:** US-001
**Requirement IDs:** FR-001, FR-002, NFR-001-NFR-004
**Priority:** P1
**Parallelizable:** No
**Goal:** Provide random hashed server sessions, secure cookies, CSRF defense,
expiry, and revocation for every protected route.
**Depends on:** T003, T008
**Likely Files:** `src/auth/session.ts`, `src/middleware/authenticate.ts`,
`src/middleware/csrf.ts`, `src/routes/auth.ts`,
`test/auth/session.integration.spec.ts`

**Acceptance Criteria:**

- Cookies contain only a random opaque token and set `Secure`, `HttpOnly`,
  `SameSite`, `Path`, and bounded lifetime attributes.
- D1 stores only the token hash; logout, deactivation, password reset, expiry,
  and explicit invalidation revoke access.
- State-changing routes require the reviewed CSRF control and reject missing,
  invalid, or cross-session tokens.
- Authentication errors and logs expose neither account existence nor token,
  buyer, proof, or financial data.
- Expired, revoked, or must-change-password sessions cannot reach normal
  protected routes.

**Verification:**

- Run direct Worker API tests for cookie attributes, token hashing, CSRF,
  expiry, logout, deactivation, reset, and session fixation attempts.
- Confirm every protected test route passes through the authentication
  middleware.

**AI Can Help With:** Implement middleware, repositories, and security tests.
**Student Must Judge:** Cookie/CSRF behavior in the deployed same-origin flow and
whether the lifetime fits committee operations without weakening revocation.
**Risk Level:** High

## Issue 10: Implement login throttling, lockout, reset, and forced change

**Task ID:** T010
**User Story:** US-001, US-002
**Requirement IDs:** FR-004-FR-009, NFR-004, NFR-005, AC-001
**Priority:** P1
**Parallelizable:** No
**Goal:** Enforce persistent generic login failure behavior and the complete
administrator recovery lifecycle.
**Depends on:** T008, T009
**Likely Files:** `src/services/login.ts`, `src/services/account-recovery.ts`,
`src/routes/auth.ts`, `src/client/auth/`, `test/auth/login-lockout.spec.ts`

**Acceptance Criteria:**

- Consecutive failures persist server-side; after the third, the response remains
  generic and applies a bounded delay.
- The fifth failure locks the account for 15 minutes across browser restarts;
  automatic expiry and authorized admin unlock both work.
- Successful normal login and administrator reset clear only the applicable
  failure state according to one documented policy.
- A reset issues a random one-time password and blocks all normal use until the
  user changes it.
- Login, locked, inactive, and nonexistent-account responses do not reveal
  account existence through response body or materially different code paths.

**Verification:**

- Use a controllable test clock to verify attempts 1-5, 15-minute expiry,
  browser restart, unlock, reset, and forced change.
- Verify the sign-in and forced-change screens retain safe fields and expose no
  credential in logs or URLs.

**AI Can Help With:** Implement transactional counters, fake-clock tests, and
accessible authentication screens.
**Student Must Judge:** The exact short delay after the third failure and the
recovery wording presented to real committee users.
**Risk Level:** High

## Issue 11: Implement the five-role authorization and redaction policy

**Task ID:** T011
**User Story:** US-001, US-005, US-010, US-011
**Requirement IDs:** FR-002, FR-030, FR-031, FR-040, FR-046, FR-047,
FR-050, NFR-001, NFR-006, SC-005
**Priority:** P1
**Parallelizable:** No
**Goal:** Encode the approved five-role matrix, Member/PIC assignment scope, and
role-specific DTO redaction as centralized server policy.
**Depends on:** T009
**Likely Files:** `src/auth/roles.ts`, `src/auth/policy.ts`,
`src/auth/redaction.ts`, `src/middleware/authorize.ts`,
`test/auth/role-matrix.spec.ts`

**Acceptance Criteria:**

- Coordinator, Deputy, Member/PIC, Officer, and Treasurer permissions match the
  approved matrix, including Deputy account administration.
- Member/PIC access is filtered by server-resolved assignment, never a
  client-supplied scope claim.
- Officer/Treasurer DTOs cannot contain buyer contact, address, map, or raw
  operational proof fields.
- Direct route/API requests receive 401/403 without sensitive existence or
  cross-scope detail.
- Policy tests are table-driven so every new route must declare an action and
  all five roles.

**Verification:**

- Run the baseline role-action matrix, cross-scope Member/PIC reads, and DTO
  forbidden-key tests.
- Add a deliberately unregistered protected route in a negative test and prove
  it fails closed.

**AI Can Help With:** Draft a data-driven policy and exhaustive test generator.
**Student Must Judge:** Any permission ambiguity or later rule extension; AI may
not broaden a role to make a feature easier.
**Risk Level:** High

## Issue 12: Prove deployed login CPU and lock behavior

**Task ID:** T012
**User Story:** US-001
**Requirement IDs:** FR-003-FR-008, NFR-020, NFR-024, AC-001
**Priority:** P1
**Parallelizable:** No
**Goal:** Validate the final authentication flow and hash parameters in an
isolated non-production Worker before protected feature work depends on them.
**Depends on:** T010, T011
**Likely Files:** `test/performance/deployed-auth.*`,
`docs/evidence/auth-benchmark-template.md` or an approved evidence location,
`wrangler.jsonc` non-production configuration

**Acceptance Criteria:**

- Only synthetic accounts and an isolated non-production Worker/D1 are used;
  no production deployment or real credentials are involved.
- The deployed test records PBKDF2 CPU/wall timing, normal login latency,
  generic failure behavior, third-failure delay, fifth-failure lock, persistence,
  expiry, and admin unlock.
- Parameters stay within Cloudflare CPU/runtime constraints and the PRD's core
  interaction target, or the task reports the first failing limit.
- Evidence contains no passwords, session tokens, secrets, or account-enumeration
  detail.
- A failed result blocks T013 onward and returns a parameter or architecture
  decision to the owner; it is not bypassed with weaker hashing.

**Verification:**

- Repeat the deployed synthetic scenario enough times to report distribution,
  not one favorable request.
- Compare results with local Worker-runtime tests and inspect Cloudflare
  invocation metadata.

**AI Can Help With:** Build the synthetic benchmark harness and summarize
sanitized timing evidence.
**Student Must Judge:** Whether the measured security/performance tradeoff is
acceptable and approve any parameter or architecture amendment.
**Risk Level:** High

## Issue 13: Deliver account administration

**Task ID:** T013
**User Story:** US-002
**Requirement IDs:** FR-007-FR-009, NFR-005, AC-001
**Priority:** P1
**Parallelizable:** No
**Goal:** Let authorized Coordinator/Deputy users create, deactivate, unlock,
and reset individual local accounts with complete audit evidence.
**Depends on:** T012
**Likely Files:** `src/services/accounts.ts`, `src/routes/accounts.ts`,
`src/client/accounts/`, `test/accounts/account-admin.integration.spec.ts`

**Acceptance Criteria:**

- Account create/deactivate/unlock/reset actions are server-authorized and
  audited.
- Role assignment is restricted to the five approved roles and cannot create a
  shared/default credential.
- Deactivation and reset revoke existing sessions transactionally.
- Temporary-password display is one-time and is not persisted or logged in
  plaintext.
- The mobile UI exposes clear pending/error state and no Officer, Treasurer, or
  Member/PIC can reach the actions by direct API request.

**Verification:**

- Run API/UI tests for each action, concurrent reset/revoke, forbidden roles,
  generic login denial after deactivation, and audit fields.
- Review one full synthetic recovery walkthrough.

**AI Can Help With:** Implement routes, forms, audit wiring, and tests.
**Student Must Judge:** Operational handling of the one-time password and who is
allowed to see it at the moment of reset.
**Risk Level:** High

## Issue 14: Deliver controlled committee and division master data

**Task ID:** T014
**User Story:** US-002, US-007
**Requirement IDs:** FR-010, AC-001, AC-004
**Priority:** P1
**Parallelizable:** Yes, after T012
**Goal:** Maintain selectable committee attribution without automatically
creating application accounts.
**Depends on:** T004, T011, T012
**Likely Files:** `src/services/committee.ts`, `src/routes/committee.ts`,
`src/client/committee/`, `test/committee/committee.integration.spec.ts`

**Acceptance Criteria:**

- Authorized administration can create, edit, activate, and deactivate
  synthetic committee members and divisions.
- A committee member can exist without an account; any optional link to an
  account is explicit and unique.
- Historical attribution survives master-record deactivation.
- Selectors omit inactive records for new attribution while displaying
  historical names safely.
- No source committee spreadsheet is read or written by this feature.

**Verification:**

- Run lifecycle, uniqueness, historical-attribution, and forbidden-role tests.
- Complete a synthetic attribution walkthrough on a mobile viewport.

**AI Can Help With:** Implement CRUD, selectors, and fixture tests.
**Student Must Judge:** Naming and deactivation behavior against the committee's
actual operational language without importing real committee data.
**Risk Level:** Medium

## Issue 15: Implement activity planning rules and calculations

**Task ID:** T015
**User Story:** US-003
**Requirement IDs:** FR-012-FR-016, NFR-011, NFR-025, AC-002
**Priority:** P1
**Parallelizable:** Yes, after T005
**Goal:** Implement pure, independently testable one-product activity
validation and integer-rupiah planning calculations.
**Depends on:** T002, T004
**Likely Files:** `src/domain/activity.ts`, `src/domain/money.ts`,
`test/domain/activity.spec.ts`

**Acceptance Criteria:**

- Planned gross revenue, capital, and gross profit follow the approved formulas
  using integer rupiah only.
- Each additional cost requires an integer amount and non-empty purpose.
- Exactly one mode is accepted; regional requires configured area/PIC and
  campus requires pickup point/PIC without irrelevant regional fields.
- A second product is rejected rather than converted into a hidden catalog.
- Calculation functions have no UI, D1, or network dependency.

**Verification:**

- Run table-driven boundary/property tests for zero, positive, invalid,
  multiple-cost, campus, and regional cases.
- Compare results with T002's independently declared expected totals.

**AI Can Help With:** Implement pure validators and exhaustive tests.
**Student Must Judge:** Field wording and whether the planning summary matches
how the committee explains capital and target decisions.
**Risk Level:** Medium

## Issue 16: Deliver the mobile activity setup and activation flow

**Task ID:** T016
**User Story:** US-003
**Requirement IDs:** FR-011-FR-016, NFR-015-NFR-018, AC-002
**Priority:** P1
**Parallelizable:** No
**Goal:** Provide authorized create/edit/review/activate behavior for a draft
campus or regional activity.
**Depends on:** T011, T012, T014, T015
**Likely Files:** `src/services/activities.ts`, `src/routes/activities.ts`,
`src/client/activities/`, `test/activities/activity.integration.spec.ts`

**Acceptance Criteria:**

- Only Coordinator/Deputy can create, edit, or activate an activity.
- Draft save and activation both revalidate on the server and use the pure T015
  rules.
- Mode changes cannot leave contradictory campus/regional configuration.
- The UI retains valid input after a failed submission, exposes field errors,
  and prevents duplicate submission.
- The planning summary clearly separates revenue, capital, added costs, and
  planned profit.

**Verification:**

- Run API authorization, validation, duplicate-submit, and audit tests.
- Manually complete campus and regional setup at 360x800 and 390x844.

**AI Can Help With:** Build the service, routes, mobile forms, and tests.
**Student Must Judge:** Whether the setup sequence and planning summary are
understandable to Coordinator/Deputy users.
**Risk Level:** Medium

## Issue 17: Implement independent order-state mutation services

**Task ID:** T017
**User Story:** US-005, US-006, US-007
**Requirement IDs:** FR-024-FR-031, NFR-010-NFR-012, SC-003, AC-004
**Priority:** P1
**Parallelizable:** No
**Goal:** Provide transaction-safe, idempotent mutations for each independent
order, payment, fulfillment, and remittance axis.
**Depends on:** T005, T006, T011, T012
**Likely Files:** `src/domain/order-states.ts`, `src/services/orders.ts`,
`src/routes/order-states.ts`, `test/orders/state-transitions.spec.ts`

**Acceptance Criteria:**

- Each endpoint changes exactly one declared axis and appends actor/time history
  without silently updating another.
- Invalid enumerations, impossible amounts, cross-scope access, repeated keys,
  and closed-activity mutations fail without partial writes.
- Member/PIC can update only permitted assigned records and cannot approve
  cancellation, refund, financial correction, audit, or closure.
- Reusing an idempotency key returns the stored result; reusing it with a
  different request is rejected.
- Current state and latest actor for all four axes are retrievable.

**Verification:**

- Run a state-transition cross-product, transaction rollback, concurrency,
  double-tap, and direct unauthorized API suite.
- Inspect one synthetic order timeline after independent updates.

**AI Can Help With:** Implement transactional services and generated transition
tests.
**Student Must Judge:** Whether allowed transitions mirror actual campus and
regional handoffs without collapsing states.
**Risk Level:** High

## Issue 18: Deliver scoped mobile order search and detail

**Task ID:** T018
**User Story:** US-005
**Requirement IDs:** FR-024, FR-030, FR-033, NFR-006, NFR-015-NFR-019,
AC-004
**Priority:** P1
**Parallelizable:** No
**Goal:** Let each operational role find and inspect only authorized order
information from a mobile-first interface.
**Depends on:** T014, T016, T017
**Likely Files:** `src/services/order-queries.ts`, `src/routes/orders.ts`,
`src/client/orders/`, `test/orders/order-query.integration.spec.ts`

**Acceptance Criteria:**

- Search/filter supports permitted activity, Order ID, buyer, attribution,
  division, state, PIC, and region criteria with indexed queries.
- Member/PIC queries are assignment-scoped on the server; Coordinator/Deputy can
  view the full operational record.
- Officer/Treasurer cannot use these routes to retrieve order-level buyer or
  proof data.
- Detail shows the four axes and audit timeline with text/icon status labels.
- Lists use cards/detail pages rather than requiring a wide desktop table.

**Verification:**

- Run filter accuracy, SQL-scope, pagination, forbidden-field, and direct
  cross-scope request tests.
- Manually complete search/open/back/update navigation at both required
  viewports and by keyboard.

**AI Can Help With:** Implement indexed queries, redacted DTOs, responsive UI,
and tests.
**Student Must Judge:** Which information operators need at a glance without
overloading the phone layout or exposing excess PII.
**Risk Level:** High

## Issue 19: Deliver the campus pickup workflow

**Task ID:** T019
**User Story:** US-007
**Requirement IDs:** FR-015, FR-024-FR-033, AC-004
**Priority:** P1
**Parallelizable:** Yes, after T018
**Goal:** Support pickup-point sales and relationship/division attribution
without requiring regional delivery fields.
**Depends on:** T014, T016, T017, T018
**Likely Files:** `src/domain/campus-order.ts`, `src/routes/campus-orders.ts`,
`src/client/orders/campus/`, `test/orders/campus-flow.spec.ts`

**Acceptance Criteria:**

- Campus orders require pickup point and PIC but not regional address/contact.
- Known relationships use controlled committee/division master data.
- An unattributed buyer can receive a division attribution plus an explicit
  pickup-assigned note.
- Permitted pickup/payment/fulfillment changes use T017 and retain actor/time.
- Quantity/target progress does not treat an unsynced or cancelled order as
  trusted fulfillment.

**Verification:**

- Run attributed/unattributed, mode-validation, authorization, and independent
  state tests.
- Complete the synthetic pickup flow on both required mobile viewports.

**AI Can Help With:** Implement mode-specific validation, screens, and tests.
**Student Must Judge:** Whether the relationship and assigned-at-pickup wording
matches the committee workflow.
**Risk Level:** Medium

## Issue 20: Deliver the regional distribution workflow

**Task ID:** T020
**User Story:** US-006
**Requirement IDs:** FR-014, FR-024-FR-033, AC-004
**Priority:** P1
**Parallelizable:** Yes, after T018
**Goal:** Support area/PIC assignment and each regional handoff while preserving
independent fulfillment, payment, and remittance meaning.
**Depends on:** T014, T016, T017, T018
**Likely Files:** `src/domain/regional-order.ts`,
`src/routes/regional-orders.ts`, `src/client/orders/regional/`,
`test/orders/regional-flow.spec.ts`

**Acceptance Criteria:**

- Confirmed regional orders require area, contact/address, and assigned PIC.
- Handed-over, received, paid/partial, and remitted updates remain independent.
- Coordinator/Deputy can filter unresolved work by area and PIC.
- Member/PIC sees and mutates only assigned regional orders.
- Mode-specific errors retain valid input and reveal no cross-scope buyer data.

**Verification:**

- Run two-PIC/two-region fixture, cross-scope denial, partial payment, and
  unremitted money scenarios.
- Complete the distribution handoff flow at both required mobile viewports.

**AI Can Help With:** Implement regional validation, queues, and tests.
**Student Must Judge:** Whether the handoff labels and unresolved filters match
actual regional operations.
**Risk Level:** High

## Issue 21: Implement independent financial read models

**Task ID:** T021
**User Story:** US-008
**Requirement IDs:** FR-034-FR-038, FR-044, FR-045, NFR-011, NFR-025,
SC-006, AC-005
**Priority:** P1
**Parallelizable:** No
**Goal:** Calculate recognized, collected, outstanding, remitted, capital, and
approved-loss values independently from UI rendering.
**Depends on:** T002, T015, T017, T019, T020
**Likely Files:** `src/domain/finance.ts`, `src/services/financial-read-model.ts`,
`test/domain/finance.spec.ts`, `test/finance/read-model.integration.spec.ts`

**Acceptance Criteria:**

- Recognized revenue uses received quantity times selling price.
- Collected uses actual payment amounts; outstanding and remitted are separate.
- Planned capital includes itemized additional costs; approved losses remain
  explicit rather than altering original order values.
- Cancelled, voided, and unsynced values are excluded by documented rules.
- All calculations use integer rupiah and return enough components to audit the
  total.

**Verification:**

- Compare pure and D1 read-model outputs with T002's independent expected
  results for mixed states.
- Test boundary, cancellation, partial payment, duplicate retry, and large
  integer cases.

**AI Can Help With:** Implement pure calculations, queries, and exhaustive
fixture tests.
**Student Must Judge:** Whether the displayed terminology preserves the
committee's distinction between revenue, cash collection, remittance, capital,
and loss.
**Risk Level:** High

## Issue 22: Deliver issue, correction, approval, and audit history

**Task ID:** T022
**User Story:** US-009
**Requirement IDs:** FR-039-FR-042, NFR-005, NFR-010, SC-008, AC-005
**Priority:** P1
**Parallelizable:** No
**Goal:** Correct human error without erasing confirmed or financially
meaningful history.
**Depends on:** T006, T011, T017, T021
**Likely Files:** `src/services/issues.ts`, `src/services/corrections.ts`,
`src/routes/corrections.ts`, `src/client/corrections/`,
`test/corrections/correction-flow.spec.ts`

**Acceptance Criteria:**

- Members/PICs can flag supported issue types and supply reasons but cannot
  finalize financial effects.
- Only Coordinator/Deputy can approve voids, refunds, financial corrections,
  or loss classifications.
- Approved changes preserve record ID, before/after, actor, time, reason, and
  approver in one transaction.
- Disposable drafts alone can be hard-deleted; confirmed records are
  voided/corrected.
- Repeated proof and invalid proof remain reviewable and never cause automatic
  order deletion.

**Verification:**

- Run typo, duplicate, invalid proof, refund, loss, forbidden approval,
  idempotent retry, and rollback scenarios.
- Inspect the resulting immutable synthetic timeline against SC-008.

**AI Can Help With:** Implement workflows, timelines, and adversarial tests.
**Student Must Judge:** Whether correction reasons and approval UX provide
defensible audit evidence without making routine work unusable.
**Risk Level:** High

## Issue 23: Implement private proof-reference handling and DTO privacy

**Task ID:** T023
**User Story:** US-005, US-009, US-011
**Requirement IDs:** FR-032, FR-046, FR-051, NFR-006, NFR-007
**Priority:** P1
**Parallelizable:** No
**Goal:** Store and expose only validated Google Drive reference metadata under
the approved need-to-know boundary.
**Depends on:** T011, T017, T022
**Likely Files:** `src/domain/proof-reference.ts`,
`src/services/proof-references.ts`, `src/auth/redaction.ts`,
`test/privacy/proof-reference.spec.ts`

**Acceptance Criteria:**

- Input accepts only the reviewed Drive reference forms and never fetches,
  previews, proxies, or stores binary proof content.
- Stored fields are limited to the reference/file identifier and necessary
  supporting metadata.
- Coordinator/Deputy and assigned Member/PIC access follows server policy;
  Officer/Treasurer operational DTOs contain no raw reference.
- Logs, errors, analytics, and audit summaries redact the reference.
- Invalid or inaccessible references become reviewable issues rather than
  silently deleting or mutating confirmed orders.

**Verification:**

- Run URL-form, non-Drive, injection, log-redaction, forbidden-role, and
  invalid-proof workflow tests with `example.invalid` fixtures.
- Inspect D1 schema and DTO snapshots for prohibited binary/raw fields.

**AI Can Help With:** Implement parsing, redaction, and synthetic tests without
accessing Drive.
**Student Must Judge:** The minimum metadata needed and the operator message
when a private link is inaccessible.
**Risk Level:** High

## Issue 24: Prove the private Drive ACL and manual proof-link workflow

**Task ID:** T024
**User Story:** US-005, US-011
**Requirement IDs:** FR-032, FR-046, FR-051, NFR-006, NFR-007
**Priority:** P1
**Parallelizable:** No
**Goal:** Obtain project-owner evidence that the designated private Drive
folder and representative proof-link workflow enforce the intended people
boundary before report links are finalized.
**Depends on:** T023
**Likely Files:** Approved private evidence record outside source control;
`docs/evidence/drive-acl-checklist-template.md` only if the owner approves that
sanitized template location

**Acceptance Criteria:**

- The owner designates the private folder and controls who performs the ACL
  inspection; AI does not enumerate or modify the real ACL.
- Representative intended and unintended role holders verify access/denial
  using a non-buyer test proof or other owner-approved safe artifact.
- The workflow confirms that app authorization cannot grant Drive access and
  documents who repairs broken/private/public links.
- Evidence records the result without copying the real link, file name, ACL
  membership, buyer data, or proof content into the repository or PR.
- A public-link or over-broad-access result fails the gate and blocks T031/T033.

**Verification:**

- Project owner signs off the sanitized checklist and result.
- Re-run T023 privacy tests after incorporating any approved handling changes.

**AI Can Help With:** Draft the checklist and evaluate redacted findings supplied
by the owner.
**Student Must Judge:** The actual Drive membership, privacy acceptability, and
whether the operational sharing policy is ready.
**Risk Level:** High

## Issue 25: Resolve `Column 1` and provision a sanitized duplicate Sheet

**Task ID:** T025
**User Story:** US-004
**Requirement IDs:** FR-017, FR-018, NFR-008, NFR-014, AC-003
**Priority:** P1
**Parallelizable:** No
**Goal:** Establish an explicitly authorized, sanitized integration target and
the final `Column 1` mapping decision before any Sheet API implementation.
**Depends on:** T002, T011, T016
**Likely Files:** Environment/config templates and a sanitized mapping fixture;
no real Sheet contents or credentials in source control

**Acceptance Criteria:**

- The project owner defines or removes `Column 1`; until then the mapper ignores
  it and no production mapping proceeds.
- A separate duplicate response Sheet is created with sanitized rows, the
  verified response headers, and an application-managed `Order ID` header.
- Access is limited to the smallest test credential scope and the duplicate
  Sheet is unmistakably separated from the real response Sheet.
- The application configuration has an explicit real-write kill switch that
  remains disabled.
- No real Sheet row, buyer data, proof link, Google credential, or source ID is
  copied into code, fixtures, logs, or PR evidence.

**Verification:**

- Owner reviews the redacted header/mapping description and duplicate-Sheet
  authorization.
- A configuration test rejects an unknown/real target when the proof flag is
  not enabled.

**AI Can Help With:** Draft sanitized header fixtures, config validation, and a
least-scope checklist.
**Student Must Judge:** The meaning/removal of `Column 1` and authorize the
duplicate Sheet and test credential.
**Risk Level:** High

## Issue 26: Implement header-driven sync preview

**Task ID:** T026
**User Story:** US-004
**Requirement IDs:** FR-017, FR-018, FR-022, NFR-013, NFR-021, AC-003
**Priority:** P1
**Parallelizable:** No
**Goal:** Read and validate sanitized Sheet headers/rows and show a no-write
preview with row-level reasons.
**Depends on:** T007, T012, T025
**Likely Files:** `src/integrations/sheets/client.ts`,
`src/integrations/sheets/mapping.ts`, `src/services/sync-preview.ts`,
`src/routes/sync.ts`, `src/client/sync/`, `test/sync/preview.spec.ts`

**Acceptance Criteria:**

- Only Coordinator/Deputy can initiate preview.
- Mapping is by exact normalized header names; it never assumes column L and
  ignores the resolved/removed `Column 1` according to T025.
- Missing, duplicate, renamed, or ambiguous required headers stop before any
  D1/order/Sheet write.
- Preview classifies each sanitized row as candidate, existing-ID skip, or
  malformed with a row-level reason and no buyer value in logs.
- UI exposes pending/progress state and prevents duplicate preview submission.

**Verification:**

- Run mapping permutations, reordered/right-shifted `Order ID`, missing header,
  malformed row, unauthorized role, logging, and no-write tests.
- Inspect a preview trace and prove zero D1 order mutations and zero Sheet
  writes.

**AI Can Help With:** Implement the adapter, pure mapper, preview route, and
tests using sanitized fixtures/test doubles.
**Student Must Judge:** Whether preview explanations are clear enough to prevent
an operator from committing a bad mapping.
**Risk Level:** High

## Issue 27: Implement idempotent sync commit and narrow ID write-back

**Task ID:** T027
**User Story:** US-004
**Requirement IDs:** FR-019-FR-023, NFR-010, NFR-013, NFR-014, SC-001,
SC-002, AC-003
**Priority:** P1
**Parallelizable:** No
**Goal:** Commit each valid source row once and write only the same immutable
Order ID into the header-located source cell, safely across partial failures.
**Depends on:** T005, T006, T007, T017, T026
**Likely Files:** `src/services/sync-commit.ts`,
`src/integrations/sheets/client.ts`, `src/routes/sync.ts`,
`src/client/sync/results/`, `test/sync/commit.spec.ts`

**Acceptance Criteria:**

- The D1 transaction creates one order/ledger result before an `Order ID`
  write-back is attempted.
- Retry checks D1 source identity, ledger state, and source ID so a failed
  write-back cannot create a second order.
- Existing IDs are skipped; malformed rows fail independently with clear
  reasons; imported/skipped/failed counts match row results.
- Only the one header-located `Order ID` cell is writable; all other response
  cells are protected by the adapter contract.
- A double tap, replayed commit, interrupted batch, or later Sheet edit cannot
  duplicate or silently overwrite trusted application data.

**Verification:**

- Run test-double scenarios for full success, failure before commit, failure
  after D1 commit/before write-back, mixed batch, retry, replay, and changed
  source values.
- Assert the captured write set contains only `Order ID` cells.

**AI Can Help With:** Implement the transaction/ledger algorithm and fault
injection suite.
**Student Must Judge:** Row-level operator messaging and whether every partial
state is recoverable without manual data surgery.
**Risk Level:** High

## Issue 28: Pass the three-run sanitized duplicate-Sheet proof

**Task ID:** T028
**User Story:** US-004
**Requirement IDs:** FR-018-FR-023, NFR-010, NFR-013, NFR-014, SC-001,
SC-002, AC-003
**Priority:** P1
**Parallelizable:** No
**Goal:** Prove the real integration behavior on the owner-authorized sanitized
duplicate Sheet before any real-Sheet write is enabled.
**Depends on:** T027
**Likely Files:** `test/e2e/sanitized-sheet-proof.*` and an owner-approved
sanitized evidence record; never a downloaded real Sheet

**Acceptance Criteria:**

- The duplicate Sheet includes valid, malformed, existing-ID, and intentionally
  interrupted rows with no real data.
- Three sync runs create zero additional orders after the first successful
  import, while failed rows remain safely retryable.
- Captured Sheet history proves only the header-located `Order ID` cells changed
  and the same immutable IDs exist in D1.
- New Form responses coexist with the added `Order ID` column without shifting
  or destroying mapping.
- Real-Sheet writes remain disabled after the proof; enabling them requires a
  separate explicit owner production decision outside this planning task.

**Verification:**

- Reconcile D1 order/ledger counts with all three run results and the duplicate
  Sheet's `Order ID` cells.
- Project owner reviews the sanitized proof record and explicitly accepts or
  rejects the gate.

**AI Can Help With:** Run the authorized synthetic harness and summarize
redacted counts/failures.
**Student Must Judge:** Whether the duplicate accurately represents the Form
workflow and whether the evidence is sufficient to consider later real writes.
**Risk Level:** High

## Issue 29: Deliver role-appropriate dashboard summaries

**Task ID:** T029
**User Story:** US-010
**Requirement IDs:** FR-043-FR-046, NFR-006, SC-005, AC-006
**Priority:** P1
**Parallelizable:** No
**Goal:** Show accurate activity status, progress, money, and unresolved counts
without leaking order-level personal/proof data to report-only roles.
**Depends on:** T021, T022, T028
**Likely Files:** `src/services/dashboard.ts`, `src/routes/dashboard.ts`,
`src/client/dashboard/`, `test/dashboard/dashboard.spec.ts`

**Acceptance Criteria:**

- Dashboard distinguishes draft, active, and closed activities.
- Active summaries show target, confirmed, received, recognized, collected,
  outstanding, remitted, and unresolved values from T021.
- Cancelled, voided, and unsynced values follow the documented exclusions.
- Coordinator/Deputy and assigned Member/PIC receive permitted views;
  Officer/Treasurer receive aggregates only with no buyer/proof fields.
- Unresolved counts link only to routes the current role can access.

**Verification:**

- Compare every displayed value with independent fixture expectations for all
  five roles.
- Run forbidden-key, direct aggregate-route, empty/large activity, and stale
  state tests.

**AI Can Help With:** Implement queries, role DTOs, cards, and tests.
**Student Must Judge:** Which few metrics best support immediate oversight
without drifting into advanced analytics.
**Risk Level:** High

## Issue 30: Implement reconciliation, closure blockers, and closed read-only state

**Task ID:** T030
**User Story:** US-008, US-009, US-011
**Requirement IDs:** FR-038-FR-049, NFR-010, NFR-025, AC-005, AC-007
**Priority:** P1
**Parallelizable:** No
**Goal:** Close an activity only after every unresolved operational/financial
condition is listed and approved, then reject all MVP operational mutations.
**Depends on:** T022, T029
**Likely Files:** `src/domain/closure.ts`, `src/services/reconciliation.ts`,
`src/services/closure.ts`, `src/routes/closure.ts`,
`src/client/reconciliation/`, `test/closure/closure.spec.ts`

**Acceptance Criteria:**

- A pure closure validator returns the complete list of unresolved orders,
  remittances, discrepancies, and issues.
- Only Coordinator/Deputy can close and the action is idempotent and audited.
- Closure occurs transactionally only when the blocker list is empty.
- Every operational mutation, correction approval, sync commit, and regeneration
  path rejects a closed activity according to its contract.
- Reopening is absent from the MVP.

**Verification:**

- Run one test per blocker class, combined blockers, unauthorized closure,
  concurrent close/mutation, repeat close, and post-close route matrix.
- Compare reconciliation values with T002/T021 independent totals.

**AI Can Help With:** Implement pure blockers, transactional close, UI, and
route-matrix tests.
**Student Must Judge:** Whether the blocker wording gives the Coordinator enough
information to resolve each item without permitting silent exceptions.
**Risk Level:** High

## Issue 31: Generate the draft four-group workbook

**Task ID:** T031
**User Story:** US-011
**Requirement IDs:** FR-050-FR-052, NFR-025, SC-009, AC-007
**Priority:** P1
**Parallelizable:** No
**Goal:** Generate a deterministic in-memory `.xlsx` from a closed sanitized
snapshot using the accepted writer and report rules.
**Depends on:** T002, T021, T022, T024, T030
**Likely Files:** `src/reports/workbook-data.ts`,
`src/reports/workbook.ts`, `test/reports/workbook.spec.ts`,
`test/artifacts/` ignored/generated outputs

**Acceptance Criteria:**

- `write-excel-file@4.1.1` produces the four required table groups in the
  approved order.
- Transaction rows include Payment Method/Issue, QTY, Amount (Rp), and Notes;
  authorized synthetic evidence hyperlinks appear only where relevant.
- Dark headers, integer-rupiah formats, automatic formulas, and optional
  committee-chair/Treasurer signature rows are present.
- Workbook data shaping is deterministic and independently testable from HTTP
  or UI rendering.
- The file opens in Microsoft Excel and formulas, formatting, links, and totals
  are manually inspected using only sanitized data.

**Verification:**

- Run archive/XML structural and formula tests plus an independent total check.
- Open the generated sanitized workbook in Excel and record a redacted visual
  checklist; do not commit generated reports unless explicitly safe/needed.

**AI Can Help With:** Implement workbook shaping/generation and structural
tests.
**Student Must Judge:** Readability, labels, page flow, and whether the workbook
accurately communicates financial meaning.
**Risk Level:** High

## Issue 32: Obtain Treasurer approval of the workbook layout

**Task ID:** T032
**User Story:** US-011
**Requirement IDs:** FR-050-FR-052, SC-009, AC-007
**Priority:** P1
**Parallelizable:** No
**Goal:** Secure explicit Treasurer review of the sanitized draft layout before
the final report lifecycle is implemented for production use.
**Depends on:** T031
**Likely Files:** Owner-approved sanitized review checklist/evidence location;
no real report, buyer data, proof link, or signature in source control

**Acceptance Criteria:**

- Treasurer reviews a sanitized workbook in Excel, including group order,
  columns, formulas, rupiah formatting, evidence-link placement, and optional
  signature rows.
- Feedback is recorded without buyer/financial/proof data and is either
  implemented in T031 or explicitly accepted as a later owner-approved change.
- Approval names the reviewed template version/checksum.
- A rejection returns to T031; it cannot be bypassed by labeling the current
  layout "provisional."
- No production report is generated or distributed before approval.

**Verification:**

- Project owner records the Treasurer's explicit acceptance of the sanitized
  template version.
- Re-run T031 structural and Excel-open checks after any layout change.

**AI Can Help With:** Prepare the sanitized review checklist and implement
approved layout feedback.
**Student Must Judge:** The Treasurer's approval, financial readability, and
whether feedback changes scope or only presentation.
**Risk Level:** High

## Issue 33: Deliver versioned report generation and authorized download

**Task ID:** T033
**User Story:** US-011
**Requirement IDs:** FR-046, FR-049-FR-052, NFR-006, NFR-021, SC-009,
AC-007
**Priority:** P1
**Parallelizable:** No
**Goal:** Generate one versioned report for a closed activity and enforce the
approved generation/download role split.
**Depends on:** T007, T011, T030, T032
**Likely Files:** `src/services/reports.ts`, `src/routes/reports.ts`,
`src/client/reports/`, `test/reports/report-lifecycle.spec.ts`

**Acceptance Criteria:**

- Only Coordinator/Deputy can generate; Coordinator/Deputy/Officer/Treasurer
  can download the generated closed report; Member/PIC cannot export.
- Open or mutating activities return a clear 409; generation uses a stable
  closed snapshot/template version and writes checksum metadata.
- Duplicate generation requests are idempotent and expose pending/progress state
  without creating unintended versions.
- Officer/Treasurer application DTOs remain aggregate-only even though the
  approved workbook may contain evidence links.
- Downloads set correct XLSX content type/disposition and `no-store`; D1 stores
  metadata, not workbook or proof binaries.

**Verification:**

- Run all-five-role direct API generation/download tests, double-submit,
  closed/open, checksum, deterministic regeneration, and error-retry tests.
- Open a downloaded sanitized file in Excel and match it to the approved T032
  template version.

**AI Can Help With:** Implement orchestration, routes, pending UI, and tests.
**Student Must Judge:** Versioning semantics and whether download behavior
matches the Officer/Treasurer reporting workflow.
**Risk Level:** High

## Issue 34: Pass the complete five-role authorization and privacy gate

**Task ID:** T034
**User Story:** US-001, US-005, US-010, US-011
**Requirement IDs:** FR-001, FR-002, FR-009, FR-017, FR-030, FR-031,
FR-040, FR-046, FR-047, FR-050, NFR-001, NFR-006, SC-005, AC-001,
AC-004, AC-006, AC-007
**Priority:** P1
**Parallelizable:** No
**Goal:** Prove every protected read/mutation and sensitive-field boundary for
all five roles after the route set is complete.
**Depends on:** T013, T014, T016-T023, T026, T027, T029, T030, T033
**Likely Files:** `test/security/authorization-matrix.spec.ts`,
`test/security/privacy-dto.spec.ts`, `src/auth/policy.ts`

**Acceptance Criteria:**

- A machine-readable inventory contains every protected route/action and all
  five roles; the test fails if a route is unregistered.
- Tests deny 100% of forbidden role-action combinations by direct API request.
- Member/PIC cross-assignment reads/mutations and guessed resource IDs fail
  closed.
- Officer/Treasurer receive no buyer contact, address, map, or raw operational
  proof field from any application endpoint.
- Account, financial approval, closure, sync, generation, and download
  boundaries match the approved matrix exactly.

**Verification:**

- Run the complete authorization/privacy matrix with field-level DTO scanning.
- Review the generated allowed/denied table against the PRD and constitution,
  then obtain project-owner acceptance.

**AI Can Help With:** Generate route inventory, matrix tests, and discrepancy
reports.
**Student Must Judge:** Every allowed action and any mismatch; convenience is
not evidence for broadening access.
**Risk Level:** High

## Issue 35: Pass mobile and accessibility validation

**Task ID:** T035
**User Story:** US-001-US-011
**Requirement IDs:** NFR-015-NFR-019, SC-004, AC-004, AC-009
**Priority:** P1
**Parallelizable:** Yes, after all P1 UI flows exist
**Goal:** Verify every P1 flow is usable at required phone sizes and meets the
approved keyboard, focus, naming, status, and validation rules.
**Depends on:** T013, T014, T016, T018-T020, T022, T026, T027, T029, T030,
T033
**Likely Files:** `src/client/`, `public/`, `test/e2e/accessibility.*`,
`test/e2e/mobile.*`

**Acceptance Criteria:**

- Sign-in/recovery, setup, sync, search/detail/update, campus, regional,
  reconciliation, closure, and report flows pass at 360x800 and 390x844.
- No P1 page has page-level horizontal scrolling or requires a desktop table.
- All controls are keyboard reachable, visibly focused, programmatically named,
  and touch-appropriate.
- Status never relies on color alone; field-level errors retain valid input.
- Long operations expose pending/progress and prevent accidental duplicate
  submission.

**Verification:**

- Run automated accessibility checks plus manual keyboard/touch/viewport
  checklists on current stable Chromium.
- Record only sanitized screenshots/evidence and rerun the PII scan canary.

**AI Can Help With:** Run audits, identify responsive/accessibility defects, and
implement focused fixes.
**Student Must Judge:** Real usability, wording, focus order, and whether core
tasks remain understandable on a phone.
**Risk Level:** High

## Issue 36: Pass representative 150-order performance and free-tier validation

**Task ID:** T036
**User Story:** US-004-US-011
**Requirement IDs:** NFR-020, NFR-021, NFR-024, SC-006, SC-009
**Priority:** P1
**Parallelizable:** No
**Goal:** Measure complete representative paths and D1/Worker usage with 150
synthetic orders before accepting free-tier viability.
**Depends on:** T028-T035
**Likely Files:** `test/performance/representative-activity.*`,
`scripts/seed-synthetic-activity.*`, approved sanitized performance evidence

**Acceptance Criteria:**

- A reproducible seed creates one 150-order synthetic activity with mixed
  campus/regional-shaped states, payments, remittances, issues, and corrections
  without PII.
- Measurements cover dashboard/filter, state update, sync preview/commit,
  closure, and 150-order XLSX generation.
- Results report p95 authenticated API latency, export duration/memory,
  Worker/subrequest count, and D1 rows read/written for each path.
- Core APIs meet the two-second target for 95% of interactions excluding sync
  and export, stay below 50 subrequests/request, and demonstrate comfortable
  margin under current free-tier quotas.
- A failing limit is reported as the first observed constraint; infrastructure
  is not expanded without owner approval.

**Verification:**

- Repeat the sanitized deployed non-production scenario enough times for a
  meaningful p95 and compare D1 metadata with daily quota projections.
- Open the resulting 150-order workbook in Excel and confirm usability.

**AI Can Help With:** Build the seed/load harness, collect metrics, and summarize
redacted results.
**Student Must Judge:** Whether margins are operationally acceptable and approve
any indexing, parameter, or architecture adjustment.
**Risk Level:** High

## Issue 37: Rehearse versioned migrations locally and remotely

**Task ID:** T037
**User Story:** Cross-cutting persistence for US-001-US-011
**Requirement IDs:** NFR-012, NFR-026
**Priority:** P1
**Parallelizable:** No
**Goal:** Prove the same checked-in migrations create and upgrade local and
isolated non-production D1 databases reproducibly.
**Depends on:** T007, T033, and every later task that adds a migration
**Likely Files:** `migrations/`, `scripts/rehearse-migrations.*`,
`test/db/migration-rehearsal.spec.ts`, non-production D1 configuration

**Acceptance Criteria:**

- A fresh database reaches the expected final schema using only ordered
  checked-in SQL migrations.
- A database at the prior supported schema upgrades without losing or
  contradicting sanitized records.
- Constraint/index inspection matches the approved data model and
  `d1_migrations` records every applied version once.
- The same rehearsal passes locally and against an isolated remote D1 database.
- No production D1 target, real record, secret, or destructive reset is used.

**Verification:**

- Run fresh, upgrade, repeat/no-op, and deliberate-failure/rollback rehearsals
  locally and remotely.
- Compare schema/index manifests and sanitized row counts before/after.

**AI Can Help With:** Build the rehearsal script, schema manifest, and tests.
**Student Must Judge:** The safe remote target, upgrade fixture, and whether any
migration needs an explicit backup/rollback procedure.
**Risk Level:** High

## Issue 38: Pass the final privacy and PII artifact scan

**Task ID:** T038
**User Story:** US-001-US-011
**Requirement IDs:** NFR-003, NFR-006-NFR-009, SC-010, AC-010
**Priority:** P1
**Parallelizable:** No
**Goal:** Demonstrate that repository history in scope, fixtures, logs,
screenshots, build artifacts, and test exports contain no real sensitive data.
**Depends on:** T034-T037
**Likely Files:** `scripts/scan-sensitive-artifacts.*`, `.gitignore`,
CI configuration, approved sanitized scan report

**Acceptance Criteria:**

- Scan scope covers tracked/untracked source artifacts, fixtures, test output,
  logs, screenshots, generated workbooks, and client/server bundles.
- Patterns include real-source identifiers where safely represented as hashes
  or denylisted canaries, phone/address/map/proof-link forms, credential names,
  session tokens, and unexpected financial source data.
- Findings are reported without echoing the sensitive value into logs or PR
  comments.
- Role-view tests reconfirm Officer/Treasurer exclusions and local storage is
  checked for buyer/proof remnants.
- Any unexplained finding fails the gate and blocks demo, production deployment,
  and release.

**Verification:**

- Run the clean scan plus known-bad canaries for each class to prove the scanner
  detects and redacts them.
- Project owner reviews the sanitized result and all resolved findings.

**AI Can Help With:** Maintain scanners, classify redacted findings, and propose
safe remediation.
**Student Must Judge:** Whether every finding is benign and whether scan coverage
is sufficient for actual release artifacts.
**Risk Level:** High

## Issue 39: Complete P1 traceability and release-evidence review

**Task ID:** T039
**User Story:** US-001-US-011
**Requirement IDs:** FR-001-FR-052, SC-001-SC-010, AC-001-AC-010,
NFR-001-NFR-026
**Priority:** P1
**Parallelizable:** No
**Goal:** Assemble the reproducible evidence for every approved P1 requirement
and stop for the project owner's release judgment.
**Depends on:** T012, T024, T028, T032, T034-T038
**Likely Files:** Approved traceability/evidence index under `docs/ai-native/`
or project issue tracker after owner approval; no production secrets or real
data

**Acceptance Criteria:**

- Every P1 user story, FR, NFR, SC, and release AC maps to an implementation
  task plus automated/manual/external evidence.
- Every constitution gate is marked passed, failed, or explicitly deferred with
  owner authority; no assertion alone counts as evidence.
- Dependency, build, test, migration, authorization, privacy, mobile, external
  Sheet/Drive, performance, and Excel/Treasurer results are reproducible.
- No out-of-scope feature, real data, real-Sheet write, production deployment,
  or reopening/local-draft behavior is smuggled into acceptance.
- The project owner decides whether P1 is accepted; this task does not merge or
  release by itself.

**Verification:**

- Run the complete clean-install check/test/build/audit suite and review the
  traceability matrix row by row.
- Project owner signs off or returns specific failed/missing evidence to its
  owning Task ID.

**AI Can Help With:** Generate the evidence index, identify uncovered IDs, and
summarize test results.
**Student Must Judge:** Whether the evidence truly proves the product intent and
whether any failure needs rework, explicit deferment, or scope amendment.
**Risk Level:** High

## Issue 40: Optionally add safe weak-network new-entry drafts

**Task ID:** T040
**User Story:** US-012
**Requirement IDs:** FR-053-FR-056, NFR-009, NFR-010, SC-007, AC-008
**Priority:** P2 - not authorized for the P1 release
**Parallelizable:** No
**Goal:** If and only if separately approved after the P1 loop, preserve a
visibly unsynced new entry locally and create at most one server record on retry.
**Depends on:** T039 plus explicit project-owner opt-in
**Likely Files:** `src/client/drafts/`, `src/services/manual-orders.ts`,
`test/e2e/weak-network-draft.*`

**Acceptance Criteria:**

- The feature stores only the minimum new-entry payload and labels it local and
  unsynced.
- Shared dashboards, reports, audits, and financial totals never include local
  drafts.
- Retry uses an idempotency key and creates at most one server order.
- Successful sync, explicit discard, logout, session expiry/revocation,
  deactivation, and password reset clear the draft.
- If cleanup or duplicate prevention cannot be demonstrated, the feature is
  excluded rather than approximated.

**Verification:**

- Run interrupted submission, reload, reconnect/retry, double retry, discard,
  logout, expiry, reset, and storage inspection tests.
- Re-run the privacy scan and confirm SC-007 with server-side counts.

**AI Can Help With:** Implement the isolated client envelope, retry contract,
and network-interruption tests after approval.
**Student Must Judge:** Whether the privacy cost of temporary device storage is
acceptable and whether the P2 feature should ship at all.
**Risk Level:** High

## Coverage Audit

### Requirement coverage

| Approved area | Primary tasks |
| --- | --- |
| US-001-US-002, FR-001-FR-010 | T003, T008-T014, T034 |
| US-003, FR-011-FR-016 | T004, T015-T016 |
| US-004, FR-017-FR-023 | T005, T007, T025-T028 |
| US-005-US-007, FR-024-FR-033 | T005, T011, T017-T020, T023 |
| US-008-US-009, FR-034-FR-042 | T006, T017, T021-T022, T030 |
| US-010-US-011, FR-043-FR-052 | T007, T024, T029-T033 |
| US-012, FR-053-FR-056 | T040 only; explicitly outside P1 without owner opt-in |
| NFR-001-NFR-005 | T001, T003, T008-T013, T034, T038 |
| NFR-006-NFR-009 | T002, T011, T018, T023-T024, T029, T033-T035, T038, T040 |
| NFR-010-NFR-014 | T003-T007, T017, T021-T022, T025-T028, T030, T037 |
| NFR-015-NFR-019 | T016, T018-T020, T026, T029-T030, T033, T035 |
| NFR-020-NFR-022 | T012, T026-T027, T033, T036 |
| NFR-023-NFR-026 | T001, T003-T007, T015, T021, T030-T031, T036-T037 |
| SC-001-SC-010 | T002, T005, T008-T012, T017, T021-T022, T028-T039 |
| AC-001-AC-010 | T002, T012-T039; optional AC-008 is T040 if approved |

### Mandatory remaining-gate coverage

| Required unresolved evidence | Owning tasks |
| --- | --- |
| Representative 150-order/free-tier validation | T036 |
| Deployed login CPU/lock and full session security | T009-T012 |
| Sanitized duplicate Sheet, header-driven `Order ID`, three runs | T025-T028 |
| Define or remove `Column 1` | T025 |
| Private Drive ACL and role proof-link handling | T023-T024 |
| Five-role authorization and privacy | T011, T034 |
| Repository/fixture/log/export PII scan | T002, T038 |
| Mobile and accessibility at both required viewports | T035 |
| Fresh/upgrade local and remote migration rehearsal | T037 |
| Treasurer workbook-layout approval | T031-T032 |

No approved P1 requirement or mandatory remaining gate is intentionally
unassigned. T040 is the only approved P2 candidate and remains unscheduled
without separate owner approval.

## Owner Review Questions

1. Do you approve the T001-T039 order, scope, dependencies, and risk gates as
   the P1 implementation backlog?
2. Are any tasks still too large to review in one sitting, or should any
   parallelizable task be made sequential to reduce file overlap?
3. Do you approve the named blocking rules for deployed authentication, Drive,
   duplicate Sheet, Treasurer layout, authorization/privacy, performance,
   migrations, and the PII scan?
4. Should T040 remain deferred and unpublished unless you explicitly opt in
   after P1 acceptance?
5. After approval, may these Task IDs be published as individual GitHub issues,
   one issue per task, without changing their approved scope?

## Next Step

Stop for project-owner review. Do not publish individual GitHub issues and do
not run `issue-to-prompt` yet. After the owner accepts this artifact, publish
only the approved tasks, then select the first dependency-ready task and use
`issue-to-prompt`.
