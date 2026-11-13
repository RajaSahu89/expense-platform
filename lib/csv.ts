import Papa from 'papaparse';
import crypto from 'crypto';

export interface CsvColumnMapping {
  date: string;
  description: string;
  amount?: string;
  debit?: string;
  credit?: string;
}

export interface ParsedCsvRow {
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  fingerprint: string;
}

export interface ApplyMappingResult {
  rows: ParsedCsvRow[];
  invalidRows: number;
}

function parseRaw(raw: string) {
  const text = raw.replace(/^\uFEFF/, '');
  return Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
}
export function parseCsvPreview(raw: string, previewRows = 10) {
  const result = parseRaw(raw);
  const headers = result.meta.fields ?? [];
  const rows = result.data.slice(0, previewRows);
  const totalRows = result.data.length;

  return { headers, rows, totalRows, errors: result.errors.slice(0, 5) };
}
export function parseAmount(input: string | undefined): number {
  if (!input) return 0;
  let s = input.replace(/[₹$€£\s]/g, '');
  if (!s) return 0;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (/dr\.?$/i.test(s)) negative = true;
  s = s.replace(/[^0-9.\-]/g, '');
  const n = parseFloat(s);
  if (Number.isNaN(n)) return 0;
  return negative ? -Math.abs(n) : n;
}
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
export function normalizeDate(input: string): string | null {
  const s = input.trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    const a = +m[1];
    const b = +m[2];
    const y = +m[3];
    if (a > 12) return iso(y, b, a);
    if (b > 12) return iso(y, a, b);
    return iso(y, b, a);
  }
  m = s.match(/^(\d{1,2})[\s\-]([A-Za-z]{3,9})[\s\-,]*(\d{2,4})$/);
  if (m) {
    const month = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (month) return iso(+m[3], month, +m[1]);
  }

  return null;
}
