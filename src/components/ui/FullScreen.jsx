import React from 'react';
import LatidoSymbol from '../branding/LatidoSymbol';
import TicketCard from './TicketCard';
import Stamp from './Stamp';

/**
 * Pantalla completa centrada: carga, error, estados bloqueantes.
 */
export function FullScreenLoader({ label = 'Cargando...' }) {
  return (
    <div className="min-h-[70dvh] flex flex-col items-center justify-center gap-4 px-4" role="status" aria-live="polite">
      <div className="animate-pulse">
        <LatidoSymbol width={56} />
      </div>
      <span className="font-mono text-xs uppercase tracking-widest text-muted text-center">{label}</span>
    </div>
  );
}

export function FullScreenMessage({ stamp, stampVariant = 'ink', title, children, actions, shadow = 'teal' }) {
  return (
    <div className="min-h-[70dvh] flex items-center justify-center px-3.5 sm:px-4 py-8 sm:py-10">
      <TicketCard shadow={shadow} className="w-full max-w-[440px]" bodyClassName="p-6 sm:p-8 text-center">
        {stamp && <Stamp variant={stampVariant}>{stamp}</Stamp>}
        {title && <h1 className="text-xl font-bold tracking-tight mt-4">{title}</h1>}
        {children && <div className="text-sm text-muted mt-2 leading-relaxed">{children}</div>}
        {actions && <div className="mt-6 flex flex-wrap gap-3 justify-center">{actions}</div>}
      </TicketCard>
    </div>
  );
}
