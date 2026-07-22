# Product Requirements Document

## Status

Clarified draft for final project-owner review.

## Product

CariDana.FILKOM

## Overview

CariDana.FILKOM is a mobile-first internal web application for managing FILKOM
Day fund-raising activities. Each activity sells one product through either a
campus pickup workflow or a regional distribution workflow.

The product replaces manual re-entry and fragile spreadsheet formulas with a
controlled operational record. It imports buyer responses from a Google Forms
response Sheet, tracks orders through independent operational and financial
states, restricts sensitive data by role, supports reconciliation and audit,
and exports a closed activity as an Excel workbook.

The MVP must prove one complete activity loop before adding realtime sync,
advanced analytics, broad accounting, or multi-product support.

## Target Users

### Coordinator

- Owns activity setup, user administration, oversight, financial approval,
  audit, closure, and reporting.
- Can view all operational and buyer data.

### Deputy Coordinator

- Has the same operational and approval permissions as the coordinator, except
  account administration may remain coordinator-only if configured that way.
- Can view all operational and buyer data.

### Fund-Raising Member / PIC

- Has an individual local account.
- Can work only on assigned or permitted operational records.
- Can update order, payment, fulfillment, remittance, and issue information but
  cannot approve financial corrections or close an activity.

### Officer

- Has report-only access.
- Cannot mutate application data or view buyer contacts, addresses, or raw
  operational proof links. A closed Excel report may contain approved evidence
  links required for report validation.

### Treasurer

- Has a local report-only account.
- Can view and download closed aggregate reports without buyer contacts or
  addresses. A closed Excel report may contain approved evidence links required
  for financial validation.
- Cannot generate, alter, approve, audit, close, or reopen activity data.

### Other Committee Members

- Do not need an application account in the MVP.
- Exist in a controlled committee master list so sales relationships can be
  attributed to a member and division.

## Role Permission Matrix

| Capability | Coordinator | Deputy | Member/PIC | Officer | Treasurer |
| --- | --- | --- | --- | --- | --- |
| Manage local user accounts | Yes | Optional | No | No | No |
| Create/edit activity setup | Yes | Yes | No | No | No |
| Sync Google Forms responses | Yes | Yes | No | No | No |
| Add/edit operational order data | Yes | Yes | Assigned scope | No | No |
| View all buyer personal data | Yes | Yes | Assigned scope only | No | No |
| Add payment-proof Drive link | Yes | Yes | Assigned scope | No | No |
| Approve cancellation/refund/correction | Yes | Yes | No | No | No |
| Perform final audit and closure | Yes | Yes | No | No | No |
| View aggregate reports | Yes | Yes | Assigned activity | Yes | Closed only |
| Generate Excel report | Yes | Yes | No | No | No |
| Download closed Excel report | Yes | Yes | No | Yes | Yes |

## Problem

The current process captures buyer responses in Google Forms and Sheets, then
manually rewrites them into operational spreadsheets. In real Nasi Jaha sales,
this produced duplicate records, formula errors, unclear completion status, and
difficult financial tracking. The spreadsheet layout also forces coordinators
to use a laptop during workflows that happen primarily on mobile devices.

The team needs one trustworthy record that makes order state, fulfillment,
payment, PIC remittance, issues, and reconciliation independently visible. It
must preserve who changed financial data and prevent silent deletion or
duplicate import.

## Goals

- Centralize new fund-raising activity data in one operational application.
- Make core work practical on mobile for coordinators, deputies, and PICs.
- Eliminate duplicate orders caused by repeated Google Sheet imports.
- Keep order, payment, fulfillment, and PIC remittance states independently
  traceable.
- Separate recognized revenue, collected money, outstanding money, remitted
  money, capital, and approved losses.
- Enforce role-based access and individual accountability.
- Preserve correction history for confirmed operational and financial data.
- Support campus and regional workflows without irrelevant required fields.
- Close an activity only after unresolved operational and financial work is
  reviewed.
- Generate a readable, formula-backed Excel report.

## Non-Goals / Out of Scope

