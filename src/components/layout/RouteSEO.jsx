import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { resolveSeoForPath, applySeoTags } from '../../lib/seoConfig';

/**
 * Sincroniza <title>, <meta>, Open Graph, Twitter Card, canonical y robots
 * automáticamente en cada cambio de ruta.
 */
export default function RouteSEO() {
  const { pathname } = useLocation();

  useEffect(() => {
    applySeoTags(resolveSeoForPath(pathname));
  }, [pathname]);

  return null;
}
