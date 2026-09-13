/** Internal D1 rows, never response DTOs. Member/PIC is stored as `member`. */
export type AccountRole = "coordinator" | "deputy" | "member" | "officer" | "treasurer";
export type DatabaseFlag = 0 | 1;

export interface AccountRow {
  id: string;
  /** Canonical lowercase ASCII login key: letters, digits, dot, underscore, hyphen. */
  username: string;
  role: AccountRole;
  /** D1 returns BLOB columns as byte arrays. These are verifiers, never passwords. */
  password_hash: number[];
  password_salt: number[];
  password_version: number;
  /** Nonempty JSON object; interpretation and approved costs belong to T008. */
  password_parameters: string;
  active: DatabaseFlag;
  must_change_password: DatabaseFlag;
  failure_count: number;
  /** UTC epoch milliseconds; null means no persisted lock. */
  locked_until: number | null;
}

export interface SessionRow {
  id: string;
  account_id: string;
  /** Digest bytes only. No raw cookie token field exists. */
  token_hash: number[];
  /** UTC epoch milliseconds, bounded by JavaScript Date's supported range. */
  created_at: number;
  expires_at: number;
  revoked_at: number | null;
}

/** Controlled attribution data; no member row is a login account. */
export interface DivisionRow {
  id: string;
  name: string;
  active: DatabaseFlag;
}

export interface CommitteeMemberRow {
  id: string;
  display_name: string;
  division_id: string;
  active: DatabaseFlag;
}

export type ActivityMode = "campus" | "regional";
export type ActivityStatus = "draft" | "active" | "closed";

export interface ActivityRow {
  id: string;
  product_name: string;
  mode: ActivityMode;
  unit_purchase_price_rp: number;
  unit_selling_price_rp: number;
  target_quantity: number;
  period: string;
  /** Lifecycle edit rules belong to T016; this is storage only. */
  status: ActivityStatus;
}

export interface AdditionalCostRow {
  id: string;
  activity_id: string;
  amount_rp: number;
  purpose: string;
}

export interface CampusActivityConfigRow {
  activity_id: string;
  pickup_point: string;
  pic_committee_member_id: string;
}

export interface RegionalActivityConfigRow {
  activity_id: string;
  area_name: string;
  pic_committee_member_id: string;
}

/** Internal order persistence; sensitive fields must never be returned as a raw DTO. */
export type OrderSourceType = "manual" | "form_sync";

export interface OrderRow {
  /** Immutable application identifier, never a Sheet row identity. */
  order_id: string;
  activity_id: string;
  source_type: OrderSourceType;
  buyer_name: string;
  buyer_phone: string | null;
  buyer_address: string | null;
  buyer_map_reference: string | null;
  attributed_committee_member_id: string | null;
  attributed_division_id: string | null;
  attribution_note: string | null;
  regional_area: string | null;
  pickup_point: string | null;
  assigned_pic_committee_member_id: string;
  quantity: number;
  payment_method: string;
  /** Drive-reference metadata only; no binary proof field exists. */
  payment_proof_reference: string | null;
  payment_proof_filename: string | null;
  payment_proof_mime_type: string | null;
  notes: string | null;
  created_by_account_id: string;
  /** UTC epoch milliseconds. */
  created_at: number;
}

export type OrderState = "pending_confirmation" | "confirmed" | "cancelled";
export type PaymentState = "unpaid" | "partially_paid" | "paid";
export type FulfillmentState =
  | "not_processed"
  | "assigned_or_carried_by_pic"
  | "received_by_buyer"
  | "problematic";
export type RemittanceState = "not_remitted" | "remitted" | "audited";

export interface OrderStateHistoryRow {
  id: string;
  order_id: string;
  state: OrderState;
  actor_account_id: string;
  occurred_at: number;
}

/** An append-only, non-negative integer-rupiah collection event. */
export interface PaymentHistoryRow {
  id: string;
  order_id: string;
  state: PaymentState;
  amount_collected_rp: number;
  actor_account_id: string;
  occurred_at: number;
}