- Buyer-facing order entry inside CariDana.FILKOM.
- Scheduled, push-based, or realtime Google Forms synchronization.
- Google Sign-In or another third-party identity provider.
- Automatic payment verification against a bank or e-wallet.
- Payment-proof file storage inside the application database.
- Full offline browsing or offline editing of existing records.
- Multi-product activities, product catalogs, or multi-organization tenancy.
- Full accounting, payroll, procurement, advanced inventory, or route planning.
- Automatic detection that two Drive links contain the same screenshot.
- Production migration of unclean Nasi Jaha history.
- Individual-member sales quotas until their real workflow is validated.
- Advanced analytics beyond essential progress and financial summaries.
- Reopening a closed activity in the MVP.

## Priority Definitions

- **P1**: Required to validate one complete and trustworthy activity loop.
- **P2**: Valuable after the P1 loop is reliable; not required for MVP release.

## User Stories

### US-001 - Secure Local Access (Priority: P1)

**User need:** As an authorized user, I want to sign in with an individual local
account so that my permissions and actions can be attributed correctly.

**Why this priority:** Financial and personal data cannot be safely shared
without authenticated, role-specific access.

**Independent Test:** Create one account for each role, including Treasurer,
sign in, and verify that each role can access only its allowed routes and
actions.

**Acceptance Scenarios:**

1. Given valid active credentials, when the user signs in, then the application
   creates a secure session and opens the permitted dashboard.
2. Given three consecutive failures, when another login is attempted, then the
   server returns a generic warning and applies a short delay.
3. Given five consecutive failures, when another login is attempted, then the
   account remains locked across browser restarts for 15 minutes or until an
   administrator unlocks it.
4. Given a one-time reset password, when the user signs in, then the application
   requires a new password before allowing normal use.

### US-002 - Manage Users And Committee Attribution (Priority: P1)

**User need:** As a coordinator, I want to provision local accounts and maintain
the committee master list so that access and sales attribution use controlled
identities.

**Why this priority:** Free-text names and shared accounts undermine attribution
and audit evidence.

**Independent Test:** Add, deactivate, reset, and unlock a test account; then
attribute an order to a committee member without giving that member an account.

**Acceptance Scenarios:**

1. Given coordinator access, when a local account is created with a role, then
   the user receives only that role's permissions.
2. Given a deactivated account, when its credentials are submitted, then login
   is denied without exposing whether the username exists.
3. Given a committee member without an account, when an operator attributes a
   sale, then the member and division can still be selected from master data.

### US-003 - Create A One-Product Activity (Priority: P1)

**User need:** As a coordinator or deputy, I want to create a fund-raising
activity for one product and one mode so that targets and operational fields are
defined before orders are managed.

**Why this priority:** Orders and totals require a stable activity boundary.

**Independent Test:** Create one campus activity and one regional activity, then
verify mode-specific required fields and calculated planning totals.

**Acceptance Scenarios:**

1. Given valid product, price, capital, target, period, and campus fields, when
   the activity is saved, then it is created in draft state.
2. Given regional mode without area/PIC configuration, when save is attempted,
   then validation identifies the missing required information.
3. Given a saved activity, when a second product is added, then the system
   rejects it and directs the user to create another activity.
4. Given optional additional costs, when each item has an amount and description,
   then those items are included in planned capital and remain itemized.

### US-004 - Import Google Forms Orders Without Duplicates (Priority: P1)

**User need:** As a coordinator or deputy, I want to manually synchronize a
Google Forms response Sheet so that buyer responses enter the application
without manual retyping or duplicate orders.

**Why this priority:** Duplicate and hard-to-track data is the strongest
evidence-backed pain in the current process.

**Independent Test:** Sync a fixture Sheet twice and confirm the second run
creates zero additional orders and reports skipped rows clearly.

**Acceptance Scenarios:**

1. Given a valid source row with an empty `Order ID`, when sync succeeds, then
   the application creates one order and writes its immutable ID to that source
   cell without changing other response values.
2. Given a source row with an already imported `Order ID`, when sync runs again,
   then the row is skipped and no duplicate order is created.
3. Given a malformed or incomplete row, when sync runs, then the row is not
   silently imported and the operator receives a row-level reason.
4. Given a partially failed sync, when the operator retries, then successfully
   imported rows remain idempotent and failed rows can be retried safely.

### US-005 - Manage An Order On Mobile (Priority: P1)

**User need:** As an authorized operator, I want to view and update an order on
my phone so that progress can be recorded during sales and distribution.

