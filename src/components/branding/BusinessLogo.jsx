import React, { useEffect, useState } from 'react';
import BusinessMonogram from './BusinessMonogram';
import { getMonogram, isSafeHttpsUrl } from '../../lib/utils';

/**
 * Marca visual de un negocio:
 * - Si cargó logo (`logoUrl` https válido y carga bien), lo muestra en contenedor cuadrado sin recorte.
 * - Si no cargó logo o falla la carga, cae automáticamente al monograma con las iniciales del negocio.
 */
export default function BusinessLogo({
  name = '',
  logoUrl = null,
  size = 44,
  variant = 'dark', // 'dark' (sobre papel) | 'light' (sobre tinta oscura)
  className = ''
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [logoUrl]);

  if (isSafeHttpsUrl(logoUrl) && !failed) {
    return (
      <div
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`shrink-0 bg-paper flex items-center justify-center overflow-hidden border ${variant === 'light' ? 'border-paper/30' : 'border-line-gray'
          } ${className}`}
      >
        <img
          src={logoUrl}
          alt={`Logo de ${name || 'negocio'}`}
          className="w-full h-full object-contain p-0.5"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <BusinessMonogram
      text={getMonogram(name)}
      size={size}
      variant={variant}
      className={className}
    />
  );
}
