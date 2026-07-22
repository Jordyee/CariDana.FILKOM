# PRD Clarification Log

## Status

Resolved on 2026-07-21. No product clarification remains blocking; listed
downstream checks are implementation evidence, not unanswered product decisions.

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

None at the product-decision level.

Downstream evidence still required:

- Duplicate the response tab into a separate test spreadsheet and verify that
  new form responses coexist safely with an application-managed `Order ID`
  column before enabling source writes.
- Define or remove the ambiguous `Column 1` form field before production mapping.
- Verify role authorization tests for Coordinator, Deputy, Member/PIC, Officer,
  and Treasurer.
