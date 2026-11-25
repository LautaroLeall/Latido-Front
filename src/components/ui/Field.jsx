import React from 'react';

/**
 * Campo de formulario con etiqueta mono, borde duro y mensaje de ayuda/error.
 * Uso: <Field label="Email" id="email" type="email" value={v} onChange={...} error="..." />
 */
export default function Field({
  label,
  id,
  as = 'input',
  hint,
  error,
  className = '',
  children,
  ...props
}) {
  const Component = as;
  const isSelect = as === 'select';
  const base =
    'w-full max-w-full min-w-0 min-h-[44px] bg-paper text-ink border-[1.5px] px-3 py-2.5 text-base sm:text-sm rounded-none outline-none transition-shadow ' +
    'focus:border-teal focus:shadow-[2px_2px_0px_#1F6F64] disabled:opacity-60 disabled:cursor-not-allowed' +
    (isSelect ? ' cursor-pointer' : '');
  const border = error ? 'border-alert-red' : 'border-ink';

  return (
    <div className={`min-w-0 ${className}`}>
      {label && (
        <label htmlFor={id} className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1">
          {label}
        </label>
      )}
      <Component
        id={id}
        className={`${base} ${border}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error || hint ? `${id}-help` : undefined}
        {...props}
      >
        {children}
      </Component>
      {(error || hint) && (
        <p id={`${id}-help`} className={`mt-1 text-xs ${error ? 'text-alert-red' : 'text-muted'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
