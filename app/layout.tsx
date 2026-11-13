import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';

export const metadata: Metadata = {
  title: 'Ledger — Personal Finance',
  description: 'Transactions, budgets, recurring expenses, and spending analytics.',
};

export const viewport: Viewport = {
  themeColor: '#1C1D20',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0">
            <MobileNav />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
