import { useEffect } from 'react';
import {
  SITE_URL,
  DEFAULT_TITLE,
  DEFAULT_DESC,
  DEFAULT_KEYWORDS,
  INDEX_ROBOTS,
  NOINDEX_ROBOTS,
  SEO_ROUTES,
  resolveSeoForPath,
  applySeoTags
} from './seoConfig';

export {
  SITE_URL,
  DEFAULT_TITLE,
  DEFAULT_DESC,
  DEFAULT_KEYWORDS,
  INDEX_ROBOTS,
  NOINDEX_ROBOTS,
  SEO_ROUTES,
  resolveSeoForPath,
  applySeoTags
};

/**
 * Override dinámico para vistas cuyo título/descripción depende de datos cargados
 * (ej. nombre del negocio en `/f/:token` o `/admin`).
 */
export function usePageMeta({ title, description, noindex, canonical } = {}) {
  useEffect(() => {
    const robots = typeof noindex === 'boolean' ? (noindex ? NOINDEX_ROBOTS : INDEX_ROBOTS) : INDEX_ROBOTS;
    applySeoTags({
      title: title || DEFAULT_TITLE,
      description: description || DEFAULT_DESC,
      canonical,
      robots
    });
  }, [title, description, noindex, canonical]);
}
