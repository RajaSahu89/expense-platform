'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Input, Select, formatCurrency } from '@/components/ui';
import Modal from '@/components/Modal';

interface Budget {
  id: string;
  categoryId: string;
  category: { name: string; color: string };
  monthlyLimit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  alertAt: number;
}

interface Category {
  id: string;
  name: string;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [limit, setLimit] = useState('');
  const [alertAt, setAlertAt] = useState('80');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [bRes, cRes] = await Promise.all([
      fetch('/api/budgets').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
    ]);
    setBudgets(bRes.budgets);
    setCategories(cRes.categories);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const availableCategories = categories.filter((c) => !budgets.some((b) => b.categoryId === c.id));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId,
        monthlyLimit: parseFloat(limit),
        alertAt: parseInt(alertAt, 10),
      }),
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? 'Something went wrong');
      return;
    }
    setModalOpen(false);
    setCategoryId('');
    setLimit('');
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return;
    await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="px-5 md:px-10 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">Budgets</h1>
        <Button onClick={() => setModalOpen(true)}>New budget</Button>
      </div>

      {loading ? (
        <p className="text-sm text-slate">Loading…</p>
      ) : budgets.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate">No budgets yet. Set a monthly limit for a category to start tracking.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const over = b.percentUsed >= 100;
            const warning = b.percentUsed >= b.alertAt;
            const barColor = over ? 'bg-rust' : warning ? 'bg-gold' : 'bg-moss';
            return (
              <Card key={b.id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-ink">{b.category.name}</h3>
                  <button onClick={() => handleDelete(b.id)} className="text-xs text-slate hover:text-rust">
                    Remove
                  </button>
                </div>
                <p className="font-mono text-sm text-slate mb-2">
                  {formatCurrency(b.spent)} <span className="text-slate">of</span> {formatCurrency(b.monthlyLimit)}
                </p>
                <div className="h-2 rounded-full bg-line overflow-hidden">
                  <div
                    className={`h-full ${barColor}`}
                    style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate mt-2">
                  {over
                    ? `Over by ${formatCurrency(b.spent - b.monthlyLimit)}`
                    : `${formatCurrency(b.remaining)} remaining`}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <Modal title="New budget" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-3">
            <label className="text-xs text-slate block">
              Category
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="mt-1">
                <option value="">Select a category</option>
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-xs text-slate block">
              Monthly limit
              <Input
                type="number"
                step="0.01"
                min="1"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                required
                className="mt-1"
              />
            </label>
            <label className="text-xs text-slate block">
              Alert threshold (% of limit)
              <Input
                type="number"
                min="1"
                max="100"
                value={alertAt}
                onChange={(e) => setAlertAt(e.target.value)}
                className="mt-1"
              />
            </label>
            {error && <p className="text-sm text-rust">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create budget</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