export interface FulfillmentHistoryRow {
  id: string;
  order_id: string;
  state: FulfillmentState;
  actor_account_id: string;
  occurred_at: number;
}

/** An append-only, non-negative integer-rupiah PIC remittance event. */
export interface RemittanceHistoryRow {
  id: string;
  order_id: string;
  state: RemittanceState;
  amount_remitted_rp: number;
  actor_account_id: string;
  occurred_at: number;
}

export type IssueTargetType =
  | "order"
  | "order_state_history"
  | "payment_history"
  | "fulfillment_history"
  | "remittance_history"
  | "payment_proof_metadata";

export type IssueType =
  | "duplicate"
  | "repeated_proof"
  | "invalid_proof"
  | "typo"
  | "damage"
  | "non_pickup"
  | "other";

/** An immutable, reviewable issue proposal; it does not change its target. */
export interface IssueRow {
  id: string;
  target_type: IssueTargetType;
  target_id: string;
  issue_type: IssueType;
  reason: string;
  reported_by_account_id: string;
  reported_at: number;
}

export type CorrectionKind =
  | "data_correction"
  | "proof_reference_correction"
  | "void"
  | "refund"
  | "financial_correction"
  | "loss_classification";

/**
 * Proposed replacement values are JSON objects. They are internal audit data,
 * never a role DTO; the later correction service owns per-field redaction.
 */
export interface CorrectionRow {
  id: string;
  issue_id: string;
  target_type: IssueTargetType;
  target_id: string;
  correction_kind: CorrectionKind;
  before_json: string;
  after_json: string;
  reason: string;
  proposed_by_account_id: string;
  proposed_at: number;
  /** Derived structurally from correction_kind; financial kinds require one decision. */
  approval_required: DatabaseFlag;
}

export type FinancialEffectKind = Extract<
  CorrectionKind,
  "void" | "refund" | "financial_correction" | "loss_classification"
>;

/**
 * A non-negative proposed effect. It becomes countable only with its matching
 * approved correction decision; it never rewrites a T005 payment/remittance row.
 */
export interface FinancialEffectProposalRow {
  id: string;
  correction_id: string;
  effect_kind: FinancialEffectKind;
  amount_rp: number;
  proposed_at: number;
}

export type CorrectionDecision = "approved" | "rejected";

/** Exactly one immutable approval/rejection may resolve a financial proposal. */
export interface CorrectionApprovalRow {
  id: string;
  correction_id: string;
  decision: CorrectionDecision;
  approver_account_id: string;
  decided_at: number;
  /** Matching immutable `correction_approval` audit event required by D1. */
  audit_event_id: string;
}

export type AuditEntityType =
  | "account"
  | "activity"
  | "order"
  | "order_state_history"
  | "payment_history"
  | "fulfillment_history"
  | "remittance_history"
  | "issue"
  | "correction"
  | "correction_approval"
  | "financial_effect"
  | "idempotency"
  | "sync"
  | "report";

/** Internal append-only audit metadata. Optional JSON is an audit-safe summary only. */
export interface AuditEventRow {
  id: string;
  entity_type: AuditEntityType;
  entity_id: string;
  action: string;
  before_json: string | null;
  after_json: string | null;
  reason: string | null;
  actor_account_id: string;
  occurred_at: number;
}

export type IdempotencyResultStatus = "succeeded" | "failed";
export type IdempotencyResultKind =
  | "order"
  | "order_history"
  | "correction"
  | "financial_effect"
  | "sync_row"
  | "closure"
  | "report"
  | "none";

/**
 * Stores only a request digest and safe result reference, never a request body,
 * raw response, password, cookie, or other session material.
 */
export interface IdempotencyKeyRow {
  account_id: string;
  route: string;
  idempotency_key: string;
  request_hash: number[];
  result_status: IdempotencyResultStatus;
  result_kind: IdempotencyResultKind;
  result_reference: string | null;
  created_at: number;
  expires_at: number;
}
