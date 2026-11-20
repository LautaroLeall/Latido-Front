import React from 'react';
import PerfEdge from './PerfEdge';

/**
 * Contenedor con forma de ticket térmico (perforación arriba y abajo).
 * Base visual de formularios, estados vacíos y pantallas de mensaje.
 */
export default function TicketCard({ children, shadow = 'teal', className = '', bodyClassName = 'p-6' }) {
  const shadows = {
    teal: 'shadow-hard-teal border-line-gray',
    red: 'shadow-hard-red border-alert-red border-2',
    ink: 'shadow-hard-ink border-ink',
    line: 'shadow-hard-line border-line-gray'
  };

  return (
    <div className={`bg-paper border relative animate-fadeIn ${shadows[shadow] || shadows.teal} ${className}`}>
      <PerfEdge />
      <div className={bodyClassName}>{children}</div>
      <PerfEdge />
    </div>
  );
}
