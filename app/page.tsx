'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, ErrorNote, formatCurrency } from '@/components/ui';
import AlertBanner, { AlertItem } from '@/components/AlertBanner';
import { CategoryBreakdownChart } from '@/components/Charts';
import { api, errorMessage, jsonInit } from '@/lib/api';

interface Summary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
  breakdown: { categoryId: string | null; categoryName: string; color: string; amount: number }[];
  recentTransactions: {
    id: string;
    description: string;
    date: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: { name: string } | null;
  }[];
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([api<Summary>('/api/analytics/summary'), api<{ alerts: AlertItem[] }>('/api/alerts')])
      .then(([s, a]) => {
        if (cancelled) return;
        setSummary(s);
        setAlerts(a.alerts);
      })
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = useCallback(async (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
    try {
      await api('/api/alerts', jsonInit('PATCH', { id }));
    } catch {
      /* the optimistic update is harmless; it'll reappear on next load if it failed */
    }
  }, []);

  const monthLabel = summary
    ? new Date(`${summary.month}-15T12:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="px-5 md:px-10 py-8 max-w-5xl">
      {error && (
        <div className="mb-6">
          <ErrorNote>
            Couldn&apos;t load your data: {error}. Check that <code>DATABASE_URL</code> in <code>.env</code> is
            correct and the database tables exist (<code>npm run db:push</code>).
          </ErrorNote>
        </div>
      )}

      <p className="text-sm text-muted mb-1">{monthLabel || '\u00A0'}</p>
      <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-ink mb-8">
        {loading || !summary ? '—' : formatCurrency(summary.net)}
        <span className="text-lg text-muted font-sans font-normal ml-3">net this month</span>
      </h1>

      {!loading && <AlertBanner alerts={alerts} onDismiss={dismiss} />}

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-muted mb-1">Income</p>
          <p className="font-mono text-xl md:text-2xl text-success">
            {loading || !summary ? '—' : formatCurrency(summary.totalIncome)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-muted mb-1">Expenses</p>
          <p className="font-mono text-xl md:text-2xl text-accent">
            {loading || !summary ? '—' : formatCurrency(summary.totalExpense)}
          </p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="font-display text-lg font-semibold mb-4">Spending by category</h2>
          {!loading && summary && <CategoryBreakdownChart data={summary.breakdown} />}
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-lg font-semibold mb-4">Recent activity</h2>
          <div>
            {!loading &&
              summary?.recentTransactions.map((t) => (
                <div key={t.id} className="ledger-row flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm text-ink truncate">{t.description}</p>
                    <p className="text-xs text-muted">
                      {new Date(t.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      {t.category ? ` · ${t.category.name}` : ''}
                    </p>
                  </div>
                  <span
                    className={`font-mono text-sm shrink-0 ml-3 ${t.type === 'INCOME' ? 'text-success' : 'text-ink'}`}
                  >
                    {t.type === 'INCOME' ? '+' : '−'}
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            {!loading && summary?.recentTransactions.length === 0 && (
              <p className="text-sm text-muted py-4">No transactions yet — add one to get started.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
