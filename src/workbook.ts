import writeExcelFile, { type CellObject, type SheetData } from "write-excel-file/universal";

const rupiahFormat = '[$Rp-421] #,##0';

function header(value: string): CellObject {
  return {
    value,
    type: String,
    fontWeight: "bold",
    backgroundColor: "#1F2937",
    textColor: "#FFFFFF",
  };
}

function rupiah(value: number): CellObject {
  return { value, type: Number, format: rupiahFormat };
}

function formula(value: string, format?: string): CellObject {
  return { value, type: "Formula", format };
}

export async function createSyntheticWorkbook(): Promise<ArrayBuffer> {
  const product: SheetData = [
    [header("Product"), header("Unit price"), header("Target quantity")],
    ["Synthetic Nasi Jaha", rupiah(15_000), 10],
  ];

  const revenue: SheetData = [
    [header("Order ID"), header("Quantity"), header("Amount"), header("Evidence")],
    [
      "SYN-001",
      2,
      formula("B2*15000", rupiahFormat),
      formula('HYPERLINK("https://example.invalid/synthetic-evidence", "Synthetic evidence")'),
    ],
    ["Total", null, formula("SUM(C2:C2)", rupiahFormat), null],
  ];

  const problems: SheetData = [
    [header("Problem"), header("Amount"), header("Notes")],
    ["Synthetic packaging loss", rupiah(5_000), "Synthetic fixture only"],
  ];

  const finalDecision: SheetData = [
    [header("Metric"), header("Value")],
    ["Recognized revenue", formula("'2 All Revenue'!C3", rupiahFormat)],
    ["Approved loss", rupiah(5_000)],
    ["Decision", "Synthetic proof only"],
    [null, null],
    ["Committee Chair", "________________"],
    ["Treasurer", "________________"],
  ];

  const workbook = await writeExcelFile([
    { data: product, sheet: "1 Product Target", columns: [{ width: 24 }, { width: 16 }, { width: 18 }], stickyRowsCount: 1 },
    { data: revenue, sheet: "2 All Revenue", columns: [{ width: 16 }, { width: 12 }, { width: 16 }, { width: 24 }], stickyRowsCount: 1 },
    { data: problems, sheet: "3 Problems", columns: [{ width: 28 }, { width: 16 }, { width: 24 }], stickyRowsCount: 1 },
    { data: finalDecision, sheet: "4 Final Decision", columns: [{ width: 24 }, { width: 24 }], stickyRowsCount: 1 },
  ], { fontFamily: "Calibri", fontSize: 11 }).toBlob();

  return workbook.arrayBuffer();
}
