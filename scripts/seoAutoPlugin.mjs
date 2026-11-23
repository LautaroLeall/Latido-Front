import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE_URL = 'https://latido-opinion.vercel.app';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

function writeIfChanged(filePath, content) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (fs.existsSync(filePath)) {
      const current = fs.readFileSync(filePath, 'utf8');
      if (current === content) return;
    }
    fs.writeFileSync(filePath, content, 'utf8');
  } catch {
    // Ignorar errores de permisos en entornos de solo lectura
  }
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function unescapeBasicHtml(str = '') {
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

const PUBLIC_PRERENDER_ROUTES = [
  {
    path: '/privacidad',
    outputFile: 'prerender/privacidad.html',
    changefreq: 'monthly',
    priority: '0.6',
    breadcrumbName: 'Política de Privacidad',
    title: 'Política de Privacidad y Ley 25.326 | Latido',
    description:
      'Conocé cómo Latido protege las opiniones anónimas y los datos personales de clientes y comercios bajo la Ley 25.326 en Argentina.',
    eyebrow: 'LEGAL · PROTECCIÓN DE DATOS PERSONALES',
    h1: 'Política de Privacidad — Latido',
    mainHtml: `
      <p style="font-size: 1rem; line-height: 1.65; color: #3D414D; margin: 0 0 1.25rem;">
        En <strong>Latido</strong> las opiniones son anónimas por defecto. Los datos de contacto solo se recolectan si el cliente decide dejarlos con consentimiento expreso para que el comercio lo contacte (Ley 25.326).
      </p>
      <ul style="padding-left: 1.25rem; color: #3D414D; line-height: 1.8; margin-bottom: 1.75rem;">
        <li><strong>Aislamiento multi-tenant:</strong> cada comercio accede únicamente a sus propios datos con Row Level Security.</li>
        <li><strong>Sin fines publicitarios:</strong> los datos no se venden ni se comparten con terceros.</li>
        <li><strong>Retención acotada:</strong> eliminación automática a los 12 meses de resuelto el caso o a solicitud del titular.</li>
      </ul>`
  },
  {
    path: '/f/demo',
    outputFile: 'prerender/f-demo.html',
    changefreq: 'weekly',
    priority: '0.9',
    breadcrumbName: 'Demo Interactiva del Ticket',
    title: 'Probá el Ticket de Opinión QR y NFC en Vivo | Latido',
    description:
      'Probá en vivo el ticket digital QR y NFC de Latido sin registrarte: calificá en 30 segundos, elegí aspectos y descubrí el flujo de Google y Modo Rescate.',
    eyebrow: 'DEMO INTERACTIVA · TICKET QR & CHIP NFC',
    h1: 'Ticket de Opinión en 30 Segundos (Demo en Vivo)',
    mainHtml: `
      <p style="font-size: 1rem; line-height: 1.65; color: #3D414D; margin: 0 0 1.25rem;">
        Esta demostración replica el ticket exacto que ven tus clientes al escanear el código QR o acercar el celular al chip NFC de tu mostrador, sin instalar aplicaciones.
      </p>
      <ul style="padding-left: 1.25rem; color: #3D414D; line-height: 1.8; margin-bottom: 1.75rem;">
        <li>Calificación de 1 a 5 estrellas, aspectos personalizables y comentario opcional.</li>
        <li>Modo Rescate automático cuando el cliente deja una calificación baja y pide contacto.</li>
        <li>Invitación opcional a Google Maps conforme a las políticas anti review gating.</li>
      </ul>`
  }
];

function generateRobotsTxt() {
  return [
    '# Latido — robots.txt generado automáticamente',
    'User-agent: *',
    'Allow: /',
    'Allow: /privacidad',
    'Allow: /f/demo',
    'Allow: /llms.txt',
    'Allow: /.well-known/security.txt',
    'Allow: /og-banner.png',
    'Allow: /manifest.json',
    'Disallow: /admin',
    'Disallow: /admin/',
    'Disallow: /super',
    'Disallow: /super/',
    'Disallow: /login',
    'Disallow: /recuperar',
    'Disallow: /reset-password',
    'Disallow: /f/',
    'Disallow: /prerender/',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    ''
  ].join('\n');
}

function generateSitemapXml(today) {
  const homeEntry = `  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="es-AR" href="${SITE_URL}/" />
    <xhtml:link rel="alternate" hreflang="es" href="${SITE_URL}/" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/" />
    <image:image>
      <image:loc>${SITE_URL}/og-banner.png</image:loc>
      <image:title>Latido — Feedback con QR, Chip NFC y Modo Rescate</image:title>
      <image:caption>Plataforma de opiniones en 30 segundos con QR y chip NFC, destino Google Maps y Modo Rescate en tiempo real.</image:caption>
    </image:image>
  </url>`;

  const subEntries = PUBLIC_PRERENDER_ROUTES.map(
    (route) => `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
    <xhtml:link rel="alternate" hreflang="es-AR" href="${SITE_URL}${route.path}" />
    <xhtml:link rel="alternate" hreflang="es" href="${SITE_URL}${route.path}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${route.path}" />
  </url>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
>
${homeEntry}
${subEntries}
</urlset>
`;
}

function generateManifestJson() {
  return (
    JSON.stringify(
      {
        name: 'Latido — Cada opinión, a tiempo.',
        short_name: 'Latido',
        description:
          'Plataforma física y digital con QR y chip NFC para recibir opiniones en 30 segundos, impulsar reseñas en Google y rescatar clientes insatisfechos en tiempo real.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FAF8F3',
        theme_color: '#1A1D29',
        lang: 'es-AR',
        categories: ['business', 'productivity'],
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/latido-icono-app.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      null,
      2
    ) + '\n'
  );
}

function generateLlmsTxt(today) {
  return `# Latido — Cada opinión, a tiempo. (${SITE_URL})
> Última actualización: ${today}
> Plataforma SaaS física y digital con soportes QR + chip NFC para recibir opiniones de clientes en 30 segundos, impulsar reseñas en Google Maps y activar Modo Rescate en tiempo real.

## Qué es Latido
Latido conecta el mostrador físico de comercios y servicios con un panel en tiempo real. Cada soporte físico incluye una lámina con el logo del negocio, código QR y chip NFC (NTAG213). Los clientes opinan desde el navegador sin descargar ninguna app ni crear cuenta.

## Funcionalidades Principales
- **Ticket de opinión en 30 segundos:** calificación de 1 a 5 estrellas, aspectos personalizables por rubro y comentario opcional.
- **Modo Rescate con reloj SLA:** cuando un cliente deja una calificación baja y decide dejar su contacto, se abre un caso prioritario con cuenta regresiva y mensajes listos para WhatsApp, Email o llamada.
- **Destino de reseñas flexible sin regrabar NFC ni reimprimir QR:**
  1. Solo panel privado de Latido.
  2. Solo Google Maps (redirección directa al enlace oficial de reseñas).
  3. Ambas (primero Latido y luego invitación opcional a Google para todos por igual, respetando las políticas anti review gating de Google).
- **Multi-sucursal y marca propia:** logo personalizado en panel, ticket y láminas QR imprimibles en alta resolución.
- **Privacidad y Ley 25.326 (Argentina):** opiniones anónimas por defecto, datos de contacto desacoplados con consentimiento expreso, aislamiento multi-tenant (RLS) y purga automática a los 12 meses de resuelto el caso.

## Secciones Públicas
- [Inicio y Planes](${SITE_URL}/): explicación completa, demo interactiva, planes por cantidad de soportes QR + NFC y preguntas frecuentes.
- [Demo en Vivo del Ticket](${SITE_URL}/f/demo): prueba real del ticket de opinión sin registro.
- [Política de Privacidad](${SITE_URL}/privacidad): tratamiento de datos personales conforme a la Ley 25.326.

## Rubros Ideales
Cafeterías, restaurantes, bares, hoteles, clínicas y consultorios, gimnasios, peluquerías, barberías, talleres, concesionarios, farmacias y comercios minoristas en Tucumán y toda Argentina.

## Contacto Comercial Oficial
- Web: ${SITE_URL}/
- WhatsApp: https://wa.me/5493813399463
- Email: lautaroleal4@gmail.com
`;
}

function generateSecurityTxt() {
  return [
    'Contact: mailto:lautaroleal4@gmail.com',
    'Contact: https://wa.me/5493813399463',
    `Canonical: ${SITE_URL}/.well-known/security.txt`,
    `Policy: ${SITE_URL}/privacidad`,
    'Preferred-Languages: es, en',
    'Expires: 2027-12-31T23:59:59.000Z',
    ''
  ].join('\n');
}

function buildRouteJsonLd(routeObj) {
  const fullUrl = `${SITE_URL}${routeObj.path}`;
  const graph = [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Latido',
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/icon-512.png`,
      email: 'lautaroleal4@gmail.com',
      telephone: '+5493813399463'
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${fullUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: routeObj.breadcrumbName, item: fullUrl }
      ]
    },
    {
      '@type': routeObj.path === '/f/demo' ? 'WebApplication' : 'WebPage',
      '@id': `${fullUrl}#webpage`,
      url: fullUrl,
      name: routeObj.title,
      description: routeObj.description,
      inLanguage: 'es-AR',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      breadcrumb: { '@id': `${fullUrl}#breadcrumb` }
    }
  ];

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replace(
    /</g,
    '\\u003c'
  );
}

function renderRouteHtml(baseHtml, routeObj) {
  const fullUrl = `${SITE_URL}${routeObj.path}`;
  const safeTitle = escapeHtml(routeObj.title);
  const safeDesc = escapeHtml(routeObj.description);

  const mainShell = `<main style="min-height:100vh;max-width:860px;margin:0 auto;padding:4rem 1.5rem;font-family:'Space Grotesk',system-ui,sans-serif;color:#1A1D29;background-color:#F0ECE1;">
      <p style="font-family:'IBM Plex Mono',monospace;font-size:0.75rem;font-weight:700;color:#1F6F64;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 0.75rem;">
        ${escapeHtml(routeObj.eyebrow)}
      </p>
      <h1 style="font-size:clamp(1.75rem,4vw,2.75rem);font-weight:700;line-height:1.15;margin:0 0 1.25rem;">
        ${escapeHtml(routeObj.h1)}
      </h1>
      ${routeObj.mainHtml}
      <nav aria-label="Navegación principal" style="margin-top:2rem;padding-top:1.25rem;border-top:1px dashed #D8D2C2;font-family:'IBM Plex Mono',monospace;font-size:0.85rem;">
        <a href="${SITE_URL}/" style="color:#1F6F64;margin-right:1.25rem;">Inicio Latido</a>
        <a href="${SITE_URL}/f/demo" style="color:#1F6F64;margin-right:1.25rem;">Probar ticket demo</a>
        <a href="${SITE_URL}/privacidad" style="color:#1F6F64;">Política de privacidad</a>
      </nav>
    </main>`;

  let html = baseHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${safeTitle}</title>`);
  html = html.replace(
    /<meta name="title" content="[^"]*"\s*\/>/,
    `<meta name="title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta name="description"[\s\S]*?content="[^"]*"\s*\/>/,
    `<meta name="description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<link rel="canonical" href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${fullUrl}" />`
  );
  html = html.replace(
    /<link rel="alternate" hreflang="es-AR" href="[^"]*"\s*\/>/,
    `<link rel="alternate" hreflang="es-AR" href="${fullUrl}" />`
  );
  html = html.replace(
    /<link rel="alternate" hreflang="es" href="[^"]*"\s*\/>/,
    `<link rel="alternate" hreflang="es" href="${fullUrl}" />`
  );
  html = html.replace(
    /<link rel="alternate" hreflang="x-default" href="[^"]*"\s*\/>/,
    `<link rel="alternate" hreflang="x-default" href="${fullUrl}" />`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${fullUrl}" />`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta property="og:description"[\s\S]*?content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<meta name="twitter:url" content="[^"]*"\s*\/>/,
    `<meta name="twitter:url" content="${fullUrl}" />`
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta name="twitter:description"[\s\S]*?content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n  ${buildRouteJsonLd(routeObj)}\n  </script>`
  );
  html = html.replace(/<main[\s\S]*?<\/main>/, mainShell);

  return html;
}

function validateRouteSeoBounds(routePath, title, description) {
  const titleLen = unescapeBasicHtml(title).trim().length;
  const descLen = unescapeBasicHtml(description).trim().length;
  const issues = [];
  if (titleLen < 15 || titleLen > 70) {
    issues.push(`title fuera de rango 15-70 (${titleLen} chars): "${title}"`);
  }
  if (descLen < 110 || descLen > 165) {
    issues.push(`description fuera de rango 110-165 (${descLen} chars): "${description}"`);
  }
  if (issues.length > 0) {
    throw new Error(`[latidoAutoSeoPlugin] Validación SEO falló en ${routePath}: ${issues.join('; ')}`);
  }
}

export function latidoAutoSeoPlugin() {
  let resolvedOutDir = path.join(PROJECT_ROOT, 'dist');

  function syncPublicSeoFiles() {
    const publicDir = path.join(PROJECT_ROOT, 'public');
    if (!fs.existsSync(publicDir)) return;
    const today = new Date().toISOString().slice(0, 10);

    writeIfChanged(path.join(publicDir, 'robots.txt'), generateRobotsTxt());
    writeIfChanged(path.join(publicDir, 'sitemap.xml'), generateSitemapXml(today));
    writeIfChanged(path.join(publicDir, 'manifest.json'), generateManifestJson());
    writeIfChanged(path.join(publicDir, 'llms.txt'), generateLlmsTxt(today));
    writeIfChanged(path.join(publicDir, '.well-known', 'security.txt'), generateSecurityTxt());
  }

  return {
    name: 'latido-auto-seo-plugin',
    configResolved(config) {
      resolvedOutDir = path.isAbsolute(config.build.outDir)
        ? config.build.outDir
        : path.resolve(PROJECT_ROOT, config.build.outDir);
    },
    buildStart() {
      syncPublicSeoFiles();
    },
    configureServer() {
      syncPublicSeoFiles();
    },
    closeBundle() {
      const distIndexPath = path.join(resolvedOutDir, 'index.html');
      if (!fs.existsSync(distIndexPath)) return;

      const baseHtml = fs.readFileSync(distIndexPath, 'utf8');
      const homeTitle = baseHtml.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '';
      const homeDesc = baseHtml.match(/<meta name="description"[\s\S]*?content="([^"]*)"\s*\/>/)?.[1] || '';
      validateRouteSeoBounds('/', homeTitle, homeDesc);

      for (const routeObj of PUBLIC_PRERENDER_ROUTES) {
        validateRouteSeoBounds(routeObj.path, routeObj.title, routeObj.description);
        const renderedHtml = renderRouteHtml(baseHtml, routeObj);
        const htmlTarget = path.join(resolvedOutDir, routeObj.outputFile);
        fs.mkdirSync(path.dirname(htmlTarget), { recursive: true });
        fs.writeFileSync(htmlTarget, renderedHtml, 'utf8');
      }
    }
  };
}
