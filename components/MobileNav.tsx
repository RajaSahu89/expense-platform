'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/budgets', label: 'Budgets' },
  { href: '/recurring', label: 'Recurring' },
  { href: '/import', label: 'Import' },
  { href: '/analytics', label: 'Analytics' },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden sticky top-0 z-30 glass rounded-none border-x-0 border-t-0">
      <div className="flex items-center gap-2.5 px-4 pt-3">
        <span className="grid place-items-center h-7 w-7 rounded-lg bg-accent text-paper font-display font-bold text-sm">
          L
        </span>
        <span className="font-display text-lg font-semibold">Ledger</span>
      </div>
      <nav className="flex gap-1 px-3 py-2 overflow-x-auto">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm ${
                active ? 'bg-accentSoft text-accent font-medium ring-1 ring-accent/30' : 'text-muted'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
