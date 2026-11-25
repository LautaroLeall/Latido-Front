import React from 'react';
import { Link } from 'react-router-dom';
import Stamp from '../../components/ui/Stamp';
import HardButton from '../../components/ui/HardButton';
import LatidoSymbol from '../../components/branding/LatidoSymbol';
import BusinessLogo from '../../components/branding/BusinessLogo';
import TicketCard from '../../components/ui/TicketCard';
import Alert from '../../components/ui/Alert';
import LatidoDiscoverCard from './LatidoDiscoverCard';

export function FeedbackStatusView({ loadState, onRetry }) {
  if (loadState === 'loading') {
    return (
      <TicketCard bodyClassName="p-8 sm:p-10 text-center">
        <div className="animate-pulse inline-block"><LatidoSymbol width={44} /></div>
        <div className="font-mono text-muted text-xs uppercase tracking-wider mt-3">Imprimiendo tu ticket...</div>
      </TicketCard>
    );
  }

  if (loadState === 'invalid') {
    return (
      <TicketCard shadow="red" bodyClassName="p-6 sm:p-8 text-center">
        <Stamp variant="red">QR inactivo</Stamp>
        <h1 className="text-xl font-bold mt-4 tracking-tight">Este código no está activo</h1>
        <p className="text-muted text-sm mt-2 leading-relaxed">
          El QR o chip NFC que escaneaste no corresponde a ningún local activo en Latido.
          Si creés que es un error, avisale al personal del local.
        </p>
      </TicketCard>
    );
  }

  return (
    <TicketCard shadow="red" bodyClassName="p-6 sm:p-8 text-center">
      <Stamp variant="red">Sin conexión</Stamp>
      <h1 className="text-xl font-bold mt-4 tracking-tight">No pudimos cargar el ticket</h1>
      <p className="text-muted text-sm mt-2">Revisá tu conexión a internet y probá de nuevo.</p>
      {loadState === 'error' && (
        <HardButton className="mt-5" size="sm" onClick={onRetry}>Reintentar</HardButton>
      )}
    </TicketCard>
  );
}

export function DirectGoogleView({ business, opened, onMarkOpened }) {
  const businessName = business.business_name;

  if (opened) {
    return (
      <TicketCard bodyClassName="p-6 sm:p-8 text-center">
        <div className="flex justify-center mb-3">
          <BusinessLogo name={businessName} logoUrl={business.logo_url} size={48} />
        </div>
        <Stamp variant="teal">Recibido</Stamp>
        <h1 className="text-2xl font-bold mt-4 tracking-tight">¡Muchas gracias!</h1>
        <p className="text-muted text-sm mt-2 leading-relaxed">
          Abrimos Google Maps en otra pestaña para que dejes tu reseña a {businessName}. Tu opinión ayuda muchísimo al local.
        </p>
        <div className="mt-4">
          <a
            href={business.google_review_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 font-mono text-xs font-bold text-teal hover:underline py-1"
          >
            <span>¿No se abrió Google? Volver a abrir</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>

        <LatidoDiscoverCard />
      </TicketCard>
    );
  }

  return (
    <TicketCard bodyClassName="p-6 sm:p-8 text-center">
      <Stamp variant="teal">Google Maps</Stamp>
      <div className="flex justify-center mt-5 mb-3">
        <BusinessLogo name={businessName} logoUrl={business.logo_url} size={56} />
      </div>
      <h1 className="text-xl font-bold tracking-tight break-words">{businessName}</h1>
      {business.branch_name && (
        <div className="font-mono text-muted text-xs mt-0.5 break-words">{business.branch_name}</div>
      )}
      <p className="text-muted text-sm mt-4 leading-relaxed">
        Tocá el botón para abrir Google Maps en otra pestaña y dejar tu reseña.
      </p>
      <div className="mt-5">
        <HardButton
          as="a"
          variant="teal"
          className="w-full"
          href={business.google_review_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onMarkOpened}
        >
          Ir a Google ahora ↗
        </HardButton>
      </div>
      <div className="border-t border-dashed border-line-gray mt-6 pt-3 flex items-center justify-center">
        <Link to="/" className="inline-flex items-center gap-2 font-mono text-xs text-muted hover:text-teal transition-colors py-1">
          <span>Con tecnología de</span>
          <LatidoSymbol width={20} />
          <span className="font-sans font-bold text-ink text-sm">Latido</span>
        </Link>
      </div>
    </TicketCard>
  );
}

export function FeedbackSubmittedView({
  business,
  isDemo,
  wantContact,
  showGoogleAfter,
  googleDeclined,
  googleOpened,
  onGoogleOpened,
  onGoogleDeclined,
  onResetDemo
}) {
  const businessName = business.business_name;

  return (
    <TicketCard bodyClassName="p-6 sm:p-8 text-center">
      <div className="flex justify-center mb-3">
        <BusinessLogo name={businessName} logoUrl={business.logo_url} size={48} />
      </div>
      <Stamp variant="teal">Recibido</Stamp>
      <h1 className="text-2xl font-bold mt-4 tracking-tight">¡Muchas gracias!</h1>
      <p className="text-muted text-sm mt-2 leading-relaxed">
        Tu opinión ya fue entregada directamente a {businessName}.
        {wantContact && ' Si dejaste tus datos, alguien del local se va a comunicar con vos.'}
      </p>
      {isDemo && <Alert variant="info" className="mt-4 text-left">Modo demostración: no se guardó ningún dato.</Alert>}

      {showGoogleAfter && !googleDeclined && !googleOpened && (
        <div className="mt-6 p-4 border-[1.5px] border-teal bg-teal/5 text-left space-y-3 animate-fadeIn">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-teal font-bold">Paso opcional</span>
            <p className="text-sm font-bold mt-0.5">
              ¿Querés dejar también tu reseña pública en Google?
            </p>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Vos elegís: tu opinión en Latido ya quedó guardada. Si querés, abrimos Google en otra pestaña para compartirla también allí.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <HardButton
              as="a"
              variant="teal"
              size="sm"
              className="flex-1"
              href={business.google_review_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onGoogleOpened}
            >
              Sí, ir a Google ↗
            </HardButton>
            <HardButton type="button" variant="secondary" size="sm" onClick={onGoogleDeclined}>
              No, gracias
            </HardButton>
          </div>
          <p className="font-mono text-muted text-[10px] leading-snug">
            Se ofrece a todos los clientes por igual, conforme a las políticas de Google.
          </p>
        </div>
      )}

      {showGoogleAfter && googleOpened && (
        <div className="mt-5 px-3.5 py-2.5 bg-teal/5 border border-teal/40 flex flex-wrap items-center justify-between gap-2 text-left animate-fadeIn">
          <span className="font-mono text-[11px] font-bold text-teal">
            ✓ Abrimos Google en otra pestaña
          </span>
          <a
            href={business.google_review_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] text-ink underline hover:text-teal shrink-0"
          >
            Volver a abrir ↗
          </a>
        </div>
      )}

      {showGoogleAfter && googleDeclined && (
        <p className="mt-5 font-mono text-xs text-muted bg-paper-dim border border-line-gray px-3 py-2.5">
          ¡Perfecto! Tu opinión ya llegó a {businessName}.
        </p>
      )}

      <LatidoDiscoverCard />

      {isDemo && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onResetDemo}
            className="font-mono text-[11px] text-muted hover:text-ink underline cursor-pointer py-1"
          >
            Probar otra calificación en la demo
          </button>
        </div>
      )}
    </TicketCard>
  );
}
