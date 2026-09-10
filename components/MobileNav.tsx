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
    <div className="md:hidden sticky top-0 z-10 bg-paper border-b border-line">
      <div className="flex items-center px-4 py-3">
        <span className="font-display text-xl">Ledger</span>
      </div>
      <nav className="flex gap-1 px-3 pb-2 overflow-x-auto">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 px-3 py-1.5 rounded-sm text-sm ${
                active ? 'bg-mossLight text-moss font-medium' : 'text-slate'
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
