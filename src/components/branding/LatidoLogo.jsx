import React from 'react';
import LatidoSymbol from './LatidoSymbol';

/**
 * Logotipo compuesto oficial de Latido: Símbolo + Nombre "Latido"
 * Variantes oficiales según manual:
 * - 'paper': Símbolo tinta sobre fondo claro, texto tinta
 * - 'dark': Símbolo tinta con contorno blanco sobre fondo oscuro, texto blanco
 * - 'monochrome': Una sola tinta
 * - 'white-green': Blanco sobre verde registro
 */
export default function LatidoLogo({
  variant = 'paper',
  symWidth = 32,
  fontSize = 18,
  className = ''
}) {
  let textColor = '#1A1D29';
  let symBg = '#1A1D29';
  let symStroke = '#C89B3C';
  let symBorder = null;

  if (variant === 'dark') {
    textColor = '#FAF8F3';
    symBg = '#1A1D29';
    symStroke = '#C89B3C';
    symBorder = '#FAF8F3';
  } else if (variant === 'monochrome') {
    textColor = '#1A1D29';
    symBg = '#1A1D29';
    symStroke = '#FAF8F3';
  } else if (variant === 'white-green') {
    textColor = '#FAF8F3';
    symBg = '#FAF8F3';
    symStroke = '#1F6F64';
  }

  return (
    <span
      className={`inline-flex items-center gap-2 font-sans font-bold tracking-tight select-none ${className}`}
      style={{ color: textColor, fontSize: `${fontSize}px` }}
    >
      <LatidoSymbol
        width={symWidth}
        bg={symBg}
        stroke={symStroke}
        border={symBorder}
      />
      <span>Latido</span>
    </span>
  );
}
