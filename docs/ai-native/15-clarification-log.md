# PRD Clarification Log

## Status

Originally resolved on 2026-07-21. Reopened for a focused pre-implementation
review on 2026-09-02 after the artifact audit identified semantic decisions
that would otherwise be guessed during implementation. The original decisions
remain approved; Q4-Q5 below are the only reopened product questions.

## Sources Read

- `docs/ai-native/03-prd.md` - draft PRD with product requirements, acceptance
  criteria, risks, and validation questions.
- Project-owner answers received on 2026-07-21.
- Read-only metadata and header inspection of spreadsheet
  `1HmC15FBgAm5H9hx1668aBtrgQl5Ol3t4aTk_zPBmY6g`, tab `Form Responses 1`.

## Ambiguity Scan Summary

| Area | Status | Notes |
| --- | --- | --- |
| User roles | Clear | Coordinator and Deputy generate/download; Officer and Treasurer download closed reports only; Member/PIC cannot export. |
| Data model | Clear | Additional costs, 150-order sizing, response Sheet identity, form headers, and Order ID strategy are defined; copy-based validation remains. |
| UX flows | Clear | Campus, regional, mobile operation, correction, closure, and export flows are concrete. |
| Edge cases | Clear | Duplicate, invalid proof, typo, partial sync, correction, lockout, and weak-network behavior are defined. |
| Security/privacy | Clear | Local accounts, server-side lockout, role boundaries, private Drive links, and audit history are defined. |
| Success criteria | Clear | Import, mobile, authorization, finance, audit, privacy, and Excel outcomes are measurable. |
| Deployment | Deferred correctly | Framework selection will be validated during architecture; the project owner does not need Cloudflare expertise. |

## Clarification Questions

| # | Question | Why It Matters | Recommended Default | Student Answer |
| --- | --- | --- | --- | --- |
| Q1 | Please provide the Google Forms response Sheet URL and exact response-tab name. Is it acceptable for the application to add and write only a rightmost `Order ID` column? | The existing sales template is not enough to verify actual form headers, required field mapping, and whether repeated form submissions preserve the added ID column. | Inspect the real Sheet read-only first; test the ID behavior on a copy; write only the `Order ID` column after explicit approval. | Resolved: supplied spreadsheet `1HmC15FBgAm5H9hx1668aBtrgQl5Ol3t4aTk_zPBmY6g`; verified tab `Form Responses 1`, 15-column grid, frozen header row, and form-response headers through current column K. Current L is the candidate ID position, but runtime mapping uses the `Order ID` header rather than a fixed letter. No source data was edited. |
| Q2 | Is the treasurer a separate report-only user role/account, and should the deputy retain the same generate/download permission as the coordinator? | This changes authentication roles, server authorization, interface actions, and acceptance tests. | Coordinator and deputy may generate/download; Officer and Treasurer may download the closed report only; Member/PIC may not export. Officer/Treasurer receive no buyer PII or raw proof links in operational views, but the closed workbook may include approved evidence links required for validation. | Resolved: recommended permission split accepted. Treasurer is report-only; Deputy retains coordinator-level report generation/download; Officer and Treasurer download closed reports only. |
| Q3 | If manual order creation is deferred, must every MVP order—including campus pickup—first come from Google Form/Sheet, with PICs only finding and updating synchronized orders? | US-005, US-007, SC-002, and T019 currently assume an operator can create a manual order. Deferring it changes the approved P1 campus flow and acceptance tests. | Keep manual entry in P1 with immutable IDs and idempotency; prefer Form intake without making it mandatory. Never auto-merge a later Form response with a manual order. | Resolved on 2026-09-02: PICs, Coordinator, and Deputy may create manual orders. Form intake is preferred but not mandatory. Manual creation must avoid duplicate submission and a later possible Form match requires explicit Coordinator/Deputy review rather than automatic merge. |
| Q4 | What assignment determines which orders a Member/PIC may see and update: explicit order assignment, all orders in an assigned activity, or all orders in an assigned region/PIC queue? | This changes database relationships, authorization queries, privacy tests, and day-to-day workload. | Use explicit order/PIC assignment; regional PICs additionally see orders in their assigned queue only. Coordinator/Deputy retain full access. | Pending. Owner requested a simpler explanation before deciding. |
| Q5 | After an activity is active or has trusted orders, which setup fields may Coordinator/Deputy still edit? | Changing price, product, mode, target, or costs can silently change historical totals and report meaning. | Draft: all setup fields editable. Active before first trusted order: Coordinator/Deputy may edit. After first trusted order: freeze product, mode, and prices; allow target/period/notes only through an audited change. Closed: read-only. | Partial: owner confirmed only Coordinator/Deputy may change setup rules and wants some flexibility, but the exact post-activation boundary remains pending. |

## Pre-Implementation Owner Responses — 2026-09-02

