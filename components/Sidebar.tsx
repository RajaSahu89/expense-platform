'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/budgets', label: 'Budgets' },
  { href: '/recurring', label: 'Recurring' },
  { href: '/import', label: 'Import CSV' },
  { href: '/analytics', label: 'Analytics' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-line bg-paper px-5 py-6 hidden md:flex md:flex-col md:justify-between">
      <div>
        <Link href="/" className="block mb-8">
          <span className="font-display text-2xl tracking-tight text-ink">Ledger</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-sm text-sm transition-colors border-l-2 ${
                  active
                    ? 'border-moss bg-mossLight text-moss font-medium'
                    : 'border-transparent text-slate hover:bg-panel hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <p className="text-xs text-slate leading-relaxed">
        Local-first personal finance tracker. Your data stays in your own database.
      </p>
    </aside>
  );
}
