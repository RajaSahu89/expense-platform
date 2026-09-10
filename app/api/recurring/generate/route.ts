import { NextResponse } from 'next/server';
import { generateDueRecurringTransactions } from '@/lib/recurring';
import { refreshAlerts } from '@/lib/alerts';

/**
 * Triggers generation of any due recurring transactions. Wire this up to
 * a daily cron (e.g. Vercel Cron hitting this route) or call it from a
 * "Run now" button in the UI. Idempotent — see lib/recurring.ts.
 */
export async function POST() {
  const created = await generateDueRecurringTransactions();
  await refreshAlerts();
  return NextResponse.json({ created: created.length, transactions: created });
}
