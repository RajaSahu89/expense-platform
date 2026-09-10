'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Input, Select, formatCurrency } from '@/components/ui';
import Modal from '@/components/Modal';

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

  const [form, setForm] = useState({
    name: '',
    amount: '',
    type: 'EXPENSE' as 'EXPENSE' | 'INCOME',
    categoryId: '',
    frequency: 'MONTHLY',
    startDate: new Date().toISOString().slice(0, 10),
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [rRes, cRes] = await Promise.all([
      fetch('/api/recurring').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
    ]);
    setItems(rRes.recurring);
    setCategories(cRes.categories);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
        categoryId: form.categoryId || null,
      }),
    });
    setModalOpen(false);
    setForm({ ...form, name: '', amount: '' });
    load();
  };

  const handleToggle = async (item: Recurring) => {
    await fetch(`/api/recurring/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recurring expense? Past generated transactions are kept.')) return;
    await fetch(`/api/recurring/${id}`, { method: 'DELETE' });
    load();
  };

  const handleRunNow = async () => {
    setRunning(true);
    setRunResult(null);
    const res = await fetch('/api/recurring/generate', { method: 'POST' }).then((r) => r.json());
    setRunResult(`Generated ${res.created} transaction${res.created === 1 ? '' : 's'}.`);
    setRunning(false);
    load();
  };

  return (
    <div className="px-5 md:px-10 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl">Recurring</h1>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleRunNow} disabled={running}>
            {running ? 'Running…' : 'Run due now'}
          </Button>
          <Button onClick={() => setModalOpen(true)}>New recurring</Button>
        </div>
      </div>
      {runResult && <p className="text-sm text-moss mb-4">{runResult}</p>}
      <p className="text-sm text-slate mb-6">
        Subscriptions and bills generate transactions automatically on their schedule. Running twice in a row
        never creates duplicates — only occurrences that are actually due get generated.
      </p>

      <Card className="p-2 md:p-4">
        {loading ? (
          <p className="text-sm text-slate p-4">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate p-4">No recurring expenses yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="ledger-row flex items-center gap-3 py-3 px-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink truncate">
                  {item.name} {!item.isActive && <span className="text-xs text-slate">(paused)</span>}
                </p>
                <p className="text-xs text-slate">
                  {item.frequency.toLowerCase()} · next {new Date(item.nextRunDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  {item.category ? ` · ${item.category.name}` : ''}
                </p>
              </div>
              <span className={`font-mono text-sm shrink-0 ${item.type === 'INCOME' ? 'text-moss' : 'text-ink'}`}>
                {formatCurrency(item.amount)}
              </span>
              <button onClick={() => handleToggle(item)} className="text-xs text-slate hover:text-moss shrink-0">
                {item.isActive ? 'Pause' : 'Resume'}
              </button>
              <button onClick={() => handleDelete(item.id)} className="text-xs text-slate hover:text-rust shrink-0">
                Delete
              </button>
            </div>
          ))
        )}
      </Card>

      {modalOpen && (
        <Modal title="New recurring expense" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-3">
            <label className="text-xs text-slate block">
              Name
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-slate">
                Amount
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  className="mt-1"
                />
              </label>
              <label className="text-xs text-slate">
                Type
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="mt-1">
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </Select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-slate">
                Frequency
                <Select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="mt-1">
                  {FREQUENCIES.map((f) => (
                    <option key={f} value={f}>
                      {f.charAt(0) + f.slice(1).toLowerCase()}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="text-xs text-slate">
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
            <label className="text-xs text-slate block">
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
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
