# Session Handoff

## Handoff Status

- Updated: 2026-07-26
- Project: CariDana.FILKOM
- Requirements status: approved
- Constitution status: approved by the project owner on 2026-07-22
- Architecture status: approved by the project owner on 2026-07-26
- Stack status: compatibility proof passed and final stack accepted on 2026-07-26
- Current phase: implementation-issue planning authorized; coding not started
- Exact next skill: `architecture-to-issues`
- Coding status: not started intentionally

This file is the entry point for a fresh Codex task. Read it first, then read
the required upstream artifacts listed below. Do not reconstruct decisions from
chat history when the local artifacts already contain them.

## Required Reading

1. `docs/ai-native/14-project-constitution.md` - approved binding principles and quality gates.
2. `docs/ai-native/03-prd.md` - approved product requirements and acceptance criteria.
3. `docs/ai-native/15-clarification-log.md` - resolved ambiguities and downstream checks.
4. `docs/ai-native/02-intent-brief.md` - product intent and scope boundary.
5. `docs/ai-native/00-source-inventory.md` - spreadsheet sources and inspection status.
6. `docs/ai-native/00-process-setup.md` - corrected engineering sequence and guardrails.

The earlier grilling record is available at
`docs/ai-native/01-grill-my-idea.md` if a decision needs its original context.

## Agreed Product Direction

CariDana.FILKOM is a mobile-first internal web application for FILKOM Day
fund-raising operations. One activity sells one product and must select either
campus mode or regional distribution mode.

- Coordinator and Deputy have full operational and approval access.
- Each Member/PIC has an individual account and limited operational access.
- Officer and Treasurer are report-only roles.
- Coordinator and Deputy may generate and download reports.
- Officer and Treasurer may download a closed report.
- Member/PIC may not export reports.
- MVP authentication uses local, individually provisioned accounts. Google
  sign-in is deferred.
- After three failed logins, warn and delay. After five, lock the account for
  15 minutes or until an administrator unlocks it.
- Password reset uses an administrator-issued one-time temporary password that
  must be changed after login.

## Data And Workflow Decisions

- Google Forms remains the buyer-entry interface; responses are stored in a
  linked Google Sheet.
- MVP synchronization is manual and incremental, not realtime.
- Each imported order receives a stable `Order ID`; mapping must locate the
  column by header rather than assume a fixed letter.
- After import, the application is the authoritative operational record.
- A representative activity supports at most 150 orders; normal use is about
  50 to 100 orders.
- Four state axes remain independent: order, payment, fulfillment, and
  remittance. Do not collapse them into one status.
- Planned capital equals purchase cost per unit times target quantity, plus
  optional additional costs. Each additional cost requires an integer rupiah
  amount and a description.
- Payment proof remains in a private Google Drive location. Store only metadata
  and the manually entered link in the database.
- Confirmed financial records must not be silently deleted. Corrections require
  reason, actor, timestamp, before/after values, and approval where required.
- Weak-network draft support is desirable but P2; complete offline mode is out
  of MVP scope.

## Report Decisions

The MVP exports Excel. The workbook uses separate tables in this order:

1. Product, Price Details, and Target.
2. All Revenue.
3. Report for losses or operational problems.
4. Final Decision and totals.

Required transaction fields include payment method or problem, quantity,
rupiah amount, and notes. Use dark headers, currency formatting, automatic
Excel formulas, Drive evidence links in notes where authorized, and optional
signature rows for the committee chair and treasurer at the bottom.

## Platform Direction

- Deployment target: Cloudflare, prioritizing a simple free-tier-compatible
  setup.
- Working preference: one full-stack Worker plus D1, subject to architecture
  validation.
- The architecture phase owns framework selection and must prove compatibility
  with D1, local authentication, mobile UI, Google Sheet synchronization, and
  Excel generation before the stack is accepted.

## Source Evidence Already Checked

- Existing sales spreadsheet:
  `PRIVATE_SALES_TEMPLATE`
- Committee spreadsheet:
  `PRIVATE_COMMITTEE_SOURCE`
- Google Forms response spreadsheet:
  `PRIVATE_FORM_RESPONSES`
- Response tab: `Form Responses 1`
- Observed size during inspection: 145 rows by 15 columns, with a frozen header
  row and response headers through column K.
- Current column L is a candidate for `Order ID`, but production code must map
  by header.
- No buyer rows were copied into project documents, and no source spreadsheet
  was edited.

Use sanitized Nasi Jaha records as development fixtures. Do not expose or copy
real buyer names, phone numbers, addresses, map links, proof links, or financial
details into source control.

## Downstream Evidence Still Required

- Test the application-managed `Order ID` column on a duplicate response Sheet
  before any write is allowed on the real Sheet.
- Define or remove the ambiguous `Column 1` form field before production mapping.
- Verify private Google Drive permissions and role-specific evidence access.
- Obtain Treasurer approval of the generated workbook layout.
- Add authorization tests for all five roles.
- Re-run the accepted stack proof if a selected package, compatibility date, or
  Cloudflare runtime constraint changes materially.

These are validation tasks, not unresolved product requirements.

## Exact Next Action

1. Read all Required Reading above plus
   `docs/ai-native/16-stack-compatibility-spike.md`.
2. Load and follow `architecture-to-issues`.
3. Create or update only `docs/ai-native/05-issues.md` and the corresponding
   implementation issues.
