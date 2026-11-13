import Papa from 'papaparse';
import crypto from 'crypto';

export interface CsvColumnMapping {
  date: string;
  description: string;
  amount?: string;
  // Some banks split debits/credits into two columns instead of a signed amount.
  debit?: string;
  credit?: string;
}

export interface ParsedCsvRow {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positive
  type: 'INCOME' | 'EXPENSE';
  fingerprint: string; // stable hash used to detect duplicate imports
}

export interface ApplyMappingResult {
  rows: ParsedCsvRow[];
  invalidRows: number; // rows dropped because the date or amount couldn't be read
}

function parseRaw(raw: string) {
  // Excel often saves CSVs with a UTF-8 BOM, which would otherwise end up
  // glued to the first header name and break column matching.
  const text = raw.replace(/^\uFEFF/, '');
  return Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
}

/** Parses raw CSV text into header + preview rows for the mapping step. */
export function parseCsvPreview(raw: string, previewRows = 10) {
  const result = parseRaw(raw);
  const headers = result.meta.fields ?? [];
  const rows = result.data.slice(0, previewRows);
  const totalRows = result.data.length;

  return { headers, rows, totalRows, errors: result.errors.slice(0, 5) };
}

/** Parses "1,234.50", "₹1,234", "(500.00)" → number (negative for brackets). */
export function parseAmount(input: string | undefined): number {
  if (!input) return 0;
  let s = input.replace(/[₹$€£\s]/g, '');
  if (!s) return 0;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (/dr\.?$/i.test(s)) negative = true; // "1,200 Dr" = debit
  s = s.replace(/[^0-9.\-]/g, '');
  const n = parseFloat(s);
  if (Number.isNaN(n)) return 0;
  return negative ? -Math.abs(n) : n;
}

/**
 * Applies a confirmed column mapping to the full CSV and returns
 * normalized rows ready for categorization + insertion.
 *
 * `fingerprint` makes the import idempotent: hashing
 * (date + description + amount + occurrence) means re-importing the same
 * statement — even under a new file name — produces the same fingerprints.
 * The occurrence counter lets two genuinely identical purchases on the same
 * day (e.g. two ₹20 chai payments) both survive, while still matching
 * themselves on a re-import.
 */
export function applyMapping(raw: string, mapping: CsvColumnMapping): ApplyMappingResult {
  const result = parseRaw(raw);
  const rows: ParsedCsvRow[] = [];
  const seen = new Map<string, number>();
  let invalidRows = 0;

  for (const record of result.data) {
    const dateRaw = record[mapping.date];
    const description = (record[mapping.description] ?? '').trim();
    if (!dateRaw || !description) continue;

    let amount: number;
    let type: 'INCOME' | 'EXPENSE';

    if (mapping.debit && mapping.credit) {
      const debit = Math.abs(parseAmount(record[mapping.debit]));
      const credit = Math.abs(parseAmount(record[mapping.credit]));
      if (debit > 0) {
        amount = debit;
        type = 'EXPENSE';
      } else {
        amount = credit;
        type = 'INCOME';
      }
    } else if (mapping.amount) {
      const signed = parseAmount(record[mapping.amount]);
      amount = Math.abs(signed);
      type = signed < 0 ? 'EXPENSE' : 'INCOME';
    } else {
      continue;
    }

    const date = normalizeDate(dateRaw);
    if (!amount || !date) {
      invalidRows++;
      continue;
    }

    const key = `${date}|${description.toLowerCase()}|${amount.toFixed(2)}|${type}`;
    const occurrence = (seen.get(key) ?? 0) + 1;
    seen.set(key, occurrence);

    const fingerprint = crypto.createHash('sha256').update(`${key}|${occurrence}`).digest('hex');
    rows.push({ date, description, amount, type, fingerprint });
  }

  return { rows, invalidRows };
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function iso(y: number, m: number, d: number): string | null {
  if (y < 100) y += 2000;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date.toISOString().slice(0, 10);
}

/**
 * Normalizes a bank-export date to YYYY-MM-DD, or returns null if it can't
 * be understood. Indian statements use DD/MM/YYYY, so that is the default
 * for ambiguous values like 03/04/2025; MM/DD is only used when the second
 * number can't be a month (e.g. 03/25/2025).
 */
export function normalizeDate(input: string): string | null {
  const s = input.trim();

  // ISO: 2025-04-03 (optionally followed by a time)
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if (m) return iso(+m[1], +m[2], +m[3]);

  // 03/04/2025, 03-04-2025, 03.04.25
  m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    const a = +m[1];
    const b = +m[2];
    const y = +m[3];
    if (a > 12) return iso(y, b, a); // DD/MM
    if (b > 12) return iso(y, a, b); // MM/DD
    return iso(y, b, a); // ambiguous → DD/MM
  }

  // 03 Apr 2025, 3-Apr-25, 03 April 2025
  m = s.match(/^(\d{1,2})[\s\-]([A-Za-z]{3,9})[\s\-,]*(\d{2,4})$/);
  if (m) {
    const month = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (month) return iso(+m[3], month, +m[1]);
  }

  return null;
}
