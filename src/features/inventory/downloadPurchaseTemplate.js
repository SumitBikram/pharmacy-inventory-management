import { utils, writeFile } from 'xlsx';

const HEADERS = [
  'Qty',
  'Packing',
  'Medicine Description',
  'HSN',
  'Batch No',
  'Expiry Date',
  'Old MRP',
  'MRP',
  'Rate',
  'Discount%',
  'Sch%',
  'GST%',
];

const EXAMPLE_ROWS = [
  [10, '10s', 'Paracetamol 500mg', '3004', 'BT-2025-001', '06/2027', '', 25.5, 18.0, 10, 0, 12],
  [5, '15ml', 'Cough Syrup 100ml', '3004', 'CS-2025-042', '2027-03-15', 30, 28.0, 20.0, 5, 0, 18],
];

const COL_WIDTHS = [
  { wch: 6 },   // Qty
  { wch: 8 },   // Packing
  { wch: 28 },  // Medicine Description
  { wch: 8 },   // HSN
  { wch: 16 },  // Batch No
  { wch: 14 },  // Expiry Date
  { wch: 10 },  // Old MRP
  { wch: 10 },  // MRP
  { wch: 10 },  // Rate
  { wch: 10 },  // Discount%
  { wch: 8 },   // Sch%
  { wch: 8 },   // GST%
];

export default function downloadPurchaseTemplate() {
  const data = [HEADERS, ...EXAMPLE_ROWS];
  const ws = utils.aoa_to_sheet(data);
  ws['!cols'] = COL_WIDTHS;

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Purchase Template');
  writeFile(wb, 'purchase_template.xlsx');
}
