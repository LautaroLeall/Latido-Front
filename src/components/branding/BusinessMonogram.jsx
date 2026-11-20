import React from 'react';

/**
 * Monograma de contingencia para negocios que no suben logo
 * Cuadrado con relación 80% de área segura
 */
export default function BusinessMonogram({
  text = 'CS',
  size = 44,
  variant = 'dark', // 'dark' | 'light'
  className = ''
}) {
  const isDark = variant === 'dark';

  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`shrink-0 flex items-center justify-center font-sans font-bold select-none ${isDark ? 'bg-ink text-paper' : 'bg-paper text-ink border border-line-gray'
        } ${className}`}
    >
      <span className="text-[17px] tracking-tight">{text}</span>
    </div>
  );
}
