'use client';

import { useEffect, useState } from 'react';
import { Card, formatCurrency } from '@/components/ui';
import { TrendChart, CategoryBreakdownChart } from '@/components/Charts';

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

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics/trends?months=6').then((r) => r.json()),
      fetch('/api/analytics/summary').then((r) => r.json()),
    ]).then(([t, s]) => {
      setTrends(t.series);
      setSummary(s);
      setLoading(false);
    });
  }, []);

  const avgExpense = trends.length ? trends.reduce((a, b) => a + b.expense, 0) / trends.length : 0;

  return (
    <div className="px-5 md:px-10 py-8 max-w-5xl">
      <h1 className="font-display text-3xl mb-6">Analytics</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-slate mb-1">This month, net</p>
          <p className="font-mono text-xl">{loading ? '—' : formatCurrency(summary!.net)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-slate mb-1">6-month avg expense</p>
          <p className="font-mono text-xl">{loading ? '—' : formatCurrency(avgExpense)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-slate mb-1">Top category</p>
          <p className="font-mono text-xl">
            {loading || !summary?.breakdown.length ? '—' : summary.breakdown[0].categoryName}
          </p>
        </Card>
      </div>

      <Card className="p-5 mb-6">
        <h2 className="font-display text-lg mb-4">Income vs. expense, last 6 months</h2>
        {!loading && <TrendChart data={trends} />}
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-lg mb-4">This month by category</h2>
        {!loading && summary && <CategoryBreakdownChart data={summary.breakdown} />}
      </Card>
    </div>
  );
}
