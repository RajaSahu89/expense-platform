'use client';

import { useState } from 'react';
import { Button, Input, Select } from './ui';

export interface Category {
  id: string;
  name: string;
}

export interface TransactionFormValues {
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  categoryId: string | null;
  notes?: string | null;
}

export default function TransactionForm({
  categories,
  initial,
  onSubmit,
  onCancel,
}: {
  categories: Category[];
  initial?: Partial<TransactionFormValues>;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<TransactionFormValues>({
    date: initial?.date ?? new Date().toISOString().slice(0, 10),
    description: initial?.description ?? '',
    amount: initial?.amount ?? 0,
    type: initial?.type ?? 'EXPENSE',
    categoryId: initial?.categoryId ?? null,
    notes: initial?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(values);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-slate">
          Date
          <Input
            type="date"
            value={values.date}
            onChange={(e) => setValues({ ...values, date: e.target.value })}
            required
            className="mt-1"
          />
        </label>
        <label className="text-xs text-slate">
          Type
          <Select
            value={values.type}
            onChange={(e) => setValues({ ...values, type: e.target.value as 'INCOME' | 'EXPENSE' })}
            className="mt-1"
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </Select>
        </label>
      </div>

      <label className="text-xs text-slate block">
        Description
        <Input
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
          placeholder="e.g. Trader Joe's"
          required
          className="mt-1"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-slate">
          Amount
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={values.amount || ''}
            onChange={(e) => setValues({ ...values, amount: parseFloat(e.target.value) || 0 })}
            required
            className="mt-1"
          />
        </label>
        <label className="text-xs text-slate">
          Category
          <Select
            value={values.categoryId ?? ''}
            onChange={(e) => setValues({ ...values, categoryId: e.target.value || null })}
            className="mt-1"
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <label className="text-xs text-slate block">
        Notes (optional)
        <Input
          value={values.notes ?? ''}
          onChange={(e) => setValues({ ...values, notes: e.target.value })}
          className="mt-1"
        />
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save transaction'}
        </Button>
      </div>
    </form>
  );
}
