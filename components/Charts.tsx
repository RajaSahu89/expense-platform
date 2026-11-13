'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import { formatCurrency } from './ui';

const TICK = '#A3A9B1';
const GRID = 'rgba(255,255,255,0.08)';
const tooltipStyle = {
  background: 'rgba(38,40,44,0.92)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 12,
  color: '#F3F4F6',
  backdropFilter: 'blur(12px)',
};

// Compact axis labels: 85000 → ₹85k, 1200000 → ₹12L (Indian grouping).
function compact(v: number) {
  const abs = Math.abs(v);
  if (abs >= 10_000_000) return `₹${+(v / 10_000_000).toFixed(1)}Cr`;
  if (abs >= 100_000) return `₹${+(v / 100_000).toFixed(1)}L`;
  if (abs >= 1_000) return `₹${+(v / 1_000).toFixed(1)}k`;
  return `₹${v}`;
}

export function CategoryBreakdownChart({
  data,
}: {
  data: { categoryName: string; amount: number; color: string }[];
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted py-8 text-center">No expenses recorded this month yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 40, 140)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <XAxis type="number" tickFormatter={compact} tick={{ fontSize: 12, fill: TICK }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="categoryName"
          width={110}
          tick={{ fontSize: 12, fill: '#F3F4F6' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v: number) => formatCurrency(v)}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          contentStyle={tooltipStyle}
          labelStyle={{ color: '#F3F4F6' }}
          itemStyle={{ color: '#F3F4F6' }}
        />
        <Bar dataKey="amount" name="Spent" radius={[0, 8, 8, 0]} barSize={16}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendChart({
  data,
}: {
  data: { month: string; income: number; expense: number; net: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ left: 4, right: 16, top: 8, bottom: 4 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: TICK }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={compact} tick={{ fontSize: 12, fill: TICK }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(v: number) => formatCurrency(v)}
          contentStyle={tooltipStyle}
          labelStyle={{ color: '#F3F4F6' }}
          itemStyle={{ color: '#F3F4F6' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: TICK }} />
        <Line type="monotone" dataKey="income" name="Income" stroke="#5CD6A0" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="expense" name="Expense" stroke="#FF5F00" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="net" name="Net" stroke="#C7CBD1" strokeWidth={2} strokeDasharray="4 4" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