4. Preserve every remaining validation/release gate and do not begin feature
   implementation.

After project-owner review of the implementation issues, continue one issue at
a time with `issue-to-prompt`, `run-the-loop`, `test-the-app`,
`review-the-code`, and `demo-ready`.

## Starter Prompt For A New Task

```text
Lanjutkan proyek CariDana.FILKOM sebagai task perencanaan issue terpisah.
Artifact lokal di branch main adalah sumber keputusan utama; jangan mengandalkan
chat lain. Baca docs/ai-native/00-session-handoff.md, semua Required Reading,
docs/ai-native/04-architecture.md, dan
docs/ai-native/16-stack-compatibility-spike.md secara penuh. Requirements,
constitution, architecture, dan final stack sudah disetujui project owner.
Gunakan skill architecture-to-issues untuk membuat atau memperbarui
docs/ai-native/05-issues.md serta issue implementasi yang kecil, berurutan,
terlacak ke requirement, dan memiliki acceptance criteria serta verification.
Pertahankan seluruh validation/release gate yang belum dibuktikan. Jangan
menulis fitur, menggunakan data nyata, atau melakukan deployment produksi.
Berhenti untuk review project owner setelah issue plan selesai.
```

## T002 current handoff — 2026-09-11 WITA

This update supersedes the earlier planning-only next-step text for task execution.

- Task: [Issue #7 / T002](https://github.com/Jordyee/CariDana.FILKOM/issues/7).
  Implementation `d2069e0`, reviewed baseline `b083174`,
  [PR #48](https://github.com/Jordyee/CariDana.FILKOM/pull/48).
  Final merge SHA and post-merge evidence belong to the final PR audit comment.
- Changed: test fixture catalog/independent oracles/privacy/network helpers;
  artifact scanner; test/build/CI/ignore/line-ending configuration; T002 prompt,
  loop/action records; owner-approved legacy ID aliases in four active documents.
- Evidence: clean install, type/binding checks, 21 Worker plus 4 Node tests,
  dry-run Worker/Vite build, high-severity dependency audit, 49-file clean scan,
  complete diff/acceptance review; GitHub Verify run 34563885734 passed.
- Dependency state: T001 merged; T002 is technically evidenced and awaiting its
  final reviewed merge. No T003 implementation has started in this task.
- Residual limits: four moderate advisories; opaque raster/ZIP/XLSX/PDF evidence
  fails closed until safe decoding is added; arbitrary prose/financial PII and
  Git history require the later T038 release gate. Finance oracles intentionally
  avoid unresolved prepayment/refund semantics. No real resource was accessed.
- Owner decision: active documents now use private source aliases; history is
  handled separately in T038. No secret mapping was added.
- Authorized next step ONLY after verified merge, clean main and final PR audit:
  fresh T003 / Issue #8 task/worktree, gpt-6-astra with high reasoning, branch
  codex/t003-identity-sessions from latest main; identity/session migrations only.
  Reload all required sources, create issue prompt and loop artifacts without
  another routine approval pause, and do not start T004. Bootstrap/credential
  delivery remains a human decision if the migration actually requires fixing
  that behavior; do not add bootstrap routes/accounts/default credentials.

## T003 current handoff — 2026-09-11 WITA

This supersedes the earlier T002 next-step text. Stop after the verified T003
merge; do not create or begin a T004 implementation task in this session.

- Task: [Issue #8 / T003](https://github.com/Jordyee/CariDana.FILKOM/issues/8).
  Implementation `1d5c75d`, base `c3b19c1`, branch
  `codex/t003-identity-sessions`, [PR #49](https://github.com/Jordyee/CariDana.FILKOM/pull/49).
  Final merge SHA/post-merge results will be recorded in the final PR audit.
- Changed: `migrations/0001_identity_sessions.sql` and migration contract README;
  `src/db/schema.ts`; `test/db/identity-migration.spec.ts`, test binding types and
  Vitest configuration; T003 prompt, loop/action records and this handoff.
- Evidence: 82 local D1 cases; 103 total Worker and four Node cases; clean install,
  check/verify, dry-run build (ASSETS only), high-severity audit, 54-file clean
  source/artifact/bundle scan and full staged diff/acceptance review passed.
  PR is our own, non-draft and mergeable with no initial comments/reviews;
  GitHub Verify is running and must pass on the final head before merge.
- Remediation: explicit NUL rejection fixed SQLite GLOB's partial-text matching;
  initial 80/82 became 82/82 without weakening tests.
- Dependency state: T001/T002 merged. T003 locally evidenced; final reviewed merge
  is pending at this record. T004 is next in implementation order after T003,
  but is not started here. Subsequent migrations begin at 0002.
- Storage: canonical lowercase ASCII username keys; five roles; explicit flags;
  BLOB verifiers/token hashes; versioned JSON parameters; integer UTC epoch-ms
  lifecycle bounds. The migration does not choose crypto costs/session TTL,
  perform login, grant API permissions, or seed accounts/credentials.
- Pending gates: first Coordinator bootstrap/one-time credential delivery before
  implementing those behaviors; algorithm validation in T008 and full session
  security in T009; remote D1 evidence in T037. Those are not completed by T003.
  Four existing moderate advisories remain; pins are unchanged. SQL cannot prove
  bytes are secure hashes or identify secrets hidden in arbitrary metadata.
  T002 scanner limitations and T038 history/release gates remain in force.
