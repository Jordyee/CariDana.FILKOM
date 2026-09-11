# Product migrations

T001 removed the compatibility-spike schema. `0001_identity_sessions.sql` is
the first product migration; the backlog's `0002` filename was illustrative.
Add subsequent migrations sequentially. Do not edit a published/applied product
migration to change its meaning.

T003--T005 have no production D1 binding or remote database identifier. `npm run verify`
runs the checked-in SQL through Cloudflare's `readD1Migrations` and
`applyD1Migrations` helpers against disposable local D1 databases in Vitest.
Focused commands are `npx vitest run test/db/identity-migration.spec.ts` and
`npx vitest run test/db/order-state-migration.spec.ts`.
No manual remote migration or credential setup is needed for these tests.

## Identity storage contract

- `username` is a unique canonical login key using lowercase ASCII letters,
  digits, dot, underscore and hyphen. SQL rejects noncanonical values, including
  whitespace, uppercase, non-ASCII and embedded NUL. Later account/login services
  normalize and validate input before persistence/lookup. This is not a display
  name or a committee-member identity.
- Roles are `coordinator`, `deputy`, `member` (Member/PIC), `officer`, `treasurer`.
  Persisting them grants no route permissions. The approved Coordinator/Deputy
  administration boundary is unchanged.
- Active/reset flags must be supplied explicitly. Only the failure count has a
  default (zero). Nullable `locked_until` retains lock state without selecting
  login delay/unlock behavior. No bootstrap accounts or credentials are seeded.
- Password hash/salt and session hash are nonempty BLOBs. Version is a positive
  integer; password parameters are a nonempty JSON object. These are internal
  rows, never response DTOs. T008 defines approved verifier parameter contents
  and hashing; T009 defines session digest/token handling. A SQL type constraint
  cannot prove arbitrary bytes are a secure hash or detect secrets in arbitrary
  metadata. No cryptographic validation is claimed by this migration.
- Timestamps are integer UTC epoch milliseconds from zero through JavaScript
  Date's maximum value. Session expiry is required and strictly after creation;
  optional revocation is at or after creation, including after expiry. These
  structural bounds do not choose a session TTL; that policy belongs to T009.
- Unique indexes serve username/token lookup; account indexes support revocation
  of unrevoked sessions and foreign-key checks on all sessions. RESTRICT prevents
  orphaning sessions when deleting/changing account IDs. No account/session
  retention policy or automated deletion is introduced.

## Committee and activity storage contract

- `0002_committee_activities.sql` follows the published T003 migration. It keeps
  `divisions` and `committee_members` independent of `accounts`; a committee
  member is attribution data, never an access grant.
- An `activities` row has one required product name and one constrained mode.
  Its integer-rupiah unit prices and optional cost amounts are non-negative;
  target quantity is positive. Calculation and lifecycle-edit policy remain
  later service work.
- Campus and regional configuration live in separate mode-matching tables. SQL
  prevents a mismatched or dual configuration and requires an active committee
  member as PIC. An already attributed PIC cannot be deactivated until the
  configuration changes. This is integrity, not the T017 authorization scope.
- Status and period indexes support activity setup/read models; division and
  partial active-member indexes support controlled attribution lookup.

## Order and independent-state storage contract

- `0003_orders_states.sql` follows the published T003/T004 migrations. An
  `orders.order_id` is the immutable application primary key and its source is
  only `manual` or `form_sync`. The order table intentionally has no Sheet
  connection, row, or source-identity column; T007 owns that ledger.
- An order carries buyer/attribution/mode data, assignment, payment method, and
  optional Drive-reference metadata. It has no proof BLOB column. Campus orders
  require a pickup point; regional orders require area, contact, and address;
  both require an active PIC at creation/reassignment. Historical assignment
  remains valid after a later PIC deactivation.
- `order_state_history`, `payment_history`, `fulfillment_history`, and
  `remittance_history` are independent append-only tables. Each has its own
  constrained state, actor, UTC epoch timestamp, and latest-history index.
  Payment/remittance rows retain non-negative integer-rupiah event amounts.
- Confirmed order/state/proof-reference data is never deleted automatically in
  P1. T006 owns approved refunds, voids, corrections, and their audit/approval
  model; it must add a sequential migration rather than rewriting T005 history.
- Query indexes support `orders(activity_id, order_id)`, assigned PIC lookup,
  and independent latest state/actor retrieval. No financial aggregate or state
  transition policy is encoded in this structural migration.

## Migration evidence boundary

Tests cover the fresh/empty T001 product baseline, all role values, invalid raw
SQL inserts/updates, foreign keys, uniqueness, strict numeric/flag types,
lifecycle bounds, column inventories, indexes/query plans, two no-op replays,
failed-DDL rollback and safe retry, failed upgrade preservation, and failed
multi-statement mutation rollback. T005 additionally covers cross-mode order
constraints, append-only histories, no Sheet identity/proof binary column, and
independent latest state/actor retrieval. Deliberately broken migrations exist
only inside disposable test cases and are never read as product migration files.
Remote D1 migration evidence remains a separate T037 gate.
