import React from 'react';

/**
 * Botón con borde cero (corte a guillotina) y sombra dura física.
 * - `as="a"` lo renderiza como enlace con el mismo estilo (evita <button> dentro de <a>).
 * - type="button" por defecto: nunca envía un formulario por accidente.
 */
export default function HardButton({
  variant = 'primary', // 'primary' | 'secondary' | 'teal' | 'danger'
  size = 'md',        // 'sm' | 'md'
  as = 'button',
  type = 'button',
  disabled = false,
  children,
  className = '',
  ...props
}) {
  const sizeClasses = {
    sm: 'min-h-[36px] px-3 text-[11px]',
    md: 'min-h-[44px] px-4 text-[12.5px]'
  };

  const variantClasses = {
    primary: 'bg-ink text-paper border-ink shadow-hard-teal hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_#1F6F64]',
    secondary: 'bg-transparent text-ink border-ink hover:bg-paper-dim',
    teal: 'bg-teal text-paper border-teal shadow-hard-ink hover:brightness-105',
    danger: 'bg-transparent text-alert-red border-alert-red hover:bg-alert-red/10'
  };

  const classes = `font-mono font-bold uppercase tracking-wider border-[1.5px] rounded-none inline-flex items-center justify-center gap-2 transition-all duration-75 text-center cursor-pointer select-none disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`;

  if (as !== 'button') {
    const Component = as;
    return (
      <Component className={classes} aria-disabled={disabled || undefined} {...props}>
        {children}
      </Component>
    );
  }

  return (
    <button type={type} disabled={disabled} className={classes} {...props}>
      {children}
    </button>
  );
}
