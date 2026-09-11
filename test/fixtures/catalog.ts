// Synthetic test data only. This is not the production persistence schema.
export const axes = {
  order: ["pending_confirmation", "confirmed", "cancelled"],
  payment: ["unpaid", "partially_paid", "paid"],
  fulfillment: ["not_processed", "assigned_carried", "received", "problematic"],
  remittance: ["not_remitted", "remitted", "audited"],
} as const;

type States = { [K in keyof typeof axes]: (typeof axes)[K][number] };
export interface FixtureOrder {
  id: string;
  buyer: { name: string; phone: string };
  location: { pickupPoint: string } | { area: string; address: string; mapUrl: string };
  picId: string;
  attribution: { divisionId: string; memberId: string | null; note: string };
  source: { type: "manual"; idempotencyKey: string } |
    { type: "form_sync"; sheetId: string; row: number };
  quantity: number;
  receivedQuantity: number;
  collectedRp: number;
  remittedRp: number;
  paymentMethod: "cash" | "transfer";
  proofUrl: string | null;
  states: States;
  actorId: string;
  occurredAt: string;
}

const stamp = "2026-01-15T02:00:00Z";
function order(id: string, mode: "campus" | "regional", patch: Partial<FixtureOrder> = {}): FixtureOrder {
  return {
    id: `synthetic-order-${id}`,
    buyer: { name: `Pembeli Sintetis ${id}`, phone: `SYNTHETIC-PHONE-${id}` },
    location: mode === "campus" ? { pickupPoint: "Titik Sintetis A" } : {
      area: "Wilayah Sintetis A", address: `ALAMAT-SINTETIS-${id}`,
      mapUrl: `https://maps.example.invalid/synthetic-${id}`,
    },
    picId: "synthetic-pic-a",
    attribution: { divisionId: "synthetic-division-a", memberId: "synthetic-member-a", note: "Relasi sintetis" },
    source: { type: "manual", idempotencyKey: `synthetic-request-${id}` },
    quantity: 1, receivedQuantity: 1, collectedRp: 1700, remittedRp: 1700,
    paymentMethod: "cash", proofUrl: null,
    states: { order: "confirmed", payment: "paid", fulfillment: "received", remittance: "audited" },
    actorId: "synthetic-coordinator", occurredAt: stamp,
    ...patch,
  };
}

// Finance samples intentionally contain only received confirmed orders. This
// avoids deciding the pending prepayment/cancellation/refund semantics in H1.
export const financeActivities = [
  {
    id: "synthetic-campus-active", product: "Nasi Jaha Sintetis", mode: "campus",
    status: "active", sellingPriceRp: 1700, purchasePriceRp: 700, targetQuantity: 5,
    additionalCosts: [{ amountRp: 300, description: "Biaya sintetis A" }],
    orders: [
      order("c1", "campus", { quantity: 2, receivedQuantity: 2, collectedRp: 3400, remittedRp: 3400 }),
      order("c2", "campus", { collectedRp: 600, remittedRp: 0,
        states: { order: "confirmed", payment: "partially_paid", fulfillment: "received", remittance: "not_remitted" } }),
      order("c3", "campus", { remittedRp: 0,
        attribution: { divisionId: "synthetic-division-b", memberId: null, note: "Divisi ditetapkan saat pengambilan sintetis" },
        states: { order: "confirmed", payment: "paid", fulfillment: "received", remittance: "not_remitted" } }),
    ],
    issues: [{ id: "synthetic-issue-c", kind: "invalid_proof", status: "open", reason: "Referensi sintetis perlu diperiksa", orderId: "synthetic-order-c2", actorId: "synthetic-pic-a", occurredAt: stamp }],
    approvedLosses: [],
    closure: { closedBy: null, closedAt: null, expectedBlockers: ["outstanding_payment", "unremitted_money", "open_issue"] },
  },
  {
    id: "synthetic-regional-closed", product: "Nasi Jaha Sintetis", mode: "regional",
    status: "closed", sellingPriceRp: 1700, purchasePriceRp: 700, targetQuantity: 4,
    additionalCosts: [{ amountRp: 200, description: "Biaya sintetis B" }],
    orders: [
      order("r1", "regional", { quantity: 2, receivedQuantity: 2, collectedRp: 3400, remittedRp: 3400,
        source: { type: "form_sync", sheetId: "synthetic-sheet-regional", row: 2 },
        paymentMethod: "transfer", proofUrl: "https://proof.example.invalid/synthetic-r1" }),
      order("r2", "regional", { picId: "synthetic-pic-b",
        location: { area: "Wilayah Sintetis B", address: "ALAMAT-SINTETIS-r2", mapUrl: "https://maps.example.invalid/synthetic-r2" } }),
    ],
    issues: [{ id: "synthetic-issue-r", kind: "damage", status: "resolved", reason: "Kerusakan kemasan sintetis ditinjau", actorId: "synthetic-pic-b", occurredAt: stamp }],
    // Separate itemized loss, never subtract it silently from original orders.
    approvedLosses: [{ id: "synthetic-loss-r", issueId: "synthetic-issue-r", amountRp: 200, reason: "Kerugian kemasan sintetis", approvedBy: "synthetic-deputy", approvedAt: "2026-01-15T03:00:00Z" }],
    closure: { closedBy: "synthetic-coordinator", closedAt: "2026-01-15T04:00:00Z", expectedBlockers: [] },
  },
] as const;

// Coverage examples have no aggregate finance oracle: they are future state,
// correction and intake inputs, not assumptions about unresolved accounting.
export const stateExamples: FixtureOrder[] = [
  order("pending", "campus", { receivedQuantity: 0, collectedRp: 0, remittedRp: 0,
    states: { order: "pending_confirmation", payment: "unpaid", fulfillment: "not_processed", remittance: "not_remitted" } }),
  order("carried", "regional", { receivedQuantity: 0, collectedRp: 0, remittedRp: 0,
    states: { order: "confirmed", payment: "unpaid", fulfillment: "assigned_carried", remittance: "not_remitted" } }),
  order("problem", "regional", { receivedQuantity: 0, collectedRp: 0, remittedRp: 0,
    states: { order: "confirmed", payment: "unpaid", fulfillment: "problematic", remittance: "not_remitted" } }),
  order("cancelled", "campus", { receivedQuantity: 0, collectedRp: 0, remittedRp: 0,
    states: { order: "cancelled", payment: "unpaid", fulfillment: "not_processed", remittance: "not_remitted" } }),
  order("remitted", "campus", {
    states: { order: "confirmed", payment: "paid", fulfillment: "received", remittance: "remitted" } }),
];

export const corrections = [
  { id: "synthetic-correction-typo", orderId: "synthetic-order-c1", field: "buyer.name",
    before: "Pembeli Sintetis c1-typo", after: "Pembeli Sintetis c1",
    reason: "Perbaikan label sintetis", actorId: "synthetic-pic-a", occurredAt: stamp,
    approvedBy: null, approvedAt: null },
  { id: "synthetic-correction-cancel", orderId: "synthetic-order-cancelled", field: "states.order",
    before: "confirmed", after: "cancelled", reason: "Duplikat sintetis tanpa pembayaran",
    actorId: "synthetic-pic-a", occurredAt: stamp,
    approvedBy: "synthetic-coordinator", approvedAt: "2026-01-15T03:00:00Z" },
] as const;

export const allOrders = [...financeActivities.flatMap((activity) => activity.orders), ...stateExamples];
