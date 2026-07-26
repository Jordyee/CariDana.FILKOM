-- THROWAWAY SPIKE: synthetic health rows only; no product data or PII.
CREATE TABLE spike_probe (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  marker TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_spike_probe_marker ON spike_probe(marker);