**Why this priority:** The spreadsheet currently forces laptop use during mobile
work.

**Independent Test:** Complete create, search, view, and permitted status-update
tasks at a 360 x 800 viewport without horizontal page scrolling.

**Acceptance Scenarios:**

1. Given an authorized user, when an order is opened, then its buyer,
   attribution, quantity, financial, fulfillment, PIC, issue, and history data
   appear according to role permissions.
2. Given a member assigned to the order, when an operational state is updated,
   then the change is saved with actor and time.
3. Given a member not assigned to the order, when restricted buyer data is
   requested directly, then the server denies access.

### US-006 - Run Regional Distribution (Priority: P1)

**User need:** As a coordinator or PIC, I want orders grouped by region and PIC
so that delivery, payment, and remittance can be tracked through each handoff.

**Why this priority:** This reflects the proven Manado, Bitung, Minahasa Utara,
and Tomohon workflow.

**Independent Test:** Assign fixture orders to two PICs and regions, complete
delivery and remittance states, and verify each user sees the correct scope.

**Acceptance Scenarios:**

1. Given a regional order, when it is confirmed, then area, address, contact,
   and assigned PIC are required.
2. Given an assigned PIC, when goods are handed over, delivered, paid, and
   remitted, then each independent state can be updated without overwriting the
   others.
3. Given coordinator access, when regional progress is viewed, then unresolved
   orders and remittances can be filtered by area and PIC.

### US-007 - Run Campus Pickup Sales (Priority: P1)

**User need:** As a campus PIC, I want to record pickup sales and relationship
attribution quickly so that buyers can be served from one location until stock
is exhausted.

**Why this priority:** Campus sales use a different proven workflow and should
not require regional delivery data.

**Independent Test:** Process attributed and unattributed buyers at one pickup
point and verify inventory/target progress and financial states.

**Acceptance Scenarios:**

1. Given a campus activity, when an order is recorded, then pickup point and PIC
   are available while regional address fields are not required.
2. Given a known relationship, when the order is recorded, then the committee
   member and division are attributed.
3. Given no known relationship, when the operator assigns a division, then the
   order is included in that division's contribution count with a note that the
   relationship was assigned at pickup.

### US-008 - Track Money And Reconcile An Activity (Priority: P1)

**User need:** As a coordinator or deputy, I want financial totals separated by
meaning so that expected sales, collected money, outstanding money, remittance,
capital, and loss can be audited.

**Why this priority:** A single ambiguous total caused formula and audit
problems in the spreadsheet.

**Independent Test:** Load mixed paid, partially paid, delivered, undelivered,
remitted, and issue records and verify every displayed total against a manual
calculation.

**Acceptance Scenarios:**

1. Given delivered goods, when fulfillment becomes received, then recognized
   revenue increases by delivered quantity multiplied by selling price.
2. Given a partial payment, when its amount is recorded, then collected and
   outstanding totals update independently without marking payment as fully
   paid.
3. Given PIC money that is paid but not remitted, when the audit view opens,
   then collected and remitted totals remain visibly different.
4. Given an approved loss or issue, when reconciliation is calculated, then it
   is listed explicitly rather than hidden by changing an order total.

### US-009 - Correct Human Error With Audit History (Priority: P1)

**User need:** As a coordinator or deputy, I want to correct duplicates, typos,
invalid proof, and financial mistakes without erasing history so that audits
remain defensible.

**Why this priority:** Human error is expected, but silent edits would recreate
the trust problem the application is intended to solve.

**Independent Test:** Correct a buyer typo, void a duplicate, replace an invalid
proof link, and approve a refund; verify before/after values, actor, time, and
reason remain visible.

**Acceptance Scenarios:**

1. Given a disposable draft, when an authorized user deletes it, then it is
   removed according to draft rules.
2. Given a confirmed record, when a correction is approved, then the previous
   value and correction reason remain in immutable audit history.
3. Given repeated or invalid payment proof, when it is flagged, then the order
   remains reviewable and is not automatically deleted.
4. Given a member-submitted issue, when approval is required, then only the
   coordinator or deputy can finalize the financial effect.

### US-010 - Monitor Essential Progress (Priority: P1)

