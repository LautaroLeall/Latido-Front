import React from 'react';

/**
 * Mensaje en línea (error, éxito, aviso o info) con borde izquierdo de color.
 */
export default function Alert({ variant = 'info', title, children, className = '' }) {
  const styles = {
    error: 'border-alert-red bg-alert-red/5 text-alert-red',
    success: 'border-teal bg-teal/5 text-teal',
    warning: 'border-amber bg-amber/10 text-amber-ink',
    info: 'border-ink bg-paper-dim text-ink'
  };

  if (!children && !title) return null;

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`border-l-4 border-y border-r border-y-line-gray border-r-line-gray px-3 py-2.5 text-sm ${styles[variant] || styles.info} ${className}`}
    >
      {title && <strong className="block font-mono text-[11px] uppercase tracking-wider mb-0.5">{title}</strong>}
      <div className="leading-snug">{children}</div>
    </div>
  );
}
