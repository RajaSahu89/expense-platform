import { NextRequest, NextResponse } from 'next/server';
import { generateDueRecurringTransactions } from '@/lib/recurring';
import { refreshAlerts } from '@/lib/alerts';
import { route } from '@/lib/http';

export const dynamic = 'force-dynamic';

async function run() {
  const created = await generateDueRecurringTransactions();
  await refreshAlerts();
  return NextResponse.json({ created: created.length });
}

/** "Run due now" button in the UI. Idempotent — see lib/recurring.ts. */
export const POST = route(async () => run());

/**
 * Daily schedule: Vercel Cron calls this route with GET (see vercel.json).
 * If CRON_SECRET is set, Vercel sends it as a bearer token and we require it.
 */
export const GET = route(async (req: NextRequest) => {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return run();
});
