import React from 'react';

/**
 * Tarjeta de métrica del panel (número grande + etiqueta mono)
 */
export function StatCard({ label, value, suffix, tone = 'ink', badge, footer, loading = false }) {
  const tones = {
    ink: 'text-ink',
    teal: 'text-teal',
    red: 'text-alert-red',
    amber: 'text-amber-ink'
  };
  return (
    <div className="bg-paper border border-line-gray p-3.5 sm:p-4 shadow-hard-line min-w-0 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-muted text-[10.5px] sm:text-[11px] uppercase tracking-wider leading-tight">{label}</span>
          {badge && (
            <span className="bg-amber/20 text-amber-ink font-mono text-[9px] px-1 font-bold">{badge}</span>
          )}
        </div>
        <div className={`text-2xl sm:text-3xl font-bold tracking-tight mt-1 truncate tabular-nums ${tones[tone] || tones.ink}`}>
          {loading ? <span className="inline-block w-12 h-7 bg-paper-dim animate-pulse align-middle" /> : value}
          {!loading && suffix && <small className="text-xs sm:text-sm text-muted font-normal ml-1">{suffix}</small>}
        </div>
      </div>
      {!loading && footer && <div className="mt-2 pt-1.5 border-t border-dashed border-line-gray/80">{footer}</div>}
    </div>
  );
}

/**
 * Estrellas en texto (★★★☆☆)
 */
export function StarsText({ value, className = '' }) {
  const n = Math.max(0, Math.min(5, Math.round(value || 0)));
  return (
    <span className={`text-amber font-mono font-bold tracking-widest ${className}`} aria-label={`${n} de 5 estrellas`}>
      {'★'.repeat(n)}{'☆'.repeat(5 - n)}
    </span>
  );
}

/**
 * Estado vacío con borde punteado
 */
export function EmptyState({ title, children }) {
  return (
    <div className="text-center p-8 bg-paper border border-dashed border-line-gray">
      {title && <p className="font-bold text-sm">{title}</p>}
      {children && <p className="text-muted text-sm mt-1">{children}</p>}
    </div>
  );
}

/**
 * Encabezado de sección mono
 */
export function SectionLabel({ children, right }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
      <span className="font-mono text-muted text-xs uppercase tracking-wider">{children}</span>
      {right}
    </div>
  );
}
