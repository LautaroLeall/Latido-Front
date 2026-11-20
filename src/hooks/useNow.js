import { useEffect, useState } from 'react';

/**
 * Devuelve Date.now() y se actualiza cada `intervalMs`.
 * Usado por los relojes de SLA del Modo Rescate.
 */
export default function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
