'use client';

import { useState, FormEvent } from 'react';
import { Button, ErrorNote, Input, Select } from './ui';
import { errorMessage } from '@/lib/api';

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
  const [values, setValues] = useState({
    date: initial?.date ?? new Date().toISOString().slice(0, 10),
    description: initial?.description ?? '',
    type: (initial?.type ?? 'EXPENSE') as 'INCOME' | 'EXPENSE',
    categoryId: initial?.categoryId ?? (null as string | null),
    notes: initial?.notes ?? '',
  });
  // Kept as a string: parsing to a number on every keystroke made it
  // impossible to type "0.5" (the "0." collapsed back to an empty field).
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ ...values, amount: parsed });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-muted">
          Date
          <Input
            type="date"
            value={values.date}
            onChange={(e) => setValues({ ...values, date: e.target.value })}
            required
            className="mt-1"
          />
        </label>
        <label className="text-xs text-muted">
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

      <label className="text-xs text-muted block">
        Description
        <Input
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
          placeholder="e.g. BigBasket"
          maxLength={200}
          required
          className="mt-1"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-muted">
          Amount (₹)
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="mt-1"
          />
        </label>
        <label className="text-xs text-muted">
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

      <label className="text-xs text-muted block">
        Notes (optional)
        <Input
          value={values.notes ?? ''}
          onChange={(e) => setValues({ ...values, notes: e.target.value })}
          maxLength={1000}
          className="mt-1"
        />
      </label>

      {error && <ErrorNote>{error}</ErrorNote>}

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
