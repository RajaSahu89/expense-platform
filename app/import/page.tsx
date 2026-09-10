'use client';

import { useState } from 'react';
import { Button, Card, Select } from '@/components/ui';

type Step = 'upload' | 'map' | 'done';

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload');
  const [csv, setCsv] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [useSplitColumns, setUseSplitColumns] = useState(false);
  const [mapping, setMapping] = useState({ date: '', description: '', amount: '', debit: '', credit: '' });
  const [result, setResult] = useState<{ imported: number; skippedDuplicates: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    const text = await file.text();
    setCsv(text);
    await preview(text);
  };

  const preview = async (text: string) => {
    setBusy(true);
    setError('');
    const res = await fetch('/api/import/csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'preview', csv: text }),
    }).then((r) => r.json());
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setHeaders(res.headers);
    setRows(res.rows);
    setTotalRows(res.totalRows);
    // Best-effort guess at common bank export column names.
    const guess = (candidates: string[]) =>
      res.headers.find((h: string) => candidates.includes(h.toLowerCase())) ?? '';
    setMapping({
      date: guess(['date', 'transaction date', 'posted date']),
      description: guess(['description', 'memo', 'payee', 'name']),
      amount: guess(['amount']),
      debit: guess(['debit', 'withdrawal']),
      credit: guess(['credit', 'deposit']),
    });
    setStep('map');
  };

  const handleCommit = async () => {
    setBusy(true);
    setError('');
    const body: any = {
      mode: 'commit',
      csv,
      mapping: useSplitColumns
        ? { date: mapping.date, description: mapping.description, debit: mapping.debit, credit: mapping.credit }
        : { date: mapping.date, description: mapping.description, amount: mapping.amount },
    };
    const res = await fetch('/api/import/csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.json());
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setResult(res);
    setStep('done');
  };

  return (
    <div className="px-5 md:px-10 py-8 max-w-3xl">
      <h1 className="font-display text-3xl mb-2">Import CSV</h1>
      <p className="text-sm text-slate mb-6">
        Upload a bank statement export. You&apos;ll confirm which columns map to date, description, and
        amount before anything is saved — and re-uploading the same file will skip rows already imported.
      </p>

      {step === 'upload' && (
        <Card className="p-8">
          <label className="block border-2 border-dashed border-line rounded-lg p-10 text-center cursor-pointer hover:border-moss transition-colors">
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <p className="text-sm text-ink font-medium mb-1">Click to choose a CSV file</p>
            <p className="text-xs text-slate">or drag one here</p>
          </label>
          {busy && <p className="text-sm text-slate mt-4">Reading file…</p>}
          {error && <p className="text-sm text-rust mt-4">{error}</p>}
        </Card>
      )}

      {step === 'map' && (
        <Card className="p-6">
          <p className="text-sm text-slate mb-4">
            Found {totalRows} row{totalRows === 1 ? '' : 's'}. Map the columns below.
          </p>

          <div className="space-y-3 mb-5">
            <label className="text-xs text-slate block">
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
            <label className="text-xs text-slate block">
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

            <label className="flex items-center gap-2 text-xs text-slate">
              <input type="checkbox" checked={useSplitColumns} onChange={(e) => setUseSplitColumns(e.target.checked)} />
              My statement has separate debit and credit columns
            </label>

            {useSplitColumns ? (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-slate">
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
                <label className="text-xs text-slate">
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
              <label className="text-xs text-slate block">
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

          <div className="overflow-x-auto mb-5 border border-line rounded">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-paper">
                  {headers.map((h) => (
                    <th key={h} className="text-left px-3 py-2 font-medium text-slate whitespace-nowrap">
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

          {error && <p className="text-sm text-rust mb-3">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setStep('upload')}>
              Back
            </Button>
            <Button onClick={handleCommit} disabled={busy || !mapping.date || !mapping.description}>
              {busy ? 'Importing…' : `Import ${totalRows} rows`}
            </Button>
          </div>
        </Card>
      )}

      {step === 'done' && result && (
        <Card className="p-8 text-center">
          <p className="font-display text-2xl mb-2">Import complete</p>
          <p className="text-sm text-slate mb-1">{result.imported} transactions imported.</p>
          {result.skippedDuplicates > 0 && (
            <p className="text-sm text-slate">{result.skippedDuplicates} duplicate rows skipped.</p>
          )}
          <Button
            className="mt-5"
            onClick={() => {
              setStep('upload');
              setCsv('');
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
