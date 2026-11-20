import React from 'react';

/**
 * Borde perforado decorativo que simula el troquelado de papel continuo de ticket
 */
export default function PerfEdge({ className = '' }) {
  return (
    <div
      className={`h-[12px] w-full perf-edge ${className}`}
      aria-hidden="true"
    />
  );
}
