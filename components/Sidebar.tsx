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
    <aside className="hidden md:flex md:flex-col md:justify-between w-60 shrink-0 sticky top-4 m-4 mr-0 h-[calc(100vh-2rem)] glass rounded-2xl px-4 py-6">
      <div>
        <Link href="/" className="flex items-center gap-3 mb-8 px-2">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-accent text-paper font-display font-bold shadow-glow">
            L
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-ink">Ledger</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? 'bg-accentSoft text-accent font-medium ring-1 ring-accent/30'
                    : 'text-muted hover:bg-white/[0.07] hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <p className="text-xs text-muted/80 leading-relaxed px-2">
        Personal finance tracker. Your data stays in your own Neon database.
      </p>
    </aside>
  );
}