**User need:** As an authorized user, I want a concise dashboard of active and
completed activities so that unresolved operational and financial work is
visible immediately.

**Why this priority:** The coordinator needs current oversight without manually
searching multiple tabs.

**Independent Test:** Seed activities in draft, active, and closed states and
verify role-appropriate counts, totals, progress, and unresolved-item links.

**Acceptance Scenarios:**

1. Given an active activity, when its dashboard is opened, then quantity target,
   confirmed quantity, fulfilled quantity, recognized revenue, collected,
   outstanding, remitted, and unresolved counts are visible.
2. Given an officer or treasurer, when the dashboard is opened, then permitted
   aggregate reports are visible without buyer personal data or raw operational
   proof links.
3. Given unsynced local drafts, when shared totals are calculated, then those
   drafts are excluded.

### US-011 - Close And Export An Activity (Priority: P1)

**User need:** As a coordinator or deputy, I want to validate closure and export
an Excel report so that the result can be reviewed by officers and the
treasurer.

**Why this priority:** Reporting is the final accountability outcome of each
fund-raising activity.

**Independent Test:** Close a reconciled fixture activity and inspect the
generated workbook's tables, formulas, formats, links, and signature rows.

**Acceptance Scenarios:**

1. Given unresolved orders, remittances, discrepancies, or unreviewed issues,
   when closure is attempted, then closure is blocked and every blocker is
   listed.
2. Given all discrepancies resolved or approved as explicit issues/losses, when
   the coordinator closes the activity, then operational data becomes read-only.
3. Given a closed activity, when Excel export is requested, then a valid `.xlsx`
   workbook is generated with the required ordered table groups, columns,
   formulas, currency formats, Drive evidence links, and optional signature
   rows.
4. Given an officer or treasurer, when a closed report is available, then the
   user may download that report but cannot regenerate or mutate it.

### US-012 - Preserve A New Entry On Weak Internet (Priority: P2)

**User need:** As a mobile operator, I want an unsent new entry preserved during
a weak connection so that I can retry without retyping it.

**Why this priority:** It improves field reliability but is not allowed to
compromise trusted shared totals.

**Independent Test:** Interrupt connectivity during a new manual entry, reload
the active session, retry after reconnection, and verify exactly one server
record is created.

**Acceptance Scenarios:**

1. Given a failed submission, when the browser remains in the authenticated
   session, then the entry is visibly marked local and unsynced.
2. Given restored connectivity, when retry succeeds, then one server record is
   created and the local draft is removed.
3. Given an unsynced draft, when any shared dashboard or report is opened, then
   the draft is excluded from trusted totals.

## Core User Flows

### Flow 1 - Account Provisioning And Recovery

1. Coordinator creates a local user with role and temporary password.
2. User signs in and must choose a new password.
3. Server enforces role permissions on every request.
4. After repeated failures, warning, delay, and server-side lock rules apply.
5. For forgotten passwords, the user contacts the coordinator.
6. Coordinator issues a one-time password or unlocks the account.

### Flow 2 - Create And Activate An Activity

1. Coordinator or deputy creates a draft activity.
2. User enters one product, unit purchase price, selling price, target quantity,
   period, operating mode, and any optional additional cost items.
3. User configures campus pickup or regional area/PIC information.
4. System shows derived planning totals for review.
5. Coordinator or deputy activates the activity.

### Flow 3 - Synchronize Google Forms Responses

1. Coordinator or deputy selects the activity and configured response Sheet.
2. System validates expected columns and shows a sync preview.
3. System imports valid rows without Order IDs.
4. System creates each order and writes its immutable ID only to the source ID
   cell.
5. Existing IDs are skipped; invalid rows are reported with reasons.
6. Operator receives imported, skipped, and failed counts.

### Flow 4 - Regional Distribution

1. Coordinator confirms orders and assigns area and PIC.
2. Goods are collected from the vendor and handed to PICs.
3. PICs update fulfillment and payment for assigned orders.
4. PICs remit cash or transfer proceeds.
5. Coordinator monitors unresolved deliveries, payments, and remittances.

### Flow 5 - Campus Pickup

1. Coordinator activates a campus activity and assigns pickup point/PIC.
2. PIC locates or creates the buyer order.
3. PIC records committee member/division relationship or assigns a division for
   an unattributed buyer.
