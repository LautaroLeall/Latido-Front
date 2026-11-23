// Verificación automatizada de SEO, GEO (llms.txt), PWA manifest y seguridad HTTP (vercel.json).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveSeoForPath, SITE_URL } from '../src/lib/seoConfig.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PUBLIC = path.join(ROOT, 'public');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    passed++;
  } catch (err) {
    failed++;
    console.log(`  ✘ ${name}: ${err.message}`);
  }
}

check('SITE_URL apunta al dominio HTTPS de producción', () => {
  assert.equal(SITE_URL, 'https://latido-opinion.vercel.app');
});

check('vercel.json es JSON válido con rewrites SPA y headers de seguridad', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  assert.equal(cfg.cleanUrls, true);
  assert.ok(Array.isArray(cfg.rewrites) && cfg.rewrites.length > 0);
  assert.ok(cfg.rewrites.some(r => r.destination === '/index.html'));

  const globalRule = cfg.headers.find(h => h.source === '/(.*)');
  assert.ok(globalRule, 'Falta regla global de headers /(.*)');
  const byKey = Object.fromEntries(globalRule.headers.map(h => [h.key, h.value]));

  assert.ok(byKey['Strict-Transport-Security']?.includes('max-age=63072000'));
  assert.ok(byKey['X-Content-Type-Options'] === 'nosniff');
  assert.ok(byKey['Referrer-Policy'] === 'strict-origin-when-cross-origin');
  assert.ok(byKey['Permissions-Policy']?.includes('camera=()'));
  assert.ok(byKey['Cross-Origin-Opener-Policy'] === 'same-origin-allow-popups');

  const csp = byKey['Content-Security-Policy'] || '';
  assert.ok(csp.includes("default-src 'self'"));
  assert.ok(csp.includes("script-src 'self'"));
  assert.ok(!csp.includes("script-src 'self' 'unsafe-inline'"), 'CSP no debe permitir unsafe-inline en script-src');
  assert.ok(csp.includes('https://*.supabase.co'));
  assert.ok(csp.includes('wss://*.supabase.co'));
  assert.ok(csp.includes("object-src 'none'"));

  const privateRule = cfg.headers.find(h => h.source.includes('admin'));
  assert.ok(privateRule?.headers.some(h => h.key === 'X-Robots-Tag' && h.value.includes('noindex')));

  const assetRule = cfg.headers.find(h => h.source === '/assets/(.*)');
  assert.ok(assetRule?.headers.some(h => h.key === 'Cache-Control' && h.value.includes('immutable')));
});

check('index.html tiene JSON-LD válido, canonical, OG PNG absoluto y cero handlers inline', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(html.includes('lang="es-AR"'));
  assert.ok(html.includes(`href="${SITE_URL}/"`));
  assert.ok(html.includes(`content="${SITE_URL}/og-banner.png"`), 'og:image debe ser PNG absoluto HTTPS');
  assert.ok(html.includes('href="/manifest.json"'));
  assert.ok(html.includes('href="/apple-touch-icon.png"'));
  assert.ok(html.includes('rel="preconnect" href="https://pocsdftehmjdwzvjcfcw.supabase.co"'));
  assert.ok(!/\son(?:load|click|error|submit)\s*=/i.test(html), 'index.html no debe usar handlers JS inline (CSP)');

  const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(ldMatch, 'Falta bloque JSON-LD');
  const parsed = JSON.parse(ldMatch[1]);
  const types = (parsed['@graph'] || []).map(n => n['@type']);
  for (const t of ['SoftwareApplication', 'Organization', 'WebSite', 'FAQPage']) {
    assert.ok(types.includes(t), `Falta tipo Schema.org ${t} en JSON-LD`);
  }
});

check('Assets PNG de marca y redes existen y no están vacíos', () => {
  for (const file of ['og-banner.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png']) {
    const stat = fs.statSync(path.join(PUBLIC, file));
    assert.ok(stat.size > 500, `${file} está vacío o corrupto`);
  }
});

check('robots.txt, sitemap.xml, manifest.json, llms.txt y security.txt existen y son válidos', () => {
  const robots = fs.readFileSync(path.join(PUBLIC, 'robots.txt'), 'utf8');
  assert.ok(robots.includes('Disallow: /admin'));
  assert.ok(robots.includes('Disallow: /super'));
  assert.ok(robots.includes('Disallow: /f/'));
  assert.ok(robots.includes('Allow: /f/demo'));
  assert.ok(robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`));

  const sitemap = fs.readFileSync(path.join(PUBLIC, 'sitemap.xml'), 'utf8');
  assert.ok(sitemap.includes(`<loc>${SITE_URL}/</loc>`));
  assert.ok(sitemap.includes(`<loc>${SITE_URL}/privacidad</loc>`));
  assert.ok(sitemap.includes(`<loc>${SITE_URL}/f/demo</loc>`));
  assert.ok(!sitemap.includes('/admin'), 'sitemap no debe incluir rutas privadas');

  const manifest = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'manifest.json'), 'utf8'));
  assert.equal(manifest.short_name, 'Latido');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2);

  const llms = fs.readFileSync(path.join(PUBLIC, 'llms.txt'), 'utf8');
  assert.ok(llms.includes(SITE_URL));
  assert.ok(llms.includes('Modo Rescate'));

  const sec = fs.readFileSync(path.join(PUBLIC, '.well-known', 'security.txt'), 'utf8');
  assert.ok(sec.includes(`Canonical: ${SITE_URL}/.well-known/security.txt`));
  assert.ok(sec.includes('Contact: mailto:'));
});

check('resolveSeoForPath indexa solo rutas públicas y aplica noindex a paneles y tickets reales', () => {
  for (const pub of ['/', '/privacidad', '/f/demo']) {
    const meta = resolveSeoForPath(pub);
    assert.ok(meta.robots.startsWith('index, follow'), `${pub} debe ser indexable`);
    assert.ok(meta.canonical.startsWith(SITE_URL));
  }
  for (const priv of ['/login', '/recuperar', '/reset-password', '/admin', '/admin/x', '/super', '/f/abc123token', '/no-existe']) {
    const meta = resolveSeoForPath(priv);
    assert.equal(meta.robots, 'noindex, nofollow', `${priv} debe ser noindex, nofollow`);
  }
});

if (failed > 0) {
  console.log(`\n✘ ${failed} fallos / ${passed} OK en pruebas SEO y seguridad HTTP`);
  process.exit(1);
}
console.log(`✔ SEO, GEO, PWA y seguridad HTTP OK (${passed}/${passed})`);
