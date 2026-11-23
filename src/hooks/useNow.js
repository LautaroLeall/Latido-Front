import { useEffect, useState } from 'react';

/**
 * Devuelve Date.now() y se actualiza cada `intervalMs`.
 * Pausa el intervalo cuando la pestaña está oculta y sincroniza al instante al volver.
 */
export default function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let id = null;

    const start = () => {
      if (id !== null) return;
      id = setInterval(() => setNow(Date.now()), intervalMs);
    };

    const stop = () => {
      if (id !== null) {
        clearInterval(id);
        id = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        setNow(Date.now());
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs]);

  return now;
}