4. PIC records pickup and payment until available quantity is exhausted.
5. Coordinator monitors totals and performs reconciliation.

### Flow 6 - Audit, Close, And Export

1. Coordinator or deputy reviews unresolved orders, issues, payment proof,
   remittances, and discrepancies.
2. Members may submit operational corrections or issue notes.
3. Coordinator or deputy approves financial effects and preserves audit history.
4. System validates closure blockers.
5. Coordinator or deputy closes the reconciled activity.
6. System generates the required Excel workbook for officers and treasurer.
7. Officer and treasurer users may download the closed workbook, including its
   approved evidence links, without gaining access to operational buyer data.

## Functional Requirements

### Authentication And Authorization

- **FR-001**: The system MUST authenticate each coordinator, deputy, member,
  officer, and treasurer through an authorized local account.
- **FR-002**: The system MUST enforce coordinator, deputy, member/PIC, officer,
  and treasurer permissions on the server, not only by hiding interface controls.
- **FR-003**: The system MUST store password verifiers using an approved salted
  password-hashing method and MUST NOT store or log plain-text passwords.
- **FR-004**: The system MUST persist consecutive login failure counts and lock
  state on the server.
- **FR-005**: The system MUST warn and delay after the third consecutive failed
  attempt and lock the account after the fifth.
- **FR-006**: A locked account MUST automatically unlock after 15 minutes or be
  unlockable by an administrator.
- **FR-007**: An administrator MUST be able to issue a random one-time password,
  and the system MUST force replacement after successful use.
- **FR-008**: A successful login or administrator reset MUST clear the applicable
  failed-login state according to the security policy.

### Users, Committee, And Activities

- **FR-009**: An administrator MUST be able to create, deactivate, unlock, and
  reset authorized local accounts.
- **FR-010**: The system MUST maintain a controlled committee member and division
  master list separately from login accounts.
- **FR-011**: Only a coordinator or deputy MAY create, edit, or activate an
  activity.
- **FR-012**: Each activity MUST contain exactly one product and one operating
  mode: campus or regional.
- **FR-013**: Activity setup MUST include product name, unit purchase price,
  unit selling price, target quantity, period, status, and zero or more optional
  additional cost items. Each additional cost MUST include an integer rupiah
  amount and a required description of its purpose.
- **FR-014**: Regional mode MUST require configured area/PIC information and
  enforce buyer address/contact data at the order level.
- **FR-015**: Campus mode MUST require a pickup point and PIC without requiring
  regional delivery fields.
- **FR-016**: The system MUST calculate planned gross revenue as selling price
  multiplied by target quantity; planned capital as unit purchase price
  multiplied by target quantity plus all additional costs; and planned gross
  profit as planned gross revenue minus planned capital.

### Google Forms And Order Intake

- **FR-017**: Only a coordinator or deputy MAY initiate Google Sheet
  synchronization.
- **FR-018**: Synchronization MUST show a preview and validate required source
  columns before writing application or Sheet data. The initial mapping MUST
  target spreadsheet `1HmC15FBgAm5H9hx1668aBtrgQl5Ol3t4aTk_zPBmY6g`, tab
  `Form Responses 1`, and map the verified headers for timestamp, committee
  member, buyer name, buyer phone, map/location link, region, quantity, payment
  method, payment proof, and notes. The ambiguous `Column 1` header MUST be
  ignored until its purpose is explicitly defined.
- **FR-019**: Every application order MUST have one immutable internal Order ID.
- **FR-020**: For a valid source row with an empty `Order ID` cell, successful
  synchronization MUST create one order and write the same immutable ID back to
  that cell without changing other source values. The system MUST locate the
  column by header name rather than permanently hard-code column letter L.
- **FR-021**: A source row with an existing imported Order ID MUST NOT create a
  second order.
- **FR-022**: Synchronization MUST be safely repeatable after full or partial
  failure and report imported, skipped, and failed rows.
- **FR-023**: Once a source order is imported, operational corrections MUST be
  performed in CariDana.FILKOM; later Sheet edits MUST NOT silently overwrite
  trusted application data.

### Orders And Operations

- **FR-024**: An order MUST store quantity, buyer identity, relationship
  attribution, mode-specific location, assigned PIC, payment method, proof link,
  notes, and independent operational states where applicable.
