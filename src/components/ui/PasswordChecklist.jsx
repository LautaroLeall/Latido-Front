import React from 'react';
import { getPasswordChecks } from '../../lib/validators';

/**
 * Indicador en vivo de requisitos mínimos de contraseña (8+ chars, letra y número).
 */
export default function PasswordChecklist({ password = '' }) {
  const c = getPasswordChecks(password);
  const items = [
    { ok: c.minLength, label: 'Mínimo 8 caracteres' },
    { ok: c.hasLetter, label: 'Al menos una letra' },
    { ok: c.hasNumber, label: 'Al menos un número' }
  ];

  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 font-mono text-[11px]" aria-live="polite">
      {items.map(it => (
        <li key={it.label} className={it.ok ? 'text-teal font-bold' : 'text-muted'}>
          {it.ok ? '✓' : '·'} {it.label}
        </li>
      ))}
    </ul>
  );
}
