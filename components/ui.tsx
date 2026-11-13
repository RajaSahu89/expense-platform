import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, forwardRef } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-2xl ${className}`}>{children}</div>;
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
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: 'bg-accent text-paper font-semibold shadow-glow hover:brightness-110 active:brightness-95',
    secondary: 'bg-accentSoft text-accent border border-accent/30 hover:bg-accent/25',
    ghost: 'glass-subtle text-ink/85 hover:text-ink hover:bg-white/10',
    danger: 'bg-dangerSoft text-danger border border-danger/25 hover:bg-danger/20',
  } as const;

  return (
    <button
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'danger' | 'warn' | 'success';
}) {
  const tones = {
    neutral: 'bg-steel/40 text-muted',
    accent: 'bg-accentSoft text-accent',
    danger: 'bg-dangerSoft text-danger',
    warn: 'bg-warnSoft text-warn',
    success: 'bg-successSoft text-success',
  } as const;
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = '', ...props },
  ref
) {
  return <input ref={ref} {...props} className={`glass-input w-full rounded-xl px-3.5 py-2.5 text-sm ${className}`} />;
});

export function Select({ children, className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`glass-input w-full rounded-xl px-3.5 py-2.5 text-sm ${className}`}>
      {children}
    </select>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-danger/30 bg-dangerSoft px-4 py-3 text-sm text-danger"
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
      {children}
    </div>
  );
}

export function formatCurrency(amount: number): string {
  return (amount ?? 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}
