'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button, Card, ErrorNote, Input, PageHeader, Select, formatCurrency } from '@/components/ui';
import Modal from '@/components/Modal';
import TransactionForm, { Category, TransactionFormValues } from '@/components/TransactionForm';
import { api, errorMessage, jsonInit } from '@/lib/api';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: { id: string; name: string; color: string } | null;
  notes?: string | null;
}

const PAGE_SIZE = 25;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    api<{ categories: Category[] }>('/api/categories')
      .then((r) => setCategories(r.categories))
      .catch((e) => setError(errorMessage(e)));
  }, []);
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, typeFilter]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (search) params.set('q', search);
    if (categoryFilter) params.set('categoryId', categoryFilter);
    if (typeFilter) params.set('type', typeFilter);

    setLoading(true);
    const t = setTimeout(() => {
      api<{ transactions: Transaction[]; total: number }>(`/api/transactions?${params.toString()}`)
        .then((r) => {
          if (cancelled) return;
          setTransactions(r.transactions);
          setTotal(r.total);
          setError('');
        })
        .catch((e) => !cancelled && setError(errorMessage(e)))
        .finally(() => !cancelled && setLoading(false));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, categoryFilter, typeFilter, page, reloadKey]);

  const handleCreate = async (values: TransactionFormValues) => {
    await api('/api/transactions', jsonInit('POST', values));
    setModalOpen(false);
    reload();
  };

  const handleUpdate = async (values: TransactionFormValues) => {
    if (!editing) return;
    await api(`/api/transactions/${editing.id}`, jsonInit('PATCH', values));
    setEditing(null);
    reload();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api(`/api/transactions/${id}`, { method: 'DELETE' });
      if (transactions.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="px-5 md:px-10 py-8 max-w-5xl">
      <PageHeader title="Transactions">
        <Button onClick={() => setModalOpen(true)}>Add transaction</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <Input
          placeholder="Search description or notes…"
          aria-label="Search transactions"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select aria-label="Filter by category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          <option value="none">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Filter by type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Income &amp; expense</option>
          <option value="INCOME">Income only</option>
          <option value="EXPENSE">Expense only</option>
        </Select>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      <Card className="p-2 md:p-4">
        {loading ? (
          <p className="text-sm text-muted p-4">Loading…</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted p-4">No transactions match these filters.</p>
        ) : (
          transactions.map((t) => (
            <div key={t.id} className="ledger-row flex items-center gap-3 py-3 px-2">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: t.category?.color ?? '#5A6068' }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink truncate">{t.description}</p>
                <p className="text-xs text-muted">
                  {new Date(t.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {t.category ? ` · ${t.category.name}` : ' · Uncategorized'}
                </p>
              </div>
              <span className={`font-mono text-sm shrink-0 ${t.type === 'INCOME' ? 'text-success' : 'text-ink'}`}>
                {t.type === 'INCOME' ? '+' : '−'}
                {formatCurrency(t.amount)}
              </span>
              <button onClick={() => setEditing(t)} className="text-xs text-muted hover:text-accent shrink-0">
                Edit
              </button>
              <button onClick={() => handleDelete(t.id)} className="text-xs text-muted hover:text-danger shrink-0">
                Delete
              </button>
            </div>
          ))
        )}
      </Card>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted">
            Page {page} of {totalPages} · {total} transactions
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

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