- **FR-025**: Order state MUST be one of pending confirmation, confirmed, or
  cancelled.
- **FR-026**: Payment state MUST be one of unpaid, partially paid, or paid and
  MUST retain the amount actually collected.
- **FR-027**: Fulfillment state MUST be one of not processed, assigned/carried by
  PIC, received by buyer, or problematic.
- **FR-028**: PIC remittance state MUST be one of not remitted, remitted, or
  audited and MUST retain the amount remitted where applicable.
- **FR-029**: Updating one state MUST NOT implicitly overwrite another state.
- **FR-030**: Members/PICs MAY update permitted operational fields only within
  their assigned scope.
- **FR-031**: Members/PICs MUST NOT approve cancellations, refunds, financial
  corrections, final audit, or closure.
- **FR-032**: Payment proof MUST be a manually entered private Google Drive
  reference; binary proof content MUST NOT be stored in the application database.
- **FR-033**: Users MUST be able to search and filter orders by activity, Order
  ID, buyer, committee attribution, division, state, PIC, and region as permitted
  by their role.

### Finance, Corrections, And Audit

- **FR-034**: Recognized revenue MUST include only quantity marked received by
  buyers multiplied by the activity selling price.
- **FR-035**: Collected money MUST be calculated from recorded payment amounts,
  independently of recognized revenue.
- **FR-036**: Outstanding money MUST be calculated and displayed separately from
  collected money.
- **FR-037**: Remitted money MUST be calculated from PIC remittance records and
  displayed separately from collected money.
- **FR-038**: The system MUST list approved losses/issues separately from normal
  income and MUST NOT conceal them by changing original order values.
- **FR-039**: Members/PICs MAY flag a duplicate, repeated proof, invalid proof,
  typo, damage, non-pickup, or other issue and provide a reason.
- **FR-040**: Only a coordinator or deputy MAY approve a void, refund, financial
  correction, or final loss classification.
- **FR-041**: Corrections to confirmed records MUST preserve record ID, previous
  value, new value, actor, timestamp, reason, and approval where applicable.
- **FR-042**: Only disposable draft records MAY be hard-deleted; confirmed
  records MUST be voided or corrected with audit history.

### Dashboard, Closure, And Export

- **FR-043**: The dashboard MUST distinguish draft, active, and closed activities.
- **FR-044**: An active activity summary MUST show target quantity, confirmed
  quantity, received quantity, recognized revenue, collected, outstanding,
  remitted, and unresolved counts.
- **FR-045**: Dashboard and report calculations MUST exclude cancelled orders,
  voided values, and unsynced local drafts according to their defined rules.
- **FR-046**: Officers and treasurers MUST see permitted aggregate application
  views without buyer contact, address, or raw operational proof references.
  Approved evidence links MAY appear only in the generated closed Excel report.
- **FR-047**: Only a coordinator or deputy MAY close an activity.
- **FR-048**: Closure MUST be blocked while orders, remittances, discrepancies,
  or issues remain unresolved or unapproved.
- **FR-049**: Closed activity operational data MUST become read-only in the MVP.
- **FR-050**: Only a coordinator or deputy MAY generate a valid Excel workbook
  containing Product & Price Details plus Target, All Revenue, Issue/Loss
  Report, and Final Decision tables in that order. Officer and treasurer users
  MAY download only the generated report of a closed activity.
- **FR-051**: Main report transaction rows MUST include Payment Method/Issue,
  QTY, Amount (Rp), and Notes, with Drive evidence links in Notes where relevant.
- **FR-052**: Excel output MUST use dark headers, rupiah currency formatting,
  automatic total formulas, and optional chair/treasurer signature rows.

### Weak-Network Drafts

- **FR-053**: On failed submission of a new manual entry, the client SHOULD offer
  to preserve it as a visibly unsynced local draft.
- **FR-054**: Retrying the same local draft MUST create at most one server record.
- **FR-055**: Unsynced drafts MUST NOT appear in shared dashboards, reports,
  audits, or financial totals.
- **FR-056**: A successfully synchronized or explicitly discarded local draft
  MUST be removed from local storage.

## Success Criteria

- **SC-001**: Synchronizing the same representative response Sheet three times
  creates zero duplicate orders after the first successful import.
