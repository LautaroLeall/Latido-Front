import React from 'react';

export const STAR_PATH = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.2 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z';

/**
 * Estrella oficial de calificación (1–5) en ámbar (#C89B3C).
 */
export default function StarIcon({ size = 34, filled = false, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? '#C89B3C' : 'none'}
      stroke="#C89B3C"
      strokeWidth="1.8"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={STAR_PATH} />
    </svg>
  );
}
