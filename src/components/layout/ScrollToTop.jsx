import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Vuelve al inicio de la página al cambiar de ruta (respetando anclas con hash).
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}
