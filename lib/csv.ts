import Papa from 'papaparse';
import crypto from 'crypto';

export interface CsvColumnMapping {
  date: string;
  description: string;
  amount: string;
  // Some banks split debits/credits into two columns instead of a signed amount.
  debit?: string;
  credit?: string;
}

export interface ParsedCsvRow {
  date: string;
  description: string;
  amount: number; // positive
  type: 'INCOME' | 'EXPENSE';
  fingerprint: string; // stable hash used to detect duplicate imports
}

/** Parses raw CSV text into header + preview rows for the mapping step. */
export function parseCsvPreview(raw: string, previewRows = 10) {
  const result = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = result.meta.fields ?? [];
  const rows = result.data.slice(0, previewRows);
  const totalRows = result.data.length;

  return { headers, rows, totalRows, errors: result.errors };
}

/**
 * Applies a confirmed column mapping to the full CSV and returns
 * normalized rows ready for categorization + insertion. `fingerprint`
 * makes the operation idempotent: hashing (date + description + amount)
 * means re-importing the same statement — even under a new file name —
 * produces the same fingerprints, so duplicate detection catches it.
 */
export function applyMapping(raw: string, mapping: CsvColumnMapping): ParsedCsvRow[] {
  const result = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  });

  const rows: ParsedCsvRow[] = [];

  for (const record of result.data) {
    const dateRaw = record[mapping.date];
    const description = (record[mapping.description] ?? '').trim();
    if (!dateRaw || !description) continue;

    let amount: number;
    let type: 'INCOME' | 'EXPENSE';

    if (mapping.debit && mapping.credit) {
      const debit = parseFloat(record[mapping.debit] || '0') || 0;
      const credit = parseFloat(record[mapping.credit] || '0') || 0;
      if (debit > 0) {
        amount = debit;
        type = 'EXPENSE';
      } else {
        amount = credit;
        type = 'INCOME';
      }
    } else {
      const raw = parseFloat((record[mapping.amount] || '0').replace(/[,₹$]/g, ''));
      amount = Math.abs(raw);
      type = raw < 0 ? 'EXPENSE' : 'INCOME';
    }

    if (!amount) continue;

    const date = normalizeDate(dateRaw);
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${date}|${description.toLowerCase()}|${amount.toFixed(2)}`)
      .digest('hex');

    rows.push({ date, description, amount, type, fingerprint });
  }

  return rows;
}

function normalizeDate(input: string): string {
  const trimmed = input.trim();
  // Handle MM/DD/YYYY common in US bank exports in addition to ISO.
  const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (usMatch) {
    const [, m, d, y] = usMatch;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return trimmed;
}
