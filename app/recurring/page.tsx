'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import { Badge, Button, Card, ErrorNote, Input, PageHeader, Select, formatCurrency } from '@/components/ui';
import Modal from '@/components/Modal';
import { api, errorMessage, jsonInit } from '@/lib/api';

interface Recurring {
  id: string;
  name: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  frequency: string;
  nextRunDate: string;
  isActive: boolean;
  category: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

const FREQUENCIES = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY'];

export default function RecurringPage() {
  const [items, setItems] = useState<Recurring[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [pageError, setPageError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    amount: '',
    type: 'EXPENSE' as 'EXPENSE' | 'INCOME',
    categoryId: '',
    frequency: 'MONTHLY',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, cRes] = await Promise.all([
        api<{ recurring: Recurring[] }>('/api/recurring'),
        api<{ categories: Category[] }>('/api/categories'),
      ]);
      setItems(rRes.recurring);
      setCategories(cRes.categories);
      setPageError('');
    } catch (e) {
      setPageError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await api(
        '/api/recurring',
        jsonInit('POST', {
          name: form.name,
          type: form.type,
          frequency: form.frequency,
          startDate: form.startDate,
          endDate: form.endDate || null,
          amount: parseFloat(form.amount),
          categoryId: form.categoryId || null,
        })
      );
      setModalOpen(false);
      setForm({ ...form, name: '', amount: '', endDate: '' });
      load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item: Recurring) => {
    try {
      await api(`/api/recurring/${item.id}`, jsonInit('PATCH', { isActive: !item.isActive }));
      load();
    } catch (e) {
      setPageError(errorMessage(e));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recurring item? Past generated transactions are kept.')) return;
    try {
      await api(`/api/recurring/${id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setPageError(errorMessage(e));
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await api<{ created: number }>('/api/recurring/generate', { method: 'POST' });
      setRunResult(`Generated ${res.created} transaction${res.created === 1 ? '' : 's'}.`);
      load();
    } catch (e) {
      setPageError(errorMessage(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="px-5 md:px-10 py-8 max-w-5xl">
      <PageHeader title="Recurring">
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleRunNow} disabled={running}>
            {running ? 'Running…' : 'Run due now'}
          </Button>
          <Button onClick={() => setModalOpen(true)}>New recurring</Button>
        </div>
      </PageHeader>
      {runResult && <p className="text-sm text-success mb-4">{runResult}</p>}
      {pageError && (
        <div className="mb-4">
          <ErrorNote>{pageError}</ErrorNote>
        </div>
      )}
      <p className="text-sm text-muted mb-6">
        Subscriptions and bills generate transactions automatically on their schedule. Running twice in a row never
        creates duplicates — only occurrences that are actually due get generated.
      </p>

      <Card className="p-2 md:p-4">
        {loading ? (
          <p className="text-sm text-muted p-4">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted p-4">No recurring items yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="ledger-row flex items-center gap-3 py-3 px-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink truncate">
                  {item.name} {!item.isActive && <Badge>PAUSED</Badge>}
                </p>
                <p className="text-xs text-muted">
                  {item.frequency.toLowerCase()} · next{' '}
                  {new Date(item.nextRunDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {item.category ? ` · ${item.category.name}` : ''}
                </p>
              </div>
              <span className={`font-mono text-sm shrink-0 ${item.type === 'INCOME' ? 'text-success' : 'text-ink'}`}>
                {item.type === 'INCOME' ? '+' : '−'}
                {formatCurrency(item.amount)}
              </span>
              <button onClick={() => handleToggle(item)} className="text-xs text-muted hover:text-accent shrink-0">
                {item.isActive ? 'Pause' : 'Resume'}
              </button>
              <button onClick={() => handleDelete(item.id)} className="text-xs text-muted hover:text-danger shrink-0">
                Delete
              </button>
            </div>
          ))
        )}
      </Card>

      {modalOpen && (
        <Modal title="New recurring item" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-3">
            <label className="text-xs text-muted block">
              Name
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                maxLength={100}
                className="mt-1"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-muted">
                Amount (₹)
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  className="mt-1"
                />
              </label>
              <label className="text-xs text-muted">
                Type
                <Select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as 'EXPENSE' | 'INCOME' })}
                  className="mt-1"
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </Select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-muted">
                Frequency
                <Select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="mt-1">
                  {FREQUENCIES.map((f) => (
                    <option key={f} value={f}>
                      {f.charAt(0) + f.slice(1).toLowerCase()}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="text-xs text-muted">
                Start date
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                  className="mt-1"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-muted">
                Category
                <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="mt-1">
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="text-xs text-muted">
                End date (optional)
                <Input
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="mt-1"
                />
              </label>
            </div>
            {formError && <ErrorNote>{formError}</ErrorNote>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