- **SC-002**: Every imported or manually created order has exactly one unique,
  immutable internal Order ID.
- **SC-003**: For all tested orders, current order, payment, fulfillment, and
  remittance states and their latest actors are retrievable.
- **SC-004**: Coordinator, deputy, and member testers complete their P1 core
  tasks at 360 x 800 and 390 x 844 viewports without horizontal page scrolling
  or requiring a desktop table workflow.
- **SC-005**: Automated authorization tests deny 100% of the defined forbidden
  role-action combinations in the role matrix.
- **SC-006**: Financial totals for the sanitized Nasi Jaha fixture match an
  independently calculated expected result for recognized, collected,
  outstanding, remitted, capital, and approved-loss values.
- **SC-007**: No unsynced local draft affects a server-side count, dashboard,
  audit, or report total.
- **SC-008**: All confirmed-record corrections in test data preserve actor,
  timestamp, reason, previous value, and new value.
- **SC-009**: The generated workbook opens successfully in Microsoft Excel and
  contains all required tables, columns, formulas, formats, links, and optional
  signature rows.
- **SC-010**: No sanitized fixture, demo screen, log, or exported test artifact
  contains real buyer names, phone numbers, addresses, map links, or proof links.

## Non-Functional Requirements

### Security

- **NFR-001**: Authorization MUST be enforced server-side for every protected
  read and mutation.
- **NFR-002**: Session credentials MUST use secure, HttpOnly, SameSite cookies or
  an equivalently reviewed mechanism and MUST be invalidated on logout,
  deactivation, and password reset.
- **NFR-003**: Passwords, temporary passwords, session secrets, and Google API
  credentials MUST NOT appear in source control, client bundles, analytics, or
  logs.
- **NFR-004**: Login responses MUST avoid revealing whether a username exists.
- **NFR-005**: Financial approval and account-administration actions MUST produce
  audit events.

### Privacy

- **NFR-006**: Members may receive buyer personal data only for assigned work;
  officers and treasurers receive no buyer contact, address, or raw operational
  proof references. Approved evidence links in a closed Excel report are the
  only MVP exception.
- **NFR-007**: Payment proof remains in a private Google Drive folder; access
  control is verified operationally because the MVP has no Drive ACL integration.
- **NFR-008**: Sanitized fixtures MUST preserve workflow shape without retaining
  real personal or proof data.
- **NFR-009**: Local unsynced drafts MUST be removed after successful sync,
  explicit discard, logout, or session invalidation.

### Reliability And Data Integrity

- **NFR-010**: Import, local-draft retry, and financial mutation endpoints MUST
  be idempotent where repeated submission could duplicate data.
- **NFR-011**: Money MUST be stored and calculated using integer rupiah values,
  not binary floating-point amounts.
- **NFR-012**: Database constraints MUST prevent duplicate Order IDs and invalid
  state values.
- **NFR-013**: A failed multi-record sync MUST report partial results and MUST
  remain safe to retry.
- **NFR-014**: Trusted application records MUST never be silently overwritten by
  later source Sheet changes.

### Mobile Usability And Accessibility

- **NFR-015**: All P1 operational flows MUST work from 360 CSS pixels wide
  without page-level horizontal scrolling.
- **NFR-016**: Interactive targets MUST be touch-appropriate, keyboard
  accessible, visibly focused, and have programmatic names.
- **NFR-017**: Status MUST not rely on color alone; text or icon labels are
  required.
- **NFR-018**: Forms MUST provide field-level validation messages and preserve
  valid user input after a failed submission.
- **NFR-019**: The MVP SHOULD meet WCAG 2.2 AA for core P1 workflows.

### Performance And Compatibility

- **NFR-020**: Under normal network conditions and the representative test
  dataset of up to 150 orders in one activity, 95% of core authenticated API
  interactions SHOULD return within two seconds, excluding Google
  synchronization and Excel generation.
- **NFR-021**: Long-running synchronization and export actions MUST show progress
  or a pending state and MUST prevent accidental duplicate submission.
- **NFR-022**: The application MUST support current stable mobile and desktop
  Chromium browsers; broader browser support is validated if required later.

### Maintainability And Deployment

