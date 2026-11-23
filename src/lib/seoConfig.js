// Configuración centralizada de SEO por ruta (sin dependencias de React para pruebas directas en Node)

const rawEnvUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_APP_URL : '';

export const SITE_URL = (
  rawEnvUrl && /^https:\/\/(?!localhost\b)/i.test(rawEnvUrl)
    ? rawEnvUrl
    : 'https://latido-opinion.vercel.app'
).replace(/\/+$/, '');

export const DEFAULT_TITLE = 'Latido — Feedback con QR, Chip NFC y Modo Rescate | Argentina';
export const DEFAULT_DESC =
  'Recibí opiniones en 30 segundos con QR y chip NFC sin instalar apps. Impulsá reseñas en Google Maps y rescatá clientes insatisfechos en tiempo real.';
export const DEFAULT_KEYWORDS = [
  'Latido',
  'feedback con QR',
  'chip NFC opiniones',
  'reseñas Google Maps',
  'Modo Rescate clientes',
  'encuesta de satisfaccion QR',
  'opiniones en tiempo real',
  'software para comercios',
  'software para restaurantes',
  'QR NFC Tucuman',
  'feedback locales Argentina'
].join(', ');

export const INDEX_ROBOTS = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
export const NOINDEX_ROBOTS = 'noindex, nofollow';

export const SEO_ROUTES = {
  '/': {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
    canonical: `${SITE_URL}/`,
    robots: INDEX_ROBOTS
  },
  '/privacidad': {
    title: 'Política de Privacidad y Ley 25.326 | Latido',
    description:
      'Conocé cómo Latido protege las opiniones anónimas y los datos personales de clientes y comercios bajo la Ley 25.326 en Argentina.',
    canonical: `${SITE_URL}/privacidad`,
    robots: INDEX_ROBOTS
  },
  '/f/demo': {
    title: 'Probá el Ticket de Opinión QR y NFC en Vivo | Latido',
    description:
      'Probá en vivo el ticket digital QR y NFC de Latido sin registrarte: calificá en 30 segundos, elegí aspectos y descubrí el flujo de Google y Modo Rescate.',
    canonical: `${SITE_URL}/f/demo`,
    robots: INDEX_ROBOTS
  },
  '/login': {
    title: 'Ingresar al Panel · Latido',
    description: 'Acceso para comercios y administradores de Latido.',
    canonical: `${SITE_URL}/login`,
    robots: NOINDEX_ROBOTS
  },
  '/recuperar': {
    title: 'Recuperar Contraseña · Latido',
    description: 'Solicitá un enlace seguro para restablecer el acceso a tu panel de Latido.',
    canonical: `${SITE_URL}/recuperar`,
    robots: NOINDEX_ROBOTS
  },
  '/reset-password': {
    title: 'Nueva Contraseña · Latido',
    description: 'Definí una nueva contraseña segura para tu cuenta de Latido.',
    canonical: `${SITE_URL}/reset-password`,
    robots: NOINDEX_ROBOTS
  },
  '/admin': {
    title: 'Panel del Negocio · Latido',
    description: 'Métricas en tiempo real, soportes QR + NFC, destino de reseñas y Modo Rescate.',
    canonical: `${SITE_URL}/admin`,
    robots: NOINDEX_ROBOTS
  },
  '/super': {
    title: 'Super Admin · Latido',
    description: 'Administración central de negocios, planes y métricas agregadas de Latido.',
    canonical: `${SITE_URL}/super`,
    robots: NOINDEX_ROBOTS
  }
};

/**
 * Resuelve la configuración SEO para cualquier pathname (estático, dinámico o 404).
 */
export function resolveSeoForPath(pathname = '/') {
  const cleanPath = String(pathname || '/').replace(/\/+$/, '') || '/';

  if (SEO_ROUTES[cleanPath]) {
    return SEO_ROUTES[cleanPath];
  }
  if (cleanPath.startsWith('/admin/')) {
    return SEO_ROUTES['/admin'];
  }
  if (cleanPath.startsWith('/super/')) {
    return SEO_ROUTES['/super'];
  }
  if (/^\/f\/[^/]+$/.test(cleanPath)) {
    return {
      title: 'Ticket de opinión · Latido',
      description: 'Dejá tu opinión en 30 segundos escaneando el QR o acercando tu celular.',
      canonical: `${SITE_URL}${cleanPath}`,
      robots: NOINDEX_ROBOTS
    };
  }
  return {
    title: 'Página no encontrada (404) · Latido',
    description: 'La dirección solicitada no existe en Latido.',
    canonical: `${SITE_URL}/`,
    robots: NOINDEX_ROBOTS
  };
}

function upsertMeta(attr, key, content) {
  if (typeof document === 'undefined' || !content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  if (el.getAttribute('content') !== content) {
    el.setAttribute('content', content);
  }
}

function upsertCanonical(href) {
  if (typeof document === 'undefined' || !href) return;
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  if (link.getAttribute('href') !== href) {
    link.setAttribute('href', href);
  }
}

export function applySeoTags({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
  canonical,
  robots = INDEX_ROBOTS,
  keywords = DEFAULT_KEYWORDS
} = {}) {
  if (typeof document === 'undefined') return;

  if (title && document.title !== title) {
    document.title = title;
  }

  upsertMeta('name', 'title', title);
  upsertMeta('name', 'description', description);
  upsertMeta('name', 'keywords', keywords);
  upsertMeta('name', 'robots', robots);

  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  if (canonical) upsertMeta('property', 'og:url', canonical);

  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  if (canonical) upsertMeta('name', 'twitter:url', canonical);

  if (canonical) upsertCanonical(canonical);
}
