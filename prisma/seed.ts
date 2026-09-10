import { PrismaClient } from '@prisma/client';
import { DEFAULT_CATEGORIES } from '../lib/categorize';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding default categories…');

  const categories = await Promise.all(
    DEFAULT_CATEGORIES.map((c) =>
      prisma.category.upsert({
        where: { name: c.name },
        update: {},
        create: { ...c, isSystem: true },
      })
    )
  );

  const byName = (name: string) => categories.find((c) => c.name === name)!.id;

  const existingTx = await prisma.transaction.count();
  if (existingTx === 0) {
    console.log('Seeding sample transactions for the current and previous month…');
    const now = new Date();
    const sample = [
      { daysAgo: 1, description: 'BigBasket', amount: 1840, type: 'EXPENSE', category: 'Groceries' },
      { daysAgo: 2, description: 'Netflix', amount: 649, type: 'EXPENSE', category: 'Subscriptions' },
      { daysAgo: 3, description: 'Indian Oil Petrol Pump', amount: 1200, type: 'EXPENSE', category: 'Transportation' },
      { daysAgo: 5, description: 'Swiggy', amount: 420, type: 'EXPENSE', category: 'Dining' },
      { daysAgo: 6, description: 'Monthly Salary', amount: 85000, type: 'INCOME', category: 'Income' },
      { daysAgo: 8, description: 'Amazon.in', amount: 2340, type: 'EXPENSE', category: 'Shopping' },
      { daysAgo: 10, description: 'Rent', amount: 22000, type: 'EXPENSE', category: 'Housing' },
      { daysAgo: 12, description: 'Cult.fit Membership', amount: 1499, type: 'EXPENSE', category: 'Health' },
      { daysAgo: 35, description: 'DMart', amount: 2150, type: 'EXPENSE', category: 'Groceries' },
      { daysAgo: 40, description: 'Monthly Salary', amount: 85000, type: 'INCOME', category: 'Income' },
      { daysAgo: 45, description: 'Rent', amount: 22000, type: 'EXPENSE', category: 'Housing' },
    ] as const;

    for (const tx of sample) {
      const date = new Date(now);
      date.setDate(date.getDate() - tx.daysAgo);
      await prisma.transaction.create({
        data: {
          date,
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          categoryId: byName(tx.category),
          source: 'manual',
        },
      });
    }

    console.log('Seeding an example budget and recurring expense…');
    await prisma.budget.create({
      data: { categoryId: byName('Groceries'), monthlyLimit: 6000, alertAt: 80 },
    });
    await prisma.budget.create({
      data: { categoryId: byName('Dining'), monthlyLimit: 3000, alertAt: 75 },
    });

    const nextMonthRent = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await prisma.recurringExpense.create({
      data: {
        name: 'Rent',
        amount: 22000,
        type: 'EXPENSE',
        categoryId: byName('Housing'),
        frequency: 'MONTHLY',
        startDate: nextMonthRent,
        nextRunDate: nextMonthRent,
      },
    });
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