- **NFR-023**: The preferred deployment is one full-stack Cloudflare Worker with
  static assets and API routes, backed by D1, subject to architecture validation.
- **NFR-024**: The MVP MUST operate within Cloudflare free-tier limits under a
  representative activity of 150 orders or document the first expected limit.
- **NFR-025**: Business calculations for revenue, payment, remittance, loss, and
  export MUST be testable independently from interface rendering.
- **NFR-026**: Schema changes MUST use versioned migrations and be reproducible
  in local and deployed environments.

## Release Acceptance Criteria

- **AC-001**: `US-001`, `US-002`, and `FR-001` through `FR-010` pass automated
  authentication/authorization tests and manual account recovery checks.
- **AC-002**: `US-003` and `FR-011` through `FR-016` pass campus and regional
  activity creation tests.
- **AC-003**: `US-004`, `FR-017` through `FR-023`, `SC-001`, and `SC-002` pass
  against a controlled Google Sheet fixture or faithful integration test double.
- **AC-004**: `US-005` through `US-007` and `FR-024` through `FR-033` pass mobile
  workflow, role-scope, and state-independence tests.
- **AC-005**: `US-008`, `US-009`, `FR-034` through `FR-042`, `SC-006`, and
  `SC-008` pass with independently calculated fixtures and audit evidence.
- **AC-006**: `US-010`, `FR-043` through `FR-046`, and `SC-005` pass dashboard
  accuracy and privacy checks for every role.
- **AC-007**: `US-011`, `FR-047` through `FR-052`, and `SC-009` pass closure
  blocker checks and workbook structural/formula verification.
- **AC-008**: If P2 weak-network drafts ship, `US-012`, `FR-053` through
  `FR-056`, and `SC-007` pass interrupted-network and retry tests.
- **AC-009**: `NFR-015` through `NFR-019` pass keyboard, focus, status-label,
  validation, and mobile viewport review on all P1 flows.
- **AC-010**: `SC-010` passes a repository, fixture, screenshot, log, and export
  scan before any demo or deployment.

## Dependencies

- A Google Forms response Sheet with an application-managed `Order ID` column
  and credentials limited to the required read/write scope.
- A controlled committee member/division master dataset.
- A designated private Google Drive folder and operational sharing policy for
  payment-proof links.
- Sanitized Nasi Jaha fixtures for calculations, workflows, and demo evidence.
- Cloudflare account access for Workers and D1 deployment.
- Microsoft Excel or another verification tool that faithfully opens `.xlsx`
  formulas, formats, and hyperlinks.

## Risks And Open Questions

### Product And Workflow Risks

- The actual Google Forms response Sheet may not safely preserve an added Order
  ID column under all form updates; verify this before implementation.
- Operators may edit a response in Sheets after import. MVP treats the
  application as authoritative after import, so this rule needs clear UI copy
  and training.
- Long-lived private Drive links can become inaccessible or accidentally public;
  the MVP relies on an operational permission review rather than API enforcement.
- Account lockout can be abused to temporarily deny access; automatic 15-minute
  expiry and admin unlock reduce but do not eliminate this risk.
- Weak-network local drafts contain temporary buyer data on the device; P2 must
  be excluded if safe cleanup cannot be demonstrated.
- Spreadsheet-style density can damage mobile usability if the interface copies
  the existing Sheet literally.

### Validation Questions For Later Stages

- What exact source columns and mappings exist in the production Google Forms
  response Sheet?
The initial workbook table order, labels, formulas, evidence links, and optional
signature rows are accepted for the MVP. Framework selection is an architecture
validation task, not a remaining product decision for the project owner.

No product clarification remains blocking. Before implementation, the Google
Forms mapping and added `Order ID` column must be validated on a copy of the
response Sheet.

## Sources Read

- `docs/ai-native/02-intent-brief.md` - approved project intent, user model,
  constraints, tradeoffs, success criteria, and downstream validations.
- Project-owner clarification answers received on 2026-07-21 for additional
  costs, 150-order activity sizing, report access direction, initial workbook
  format, and architecture ownership.
- Read-only inspection of Google Forms response spreadsheet
  `1HmC15FBgAm5H9hx1668aBtrgQl5Ol3t4aTk_zPBmY6g`, tab `Form Responses 1`, on
  2026-07-21.
