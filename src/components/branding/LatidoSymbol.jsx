import React from 'react';

/**
 * Símbolo oficial de Latido:
 * Talón rectangular con muescas laterales a guillotina + pulso cardíaco en ámbar
 */
export default function LatidoSymbol({
  width = 34,
  height,
  bg = '#1A1D29',
  stroke = '#C89B3C',
  border = null,
  className = ''
}) {
  const calcHeight = height || Math.round(width * 0.625);

  return (
    <svg
      width={width}
      height={calcHeight}
      viewBox="0 0 48 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Silueta del talón con muescas */}
      <path
        d="M0 0H48V10.5A4.5 4.5 0 0 0 48 19.5V30H0V19.5A4.5 4.5 0 0 0 0 10.5Z"
        fill={bg}
        stroke={border || undefined}
        strokeWidth={border ? 1.8 : 0}
      />
      {/* Línea de pulso cardíaco (Latido) */}
      <path
        d="M6 15H15L18 19L23 7.5L27 22.5L30 15H42"
        stroke={stroke}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
