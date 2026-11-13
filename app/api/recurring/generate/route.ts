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

export const POST = route(async () => run());
export const GET = route(async (req: NextRequest) => {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return run();
});
