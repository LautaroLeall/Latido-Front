import React from 'react';
import { Link } from 'react-router-dom';
import LatidoSymbol from '../../components/branding/LatidoSymbol';

/**
 * Talón final del ticket: invita a descubrir qué es Latido y lleva a la landing.
 */
export default function LatidoDiscoverCard() {
  return (
    <div className="mt-6 pt-5 border-t border-dashed border-line-gray">
      <div className="bg-ink text-paper border-[1.5px] border-ink shadow-hard-amber p-4 text-left space-y-3 animate-fadeIn">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 min-w-0">
            <LatidoSymbol width={26} bg="#2A2E3D" stroke="#C89B3C" border="#C89B3C" />
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-amber truncate">
              ¿Qué es Latido?
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-wider text-paper/75 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" aria-hidden="true" />
            QR + NFC
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-[15px] font-bold leading-snug tracking-tight text-paper">
            ¿Te gustó este ticket? Llevalo a tu negocio.
          </p>
          <p className="text-xs text-paper/80 leading-relaxed">
            Escuchá a tus clientes al instante, resolvé malas experiencias a tiempo y sumá más reseñas en Google.
          </p>
        </div>

        <Link
          to="/"
          className="w-full min-h-[42px] px-4 bg-amber text-ink border-[1.5px] border-amber font-mono font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] transition-all touch-manipulation"
        >
          <span>Conocer Latido</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
