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
  `1lTf9rrYjOIfH3Cy4nU4_TwXFVOnJjpL-pAd8l08g_6M`
- Committee spreadsheet:
  `1tZnjivHVhn-dnKbn7cWSeS4V0vLTGzdgKHS5Y48J2ws`
- Google Forms response spreadsheet:
  `1HmC15FBgAm5H9hx1668aBtrgQl5Ol3t4aTk_zPBmY6g`
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
