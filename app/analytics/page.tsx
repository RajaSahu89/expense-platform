'use client';

import { useEffect, useState } from 'react';
import { Card, ErrorNote, PageHeader, formatCurrency } from '@/components/ui';
import { TrendChart, CategoryBreakdownChart } from '@/components/Charts';
import { api, errorMessage } from '@/lib/api';

interface TrendPoint {
  month: string;
  income: number;
  expense: number;
  net: number;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  net: number;
  breakdown: { categoryName: string; amount: number; color: string }[];
}

export default function AnalyticsPage() {
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api<{ series: TrendPoint[] }>('/api/analytics/trends?months=6'),
      api<Summary>('/api/analytics/summary'),
    ])
      .then(([t, s]) => {
        if (cancelled) return;
        setTrends(t.series);
        setSummary(s);
      })
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const avgExpense = trends.length ? trends.reduce((a, b) => a + b.expense, 0) / trends.length : 0;

  return (
    <div className="px-5 md:px-10 py-8 max-w-5xl">
      <PageHeader title="Analytics" />
      {error && (
        <div className="mb-6">
          <ErrorNote>Couldn&apos;t load analytics: {error}</ErrorNote>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-muted mb-1">This month, net</p>
          <p className="font-mono text-xl">{loading || !summary ? '—' : formatCurrency(summary.net)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-muted mb-1">6-month avg expense</p>
          <p className="font-mono text-xl">{loading || error ? '—' : formatCurrency(avgExpense)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wider text-muted mb-1">Top category</p>
          <p className="font-mono text-xl truncate">
            {loading || !summary?.breakdown.length ? '—' : summary.breakdown[0].categoryName}
          </p>
        </Card>
      </div>

      <Card className="p-5 mb-6">
        <h2 className="font-display text-lg font-semibold mb-4">Income vs. expense, last 6 months</h2>
        {!loading && !error && <TrendChart data={trends} />}
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold mb-4">This month by category</h2>
        {!loading && summary && <CategoryBreakdownChart data={summary.breakdown} />}
      </Card>
    </div>
  );
}