- The owner approves T001-T039 as the P1 learning/reference backlog. T040
  remains deferred because it was not included in that approval.
- The owner prefers Vite and delegates the final frontend tooling choice to the
  implementation agent. Any selected version still requires pinning, audit,
  build evidence, and compatibility verification in T001.
- Detailed financial edge rules will be developed gradually after a usable
  platform demo exists. This is an intentional human stop before schema or
  finance work that would otherwise hard-code those rules.
- Manual order creation remains in P1. Form intake is preferred but not
  mandatory, especially for direct campus buyers. Manual and synchronized
  orders use immutable IDs and explicit source types; duplicate submissions are
  idempotent, and a later possible Form/manual match is never auto-merged.
- Campus fundraising is the first usable implementation milestone. Regional
  fundraising remains P1 but is sequenced after the complete campus loop is
  working; it is not removed from the release scope.
- First-Coordinator bootstrap and data-retention policy are intentionally not
  decided yet. Agent rules must stop before the owning implementation issue
  requires either decision.
- The primary user-facing language is Bahasa Indonesia and the authoritative
  operational timezone is Waktu Indonesia Tengah (`Asia/Makassar`). Whether
  English is a P1 language toggle or a later enhancement remains unapproved.
- The owner has not yet decided how real Google Sheet identifiers should be
  handled in tracked documents. Until resolved, implementation code, fixtures,
  logs, tests, and screenshots must not add or repeat a real identifier.

## Decisions Added Back To PRD

- An activity may contain zero or more optional additional cost items.
- Every additional cost requires an integer rupiah amount and a description of
  its purpose.
- Planned capital equals unit purchase price multiplied by target quantity plus
  all additional costs.
- Planned gross profit equals planned gross revenue minus planned capital.
- Representative maximum activity size is 150 orders; normal use is expected to
  be approximately 50 to 100.
- The proposed Excel layout is accepted as the initial MVP report format.
- Framework selection is delegated to architecture validation. The project owner
  is not expected to evaluate framework compatibility.
- The supplied spreadsheet is confirmed as the Google Forms response Sheet. It
  contains one tab, `Form Responses 1`, with a frozen response header row.
- Current response fields cover timestamp, committee member, buyer identity and
  contact, map/location, region, quantity, payment method, proof, and notes.
- A header-driven `Order ID` column is the accepted design. The current candidate
  position is L, after the ambiguous K header `Column 1`; copy-based testing is
  mandatory before any source write.
- Coordinator and Deputy may generate/download Excel reports. Officer and
  Treasurer are report-only and may download closed reports. Member/PIC cannot
  export.
- Manual order entry remains in P1 for direct buyers. It uses an immutable
  internal Order ID, explicit manual source type, and idempotent submission; it
  never fabricates a Sheet row.
- A possible later Form/manual match is reviewed explicitly by
  Coordinator/Deputy and is never merged automatically.
- Campus fundraising is the first usable implementation milestone. Regional
  fundraising remains required for the complete P1 release and follows the
  proven campus loop.
- Bahasa Indonesia is the primary MVP language and operational time is WITA
  (`Asia/Makassar`). English translation remains a later enhancement unless
  separately promoted into P1.

## How To Validate The Google Forms Sheet

1. Open the Google Form used by buyers.
2. Open the `Responses` section and select the linked Google Sheets icon.
3. Open the response spreadsheet and copy its URL.
4. Note the exact tab name that receives new form responses.
5. Send the URL and tab name without adding or moving columns yet.
6. The project will inspect headers read-only, then test an `Order ID` column on
   a copy before requesting any write to the real response Sheet.

## Framework Validation Ownership

The project owner does not need to perform question 6 manually. During
architecture, the engineering process will compare a minimal full-stack Worker
setup against the requirements for D1, local authentication, mobile UI, Google
Sheet synchronization, and Excel generation. A small proof of compatibility
will be required before the stack is accepted.

## Remaining Open Questions

- Q4: choose the Member/PIC assignment boundary.
- Q5: choose the post-activation activity-edit boundary.
- Decide before T003/T008-T013 how the first Coordinator is bootstrapped and
  how one-time credentials are delivered.
- Decide before T005-T007 the minimum data-retention policy and the exact
  financial/refund/remittance semantics that affect persistence.
- Decide during T001 whether English is part of P1 or a later enhancement.
- Decide before T002 whether tracked planning documents may retain real Sheet
  identifiers or must replace them with private aliases.

Downstream evidence still required:

- Duplicate the response tab into a separate test spreadsheet and verify that
  new form responses coexist safely with an application-managed `Order ID`
  column before enabling source writes.
- Define or remove the ambiguous `Column 1` form field before production mapping.
- Verify role authorization tests for Coordinator, Deputy, Member/PIC, Officer,
  and Treasurer.
