# Product migrations

T001 removed the compatibility-spike schema. `0001_identity_sessions.sql` is
the first product migration; the backlog's `0002` filename was illustrative.
Add subsequent migrations sequentially. Do not edit a published/applied product
migration to change its meaning.

T003 has no production D1 binding or remote database identifier. `npm run verify`
runs the checked-in SQL through Cloudflare's `readD1Migrations` and
`applyD1Migrations` helpers against disposable local D1 databases in Vitest.
The focused command is `npx vitest run test/db/identity-migration.spec.ts`.
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

## Migration evidence boundary

Tests cover the fresh/empty T001 product baseline, all role values, invalid raw
SQL inserts/updates, foreign keys, uniqueness, strict numeric/flag types,
lifecycle bounds, column inventories, indexes/query plans, two no-op replays,
failed-DDL rollback and safe retry, failed upgrade preservation, and failed
multi-statement mutation rollback. Deliberately broken migrations exist only
inside disposable test cases and are never read as product migration files.
Remote D1 migration evidence remains a separate T037 gate.
