import { useEffect } from 'react';

const DEFAULT_TITLE = 'Latido — Cada opinión, a tiempo.';
const DEFAULT_DESC =
  'Plataforma física y digital con QR y chip NFC para recibir opiniones en 30 segundos, impulsar reseñas en Google y rescatar clientes insatisfechos en tiempo real.';

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Actualiza título, descripción y directiva robots (`noindex` para paneles y tickets privados).
 */
export function usePageMeta({ title = DEFAULT_TITLE, description = DEFAULT_DESC, noindex = false } = {}) {
  useEffect(() => {
    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    return () => {
      document.title = DEFAULT_TITLE;
      upsertMeta('name', 'robots', 'index, follow');
    };
  }, [title, description, noindex]);
}
