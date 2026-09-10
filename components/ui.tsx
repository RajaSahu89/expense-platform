import { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-panel border border-line rounded shadow-panel ${className}`}>{children}</div>
  );
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: 'bg-moss text-white hover:bg-moss/90',
    secondary: 'bg-mossLight text-moss hover:bg-mossLight/70',
    ghost: 'bg-transparent text-slate hover:bg-panel border border-line',
    danger: 'bg-rustLight text-rust hover:bg-rustLight/70',
  } as const;

  return (
    <button
      className={`px-3.5 py-2 rounded-sm text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'moss' | 'rust' | 'gold' }) {
  const tones = {
    neutral: 'bg-line text-slate',
    moss: 'bg-mossLight text-moss',
    rust: 'bg-rustLight text-rust',
    gold: 'bg-goldLight text-gold',
  } as const;
  return <span className={`inline-block px-2 py-0.5 rounded-sm text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-line rounded-sm px-3 py-2 text-sm bg-panel focus:border-moss ${props.className ?? ''}`}
    />
  );
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full border border-line rounded-sm px-3 py-2 text-sm bg-panel focus:border-moss ${props.className ?? ''}`}
    >
      {children}
    </select>
  );
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}
