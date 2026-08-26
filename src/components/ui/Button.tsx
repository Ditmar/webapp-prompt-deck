import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium ' +
  'transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

const variants: Record<Variant, string> = {
  primary:
    'bg-indigo-500 text-white shadow-sm shadow-indigo-950/40 hover:bg-indigo-400 active:bg-indigo-600',
  secondary:
    'border border-white/15 text-slate-200 hover:bg-white/10 hover:border-white/25 active:bg-white/5',
  danger:
    'border border-red-500/25 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 active:bg-red-500/15',
  ghost: 'text-slate-300 hover:bg-white/10 hover:text-white',
};

const sizes: Record<Size, string> = {
  sm: 'text-xs px-2.5 py-1.5',
  md: 'text-sm px-3.5 py-2',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
  className?: string;
}

function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ');
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...rest
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </a>
  );
}
