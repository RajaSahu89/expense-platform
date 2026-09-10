'use client';

import { useEffect, useState } from 'react';
import { Card, formatCurrency } from '@/components/ui';
import AlertBanner, { AlertItem } from '@/components/AlertBanner';
import { CategoryBreakdownChart } from '@/components/Charts';

interface Summary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
  breakdown: { categoryId: string | null; categoryName: string; color: string; amount: number }[];
  recentTransactions: any[];
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics/summary').then((r) => r.json()),
      fetch('/api/alerts').then((r) => r.json()),
    ]).then(([s, a]) => {
      setSummary(s);
      setAlerts(a.alerts);
      setLoading(false);
    });
  }, []);

  const monthLabel = summary
    ? new Date(`${summary.month}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="px-5 md:px-10 py-8 max-w-5xl">
      <p className="text-sm text-slate mb-1">{monthLabel}</p>
      <h1 className="font-display text-4xl md:text-5xl text-ink mb-8">
        {loading ? '—' : formatCurrency(summary!.net)}
        <span className="text-lg text-slate font-sans ml-3">net this month</span>
      </h1>

      {!loading && <AlertBanner alerts={alerts} />}

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-slate mb-1">Income</p>
          <p className="font-mono text-2xl text-moss">
            {loading ? '—' : formatCurrency(summary!.totalIncome)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-slate mb-1">Expenses</p>
          <p className="font-mono text-2xl text-rust">
            {loading ? '—' : formatCurrency(summary!.totalExpense)}
          </p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="font-display text-lg mb-4">Spending by category</h2>
          {!loading && summary && <CategoryBreakdownChart data={summary.breakdown} />}
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-lg mb-4">Recent activity</h2>
          <div>
            {!loading &&
              summary?.recentTransactions.map((t) => (
                <div key={t.id} className="ledger-row flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm text-ink truncate">{t.description}</p>
                    <p className="text-xs text-slate">
                      {new Date(t.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      {t.category ? ` · ${t.category.name}` : ''}
                    </p>
                  </div>
                  <span
                    className={`font-mono text-sm shrink-0 ml-3 ${
                      t.type === 'INCOME' ? 'text-moss' : 'text-ink'
                    }`}
                  >
                    {t.type === 'INCOME' ? '+' : '−'}
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            {!loading && summary?.recentTransactions.length === 0 && (
              <p className="text-sm text-slate py-4">No transactions yet — add one to get started.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
