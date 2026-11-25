import React from 'react';

/**
 * Símbolo oficial de Latido (proporción 52×36 unificada con `public/latido-simbolo.svg` y `kitPoster.js`):
 * Talón rectangular con muescas laterales a guillotina + pulso cardíaco en ámbar.
 */
export default function LatidoSymbol({
  width = 34,
  height,
  bg = '#1A1D29',
  stroke = '#C89B3C',
  border = null,
  className = ''
}) {
  const calcHeight = height || Math.round((width * 36) / 52);

  return (
    <svg
      width={width}
      height={calcHeight}
      viewBox="6 14 52 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Silueta del talón con muescas */}
      <path
        d="M6 14H58V27A5 5 0 0 0 58 37V50H6V37A5 5 0 0 0 6 27Z"
        fill={bg}
        stroke={border || undefined}
        strokeWidth={border ? 2 : 0}
      />
      {/* Línea de pulso cardíaco (Latido) */}
      <path
        d="M17 32L24 32L28 23L33 41L37 28L40 32L47 32"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
