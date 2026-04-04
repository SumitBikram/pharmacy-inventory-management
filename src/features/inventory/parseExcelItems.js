import { read, utils, SSF } from 'xlsx';
import { format, parse } from 'date-fns';

/**
 * Fixed column indices matching the expected Excel format:
 * Qty | Packing | Medicine Description | HSN | Batch No | Expiry Date | Old MRP | MRP | Rate | Discount | Sch% | GST% | Amount
 */
const COL = {
  QTY: 0,
  PACKING: 1,
  MEDICINE: 2,
  HSN: 3,
  BATCH_NO: 4,
  EXPIRY: 5,
  OLD_MRP: 6,
  MRP: 7,
  RATE: 8,
  DISCOUNT: 9,
  SCHEDULE: 10,
  GST: 11,
  // AMOUNT (12) — ignored, recalculated
};

function buildMedicineLookup(medicines) {
  const exactMap = new Map();
  for (const m of medicines) {
    exactMap.set(m.name.toLowerCase().trim(), m);
  }
  return exactMap;
}

function matchMedicine(name, exactMap, medicines) {
  if (!name) return null;
  const lower = name.toLowerCase().trim();

  // Exact match
  if (exactMap.has(lower)) return exactMap.get(lower);

  // Partial match — medicine name contains the Excel value or vice versa
  for (const m of medicines) {
    const mLower = m.name.toLowerCase().trim();
    if (mLower.includes(lower) || lower.includes(mLower)) return m;
  }

  return null;
}

function parseExpiryDate(value) {
  if (!value) return '';

  // Excel serial date number
  if (typeof value === 'number') {
    const parsed = SSF.parse_date_code(value);
    if (parsed) {
      return format(new Date(parsed.y, parsed.m - 1, parsed.d), 'yyyy-MM-dd');
    }
  }

  const str = String(value).trim();

  // yyyy-MM-dd (already correct)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // MM/YYYY or MM-YYYY → first day of month
  const mmYYYY = str.match(/^(\d{1,2})[/-](\d{4})$/);
  if (mmYYYY) {
    const date = new Date(parseInt(mmYYYY[2]), parseInt(mmYYYY[1]) - 1, 1);
    return format(date, 'yyyy-MM-dd');
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const ddMMYYYY = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (ddMMYYYY) {
    const date = new Date(parseInt(ddMMYYYY[3]), parseInt(ddMMYYYY[2]) - 1, parseInt(ddMMYYYY[1]));
    return format(date, 'yyyy-MM-dd');
  }

  // MM/YY or MM-YY → first day of month, assume 20xx
  const mmYY = str.match(/^(\d{1,2})[/-](\d{2})$/);
  if (mmYY) {
    const year = 2000 + parseInt(mmYY[2]);
    const date = new Date(year, parseInt(mmYY[1]) - 1, 1);
    return format(date, 'yyyy-MM-dd');
  }

  // Try native Date parse as fallback
  try {
    const date = parse(str, 'dd/MM/yyyy', new Date());
    if (!isNaN(date)) return format(date, 'yyyy-MM-dd');
  } catch {
    // ignore
  }

  return '';
}

function parseNumber(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'number') return value;
  // Remove commas (Indian number format)
  const cleaned = String(value).replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? '' : num;
}

/**
 * Parse an Excel file and return items matching the StockEntryForm structure.
 * @param {File} file - The uploaded Excel/CSV file
 * @param {Array} medicines - List of medicines from the database
 * @returns {Promise<{ items: Array, warnings: string[] }>}
 */
export default function parseExcelItems(file, medicines) {
  return new Promise((resolve, reject) => {
    const reader = new globalThis.FileReader();
    reader.onload = (e) => {
      try {
        const workbook = read(e.target.result, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (rows.length < 2) {
          reject(new Error('Excel file has no data rows (only header or empty)'));
          return;
        }

        const exactMap = buildMedicineLookup(medicines);
        const items = [];
        const warnings = [];

        // Skip first row (header)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];

          // Skip completely empty rows
          if (row.every((cell) => cell === '' || cell == null)) continue;

          const medicineName = String(row[COL.MEDICINE] || '').trim();
          const matched = matchMedicine(medicineName, exactMap, medicines);

          if (medicineName && !matched) {
            warnings.push(`Row ${i + 1}: "${medicineName}" not found in medicines`);
          }

          items.push({
            key: Date.now() + i,
            medicine_id: matched?.id || '',
            medicine_name: matched?.name || medicineName,
            hsn_code: matched?.hsn_code || String(row[COL.HSN] || ''),
            packing: matched?.packing || String(row[COL.PACKING] || ''),
            batch_no: String(row[COL.BATCH_NO] || ''),
            expiry_date: parseExpiryDate(row[COL.EXPIRY]),
            quantity: parseNumber(row[COL.QTY]),
            old_mrp: parseNumber(row[COL.OLD_MRP]),
            mrp: parseNumber(row[COL.MRP]),
            purchase_price: parseNumber(row[COL.RATE]),
            discount: parseNumber(row[COL.DISCOUNT]) || 0,
            schedule_percent: parseNumber(row[COL.SCHEDULE]) || 0,
            gst_percent: parseNumber(row[COL.GST]) || 0,
          });
        }

        resolve({ items, warnings });
      } catch (err) {
        reject(new Error(`Failed to parse Excel file: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
