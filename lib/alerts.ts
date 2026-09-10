import { prisma } from './prisma';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

/**
 * Recomputes alerts for the current month: budget threshold breaches and
 * simple unusual-spending detection (a category running well above its
 * trailing 3-month average). Call this after any transaction mutation
 * (create/update/delete/import) or on a schedule.
 */
export async function refreshAlerts(now: Date = new Date()) {
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const budgets = await prisma.budget.findMany({ include: { category: true } });

  const spendByCategory = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { type: 'EXPENSE', date: { gte: monthStart, lte: monthEnd } },
    _sum: { amount: true },
  });
  const spendMap = new Map(spendByCategory.map((s) => [s.categoryId, s._sum.amount ?? 0]));

  const newAlerts: Array<{
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    title: string;
    message: string;
    entityType: string;
    entityId: string;
  }> = [];

  for (const budget of budgets) {
    const spent = spendMap.get(budget.categoryId) ?? 0;
    const pct = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0;

    if (pct >= 100) {
      newAlerts.push({
        severity: 'CRITICAL',
        title: `${budget.category.name} budget exceeded`,
        message: `You've spent ₹${spent.toFixed(2)} of your ₹${budget.monthlyLimit.toFixed(2)} ${budget.category.name} budget (${pct.toFixed(0)}%).`,
        entityType: 'budget',
        entityId: budget.id,
      });
    } else if (pct >= budget.alertAt) {
      newAlerts.push({
        severity: 'WARNING',
        title: `${budget.category.name} budget at ${pct.toFixed(0)}%`,
        message: `You've spent ₹${spent.toFixed(2)} of your ₹${budget.monthlyLimit.toFixed(2)} ${budget.category.name} budget.`,
        entityType: 'budget',
        entityId: budget.id,
      });
    }
  }

  // Unusual spending: compare this month's spend per category against the
  // trailing 3-month average; flag categories running >50% hot.
  const threeMonthsAgo = startOfMonth(subMonths(now, 3));
  const trailing = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { type: 'EXPENSE', date: { gte: threeMonthsAgo, lt: monthStart } },
    _sum: { amount: true },
  });
  const categories = await prisma.category.findMany();
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  for (const row of trailing) {
    if (!row.categoryId) continue;
    const avg = (row._sum.amount ?? 0) / 3;
    const current = spendMap.get(row.categoryId) ?? 0;
    if (avg > 20 && current > avg * 1.5) {
      newAlerts.push({
        severity: 'INFO',
        title: `${categoryName.get(row.categoryId) ?? 'A category'} spending is up`,
        message: `This month's spending (₹${current.toFixed(2)}) is running well above your recent 3-month average (₹${avg.toFixed(2)}).`,
        entityType: 'transaction',
        entityId: row.categoryId,
      });
    }
  }

  // Avoid duplicate alerts: skip any whose title already has an unread
  // entry created today.
  const existingToday = await prisma.alert.findMany({
    where: { createdAt: { gte: monthStart }, isRead: false },
  });
  const existingTitles = new Set(existingToday.map((a) => a.title));

  const toCreate = newAlerts.filter((a) => !existingTitles.has(a.title));
  if (toCreate.length) {
    await prisma.alert.createMany({ data: toCreate });
  }

  return toCreate;
}
