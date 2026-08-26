import type { InputHTMLAttributes } from 'react';

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={
        'w-full rounded-lg border border-white/15 bg-slate-950/50 px-3.5 py-2.5 text-sm text-slate-100 ' +
        'placeholder:text-slate-500 outline-none transition-colors ' +
        'focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20 ' +
        className
      }
      {...rest}
    />
  );
}
