// Hand-declared oracles. No imports or calls to a production calculation.
// See README.md for independent arithmetic and the bounded scenario definition.
export const expectedFinance = {
  "synthetic-campus-active": {
    recognizedRp: 6800, collectedRp: 5700, outstandingRp: 1100,
    remittedRp: 3400, capitalRp: 3800, approvedLossRp: 0,
  },
  "synthetic-regional-closed": {
    recognizedRp: 5100, collectedRp: 5100, outstandingRp: 0,
    remittedRp: 5100, capitalRp: 3000, approvedLossRp: 200,
  },
} as const;
