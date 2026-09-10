'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button, Card, Input, Select, formatCurrency } from '@/components/ui';
import Modal from '@/components/Modal';
import TransactionForm, { Category, TransactionFormValues } from '@/components/TransactionForm';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: { id: string; name: string; color: string } | null;
  notes?: string | null;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (categoryFilter) params.set('categoryId', categoryFilter);
    if (typeFilter) params.set('type', typeFilter);

    const [txRes, catRes] = await Promise.all([
      fetch(`/api/transactions?${params.toString()}`).then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
    ]);
    setTransactions(txRes.transactions);
    setCategories(catRes.categories);
    setLoading(false);
  }, [search, categoryFilter, typeFilter]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search/filter changes
    return () => clearTimeout(t);
  }, [load]);

  const handleCreate = async (values: TransactionFormValues) => {
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    setModalOpen(false);
    load();
  };

  const handleUpdate = async (values: TransactionFormValues) => {
    if (!editing) return;
    await fetch(`/api/transactions/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="px-5 md:px-10 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">Transactions</h1>
        <Button onClick={() => setModalOpen(true)}>Add transaction</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <Input placeholder="Search description…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Income &amp; expense</option>
          <option value="INCOME">Income only</option>
          <option value="EXPENSE">Expense only</option>
        </Select>
      </div>

      <Card className="p-2 md:p-4">
        {loading ? (
          <p className="text-sm text-slate p-4">Loading…</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-slate p-4">No transactions match these filters.</p>
        ) : (
          transactions.map((t) => (
            <div key={t.id} className="ledger-row flex items-center gap-3 py-3 px-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink truncate">{t.description}</p>
                <p className="text-xs text-slate">
                  {new Date(t.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {t.category ? ` · ${t.category.name}` : ' · Uncategorized'}
                </p>
              </div>
              <span className={`font-mono text-sm shrink-0 ${t.type === 'INCOME' ? 'text-moss' : 'text-ink'}`}>
                {t.type === 'INCOME' ? '+' : '−'}
                {formatCurrency(t.amount)}
              </span>
              <button
                onClick={() => setEditing(t)}
                className="text-xs text-slate hover:text-moss shrink-0"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(t.id)}
                className="text-xs text-slate hover:text-rust shrink-0"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </Card>

      {modalOpen && (
        <Modal title="Add transaction" onClose={() => setModalOpen(false)}>
          <TransactionForm categories={categories} onSubmit={handleCreate} onCancel={() => setModalOpen(false)} />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit transaction" onClose={() => setEditing(null)}>
          <TransactionForm
            categories={categories}
            initial={{
              date: editing.date.slice(0, 10),
              description: editing.description,
              amount: editing.amount,
              type: editing.type,
              categoryId: editing.category?.id ?? null,
              notes: editing.notes,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  );
}
