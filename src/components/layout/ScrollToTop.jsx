import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ANIMATED_GROUPS = new Set(['/', '/privacidad', '/login', '/recuperar', '/reset-password']);

/**
 * Vuelve al inicio de la página al cambiar de ruta.
 * En las rutas con transición direccional (Landing/Privacidad/Auth) el reset de scroll
 * ocurre en `onExitComplete` de AnimatePresence para no provocar saltos antes de salir.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    if (ANIMATED_GROUPS.has(pathname)) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}
