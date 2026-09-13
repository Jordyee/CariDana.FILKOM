# Code Review Report — T008

## Sources Read

- `docs/ai-native/03-prd.md`
- `docs/ai-native/04-architecture.md`
- `docs/ai-native/05-issues.md`
- `docs/ai-native/08-loop-log.md`
- GitHub Issue #13
- Complete T008 working diff and focused test/build evidence

## Verdict

**Pass.** The implementation is limited to Worker-native auth-domain primitives
and tests. It does not select a deployed PBKDF2 cost or implement any T009+
route, session, bootstrap, credential-delivery, authorization, UI, migration,
or external-system behavior.

## Matches the Issue?

- `src/auth/password.ts` derives only PBKDF2-HMAC-SHA-256 with `crypto.subtle`,
  a CSPRNG per-verifier salt, versioned parameter metadata, strict malformed
  metadata rejection, and byte-wise comparison.
- `verifyPassword` performs one derivation and one comparison for a supplied
  verifier, a nonexistent account, or malformed metadata; the test injects a
  counted deriver to prove this work shape.
- A valid prior version returns `needsUpgrade: true`; no rehash write or login
  route was added.
- `issueTemporaryCredential` generates opaque random in-memory material,
  creates only a verifier plus `oneTime` and `mustChangePassword` markers, and
  documents that the material must not cross a DTO/log/durable boundary.
- `redactCredentialLogValue` recursively redacts plaintext/credential/verifier/
  salt and standalone or suffixed hash fields. The review added direct root-hash
  coverage before accepting the change.

## Requirement Coverage

| Requirement / story | Evidence in code and tests | Status |
| --- | --- | --- |
| US-001, FR-001, FR-003 | `createPasswordVerifier`, PBKDF2 Web Crypto derivation, account-row adapter, valid/invalid test | Covered for T008 primitive scope |
| US-002, FR-007, FR-008 | Temporary-credential issuer supplies verifier and forced-change marker without a transport | Covered for T008 primitive scope |
| NFR-003 | Internal-only types, no routes, recursive log redaction tests, privacy scan | Covered for T008 primitive scope |
| NFR-004 | Single-derivation dummy-verifier path for nonexistent/malformed material | Covered for T008 primitive scope; generic HTTP response belongs to T010 |
| AC-001 | Focused authentication primitive evidence | Partial by design; account lifecycle, sessions, lockout, and authorization remain T009--T012 |

## Matches the PRD and Architecture?

Yes. The files use only Worker Web Crypto and preserve the architecture's
PBKDF2-HMAC-SHA-256 candidate. The policy is caller-provided and versioned, so
the future deployed CPU decision remains T012. D1 account fields are mapped
internally without exposing a raw-row or response DTO.

## Unrelated Changes

No unrelated runtime behavior or dependency changed. The remaining modifications
are required T008 prompt/loop/review/decision/audit artifacts and a schema
comment that corrects the T003 field contract.

## Must Fix

None.

## Should Fix

None within T008.

## Security / Privacy Notes

- The temporary credential exists only in the internal issuance return value for
  an external, owner-approved handoff. It must never be serialized; later
  provisioning/reset services must consume it only to persist the verifier and
  forced-change flag.
- The constant-shape claim covers one KDF plus one comparison. Different
  historic verifier costs can still have different CPU time, which is inherent
  to versioned upgrades and must be bounded by T012's approved policy.
- Final iteration/cost selection is deliberately absent; the review does not
  treat local test iterations as production security evidence.

## Missing Verification

Only later-task evidence remains: T009 sessions, T010 generic login responses
and one-time consumption/forced-change lifecycle, T011 authorization, and T012
deployed Worker CPU/lock proof. No migration or mobile check applies to T008.

## Student Explanation Check

The student should be able to explain why a salt and verifier are internal
persistence material, why a dummy verifier makes an absent account execute the
same KDF/comparison shape, why successful old-policy verification asks the
caller to upgrade, and why the returned temporary credential cannot be an HTTP
DTO or log field.

## Loop Decision

**Accept for the Task-ID commit, push, and complete PR/CI review.**
