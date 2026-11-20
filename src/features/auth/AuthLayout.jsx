import React from 'react';
import { Link } from 'react-router-dom';
import LatidoLogo from '../../components/branding/LatidoLogo';
import TicketCard from '../../components/ui/TicketCard';

/**
 * Layout común de las pantallas de autenticación: ticket centrado con la marca.
 */
export default function AuthLayout({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <Link to="/" className="mb-6" aria-label="Volver al inicio de Latido">
        <LatidoLogo fontSize={26} symWidth={42} />
      </Link>

      <TicketCard className="w-full max-w-[420px]" bodyClassName="px-6 py-6">
        {eyebrow && (
          <span className="font-mono text-[11px] uppercase tracking-widest text-teal font-bold">{eyebrow}</span>
        )}
        <h1 className="text-2xl font-bold tracking-tight mt-1">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1 leading-relaxed">{subtitle}</p>}
        <div className="border-t-[1.5px] border-dashed border-line-gray my-5" />
        {children}
      </TicketCard>

      {footer && <div className="mt-5 font-mono text-xs text-muted text-center space-y-1">{footer}</div>}
    </div>
  );
}
