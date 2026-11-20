import React from 'react';

/**
 * Sello de tinta rotado (-2deg) en fuente mono con tracking amplio
 */
export default function Stamp({
  variant = 'ink', // 'teal' | 'red' | 'amber' | 'ink'
  children,
  className = ''
}) {
  const variantClasses = {
    teal: 'text-teal border-teal bg-teal/10',
    red: 'text-alert-red border-alert-red bg-alert-red/10',
    amber: 'text-amber-ink border-amber bg-amber/15',
    ink: 'text-muted border-line-gray bg-transparent'
  };

  return (
    <span
      className={`inline-block font-mono font-bold text-[11px] leading-none uppercase tracking-wider px-2 py-1 border-[1.5px] -rotate-2 whitespace-nowrap select-none ${variantClasses[variant] || variantClasses.ink} ${className}`}
    >
      {children}
    </span>
  );
}
