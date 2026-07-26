import * as XLSX from "xlsx";

export function createSyntheticWorkbook(): Uint8Array {
  const workbook = XLSX.utils.book_new();
  const groups: Array<[string, (string | number)[][]]> = [
    ["1 Product Target", [["Product", "Synthetic Nasi Jaha"], ["Unit price", 15000], ["Target quantity", 10]]],
    ["2 All Revenue", [["Order ID", "Quantity", "Amount"], ["SYN-001", 2, 30000], ["Total", "", 0]]],
    ["3 Problems", [["Problem", "Amount"], ["Synthetic packaging loss", 5000]]],
    ["4 Final Decision", [["Metric", "Value"], ["Recognized revenue", 0], ["Approved loss", 5000], ["Decision", "Synthetic proof only"]]],
  ];

  for (const [name, rows] of groups) {
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  }

  const revenue = workbook.Sheets["2 All Revenue"]!;
  revenue.C3 = { f: "B2*C2", t: "n", v: 30000, z: '[$Rp-421] #,##0' };
  revenue.C4 = { f: "SUM(C2:C3)", t: "n", v: 60000, z: '[$Rp-421] #,##0' };
  revenue.A2 = { t: "s", v: "SYN-001", l: { Target: "https://example.invalid/synthetic-evidence" } };
  XLSX.utils.sheet_add_aoa(revenue, [["Committee Chair", "________________"], ["Treasurer", "________________"]], { origin: "A7" });

  const finalDecision = workbook.Sheets["4 Final Decision"]!;
  finalDecision.B2 = { f: "'2 All Revenue'!C4", t: "n", v: 60000, z: '[$Rp-421] #,##0' };
  return XLSX.write(workbook, { type: "array", bookType: "xlsx", compression: true });
}
