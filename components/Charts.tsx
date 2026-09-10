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

export function CategoryBreakdownChart({
  data,
}: {
  data: { categoryName: string; amount: number; color: string }[];
}) {
  if (data.length === 0) {
    return <p className="text-sm text-slate py-8 text-center">No expenses recorded this month yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 36, 120)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <XAxis type="number" tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 12, fill: '#8B98B8' }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="categoryName"
          width={110}
          tick={{ fontSize: 12, fill: '#E8EDF7' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(v: number) => formatCurrency(v)}
          cursor={{ fill: '#16233F' }}
          contentStyle={{ background: '#101828', border: '1px solid #233252', borderRadius: 6, color: '#E8EDF7' }}
          labelStyle={{ color: '#E8EDF7' }}
        />
        <Bar dataKey="amount" radius={[0, 3, 3, 0]} barSize={16}>
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
        <CartesianGrid stroke="#233252" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#8B98B8' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 12, fill: '#8B98B8' }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(v: number) => formatCurrency(v)}
          contentStyle={{ background: '#101828', border: '1px solid #233252', borderRadius: 6, color: '#E8EDF7' }}
          labelStyle={{ color: '#E8EDF7' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#8B98B8' }} />
        <Line type="monotone" dataKey="income" name="Income" stroke="#4C8DFF" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="expense" name="Expense" stroke="#FF6B6B" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="net" name="Net" stroke="#FFC24B" strokeWidth={2} strokeDasharray="4 3" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
