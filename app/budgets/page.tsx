'use client';

import { useCallback, useEffect, useState, FormEvent } from 'react';
import { Button, Card, ErrorNote, Input, PageHeader, Select, formatCurrency } from '@/components/ui';
import Modal from '@/components/Modal';
import { api, errorMessage, jsonInit } from '@/lib/api';

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
  const [pageError, setPageError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const [bRes, cRes] = await Promise.all([
        api<{ budgets: Budget[] }>('/api/budgets'),
        api<{ categories: Category[] }>('/api/categories'),
      ]);
      setBudgets(bRes.budgets);
      setCategories(cRes.categories);
    } catch (e) {
      setPageError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const availableCategories = categories.filter((c) => !budgets.some((b) => b.categoryId === c.id));

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api(
        '/api/budgets',
        jsonInit('POST', {
          categoryId,
          monthlyLimit: parseFloat(limit),
          alertAt: parseInt(alertAt, 10) || 80,
        })
      );
      setModalOpen(false);
      setCategoryId('');
      setLimit('');
      setAlertAt('80');
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return;
    try {
      await api(`/api/budgets/${id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setPageError(errorMessage(e));
    }
  };

  return (
    <div className="px-5 md:px-10 py-8 max-w-5xl">
      <PageHeader title="Budgets">
        <Button onClick={() => setModalOpen(true)}>New budget</Button>
      </PageHeader>

      {pageError && (
        <div className="mb-5">
          <ErrorNote>{pageError}</ErrorNote>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : budgets.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted">No budgets yet. Set a monthly limit for a category to start tracking.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const over = b.percentUsed >= 100;
            const warning = b.percentUsed >= b.alertAt;
            const barColor = over ? 'bg-danger' : warning ? 'bg-warn' : 'bg-accent';
            return (
              <Card key={b.id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-ink flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.category.color }} />
                    {b.category.name}
                  </h3>
                  <button onClick={() => handleDelete(b.id)} className="text-xs text-muted hover:text-danger">
                    Remove
                  </button>
                </div>
                <p className="font-mono text-sm text-muted mb-3">
                  {formatCurrency(b.spent)} of {formatCurrency(b.monthlyLimit)}
                </p>
                <div
                  className="h-2 rounded-full bg-steel/40 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Math.round(Math.min(b.percentUsed, 100))}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${Math.min(b.percentUsed, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted mt-2">
                  {over ? `Over by ${formatCurrency(b.spent - b.monthlyLimit)}` : `${formatCurrency(b.remaining)} remaining`}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <Modal title="New budget" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-3">
            <label className="text-xs text-muted block">
              Category
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="mt-1">
                <option value="">{availableCategories.length ? 'Select a category' : 'Every category has a budget'}</option>
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-xs text-muted block">
              Monthly limit (₹)
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="1"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                required
                className="mt-1"
              />
            </label>
            <label className="text-xs text-muted block">
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
            {error && <ErrorNote>{error}</ErrorNote>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Creating…' : 'Create budget'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
