import React from 'react';
import { Link } from 'react-router-dom';
import LatidoLogo from '../../components/branding/LatidoLogo';
import TicketCard from '../../components/ui/TicketCard';

/**
 * Ticket de formulario de autenticación.
 * Vive dentro de AuthShell (que provee el sidebar en escritorio y las transiciones direccionales).
 */
export default function AuthLayout({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Logo visible solo en móvil y tablet (<lg) */}
      <Link to="/" className="lg:hidden mb-5 sm:mb-6" aria-label="Volver al inicio de Latido">
        <LatidoLogo fontSize={26} symWidth={42} />
      </Link>

      <TicketCard className="w-full" bodyClassName="px-5 sm:px-7 py-6 sm:py-7">
        {eyebrow && (
          <span className="font-mono text-[11px] uppercase tracking-widest text-teal font-bold">{eyebrow}</span>
        )}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 break-words">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1 leading-relaxed">{subtitle}</p>}
        <div className="border-t-[1.5px] border-dashed border-line-gray my-5" />
        {children}
      </TicketCard>

      {footer && (
        <div className="mt-5 w-full px-2 font-mono text-xs text-muted text-center space-y-1 break-words">
          {footer}
        </div>
      )}

      <div className="lg:hidden mt-4 text-center">
        <Link to="/" className="font-mono text-[11px] uppercase tracking-wider text-muted hover:text-ink underline">
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
