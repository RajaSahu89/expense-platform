'use client';

import { useState } from 'react';
import { Button, Card, ErrorNote, PageHeader, Select } from '@/components/ui';
import { api, errorMessage, jsonInit } from '@/lib/api';

type Step = 'upload' | 'map' | 'done';

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload');
  const [csv, setCsv] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [useSplitColumns, setUseSplitColumns] = useState(false);
  const [mapping, setMapping] = useState({ date: '', description: '', amount: '', debit: '', credit: '' });
  const [result, setResult] = useState<{ imported: number; skippedDuplicates: number; skippedInvalid: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setError('');
    if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
      setError('Please choose a .csv file.');
      return;
    }
    const text = await file.text();
    setCsv(text);
    await preview(text);
  };

  const preview = async (text: string) => {
    setBusy(true);
    setError('');
    try {
      const res = await api<{ headers: string[]; rows: Record<string, string>[]; totalRows: number }>(
        '/api/import/csv',
        jsonInit('POST', { mode: 'preview', csv: text })
      );
      setHeaders(res.headers);
      setRows(res.rows);
      setTotalRows(res.totalRows);
      // Best-effort guess at common bank export column names (Indian banks
      // typically use Narration / Withdrawal Amt. / Deposit Amt.).
      const guess = (candidates: string[]) =>
        res.headers.find((h) => candidates.some((c) => h.toLowerCase().includes(c))) ?? '';
      const debit = guess(['debit', 'withdrawal']);
      const credit = guess(['credit', 'deposit']);
      setMapping({
        date: guess(['date']),
        description: guess(['description', 'narration', 'particulars', 'memo', 'payee', 'name']),
        amount: res.headers.find((h) => h.toLowerCase() === 'amount') ?? '',
        debit,
        credit,
      });
      setUseSplitColumns(Boolean(debit && credit));
      setStep('map');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handleCommit = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api<{ imported: number; skippedDuplicates: number; skippedInvalid: number }>(
        '/api/import/csv',
        jsonInit('POST', {
          mode: 'commit',
          csv,
          mapping: useSplitColumns
            ? { date: mapping.date, description: mapping.description, debit: mapping.debit, credit: mapping.credit }
            : { date: mapping.date, description: mapping.description, amount: mapping.amount },
        })
      );
      setResult(res);
      setStep('done');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const amountReady = useSplitColumns ? Boolean(mapping.debit && mapping.credit) : Boolean(mapping.amount);

  return (
    <div className="px-5 md:px-10 py-8 max-w-3xl">
      <PageHeader title="Import CSV" />
      <p className="text-sm text-muted mb-6">
        Upload a bank statement export. You&apos;ll confirm which columns map to date, description, and
        amount before anything is saved — and re-uploading the same file will skip rows already imported.
      </p>

      {step === 'upload' && (
        <Card className="p-8">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            className={`block border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
              dragging ? 'border-accent bg-accentSoft' : 'border-steel/60 hover:border-accent'
            }`}
          >
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = ''; // lets you re-pick the same file after an error
                if (file) handleFile(file);
              }}
            />
            <p className="text-sm text-ink font-medium mb-1">Click to choose a CSV file</p>
            <p className="text-xs text-muted">or drag one here</p>
          </label>
          {busy && <p className="text-sm text-muted mt-4">Reading file…</p>}
          {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
        </Card>
      )}

      {step === 'map' && (
        <Card className="p-6">
          <p className="text-sm text-muted mb-4">
            Found {totalRows} row{totalRows === 1 ? '' : 's'}. Map the columns below.
          </p>

          <div className="space-y-3 mb-5">
            <label className="text-xs text-muted block">
              Date column
              <Select value={mapping.date} onChange={(e) => setMapping({ ...mapping, date: e.target.value })} className="mt-1">
                <option value="">Select…</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-xs text-muted block">
              Description column
              <Select
                value={mapping.description}
                onChange={(e) => setMapping({ ...mapping, description: e.target.value })}
                className="mt-1"
              >
                <option value="">Select…</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </Select>
            </label>

            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" checked={useSplitColumns} onChange={(e) => setUseSplitColumns(e.target.checked)} />
              My statement has separate debit and credit columns
            </label>

            {useSplitColumns ? (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-muted">
                  Debit column
                  <Select value={mapping.debit} onChange={(e) => setMapping({ ...mapping, debit: e.target.value })} className="mt-1">
                    <option value="">Select…</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="text-xs text-muted">
                  Credit column
                  <Select value={mapping.credit} onChange={(e) => setMapping({ ...mapping, credit: e.target.value })} className="mt-1">
                    <option value="">Select…</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
            ) : (
              <label className="text-xs text-muted block">
                Amount column (negative = expense)
                <Select value={mapping.amount} onChange={(e) => setMapping({ ...mapping, amount: e.target.value })} className="mt-1">
                  <option value="">Select…</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </Select>
              </label>
            )}
          </div>

          <div className="overflow-x-auto mb-5 border border-line rounded-xl">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/5">
                  {headers.map((h) => (
                    <th key={h} className="text-left px-3 py-2 font-medium text-muted whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="ledger-row">
                    {headers.map((h) => (
                      <td key={h} className="px-3 py-2 whitespace-nowrap text-ink">
                        {row[h]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <div className="mb-3"><ErrorNote>{error}</ErrorNote></div>}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setStep('upload')}>
              Back
            </Button>
            <Button onClick={handleCommit} disabled={busy || !mapping.date || !mapping.description || !amountReady}>
              {busy ? 'Importing…' : `Import ${totalRows} rows`}
            </Button>
          </div>
        </Card>
      )}

      {step === 'done' && result && (
        <Card className="p-8 text-center">
          <p className="font-display text-2xl font-semibold mb-2">Import complete</p>
          <p className="text-sm text-muted mb-1">{result.imported} transactions imported.</p>
          {result.skippedDuplicates > 0 && (
            <p className="text-sm text-muted">{result.skippedDuplicates} duplicate rows skipped.</p>
          )}
          {result.skippedInvalid > 0 && (
            <p className="text-sm text-muted">{result.skippedInvalid} rows skipped (unreadable date or amount).</p>
          )}
          <Button
            className="mt-5"
            onClick={() => {
              setStep('upload');
              setCsv('');
              setHeaders([]);
              setRows([]);
              setResult(null);
            }}
          >
            Import another file
          </Button>
        </Card>
      )}
    </div>
  );
}
