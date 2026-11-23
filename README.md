# LATIDO — Frontend

> **Cada opinión, a tiempo.** Plataforma SaaS física y digital con código **QR + chip NFC** para recibir feedback en 30 segundos, impulsar reseñas en Google Maps y rescatar clientes insatisfechos en tiempo real.

- **Producción:** https://latido-opinion.vercel.app/
- **Demo en vivo del ticket:** https://latido-opinion.vercel.app/f/demo
- **Backend:** https://github.com/LautaroLeall/Latido-Backend

---

## Stack y Arquitectura

- **Core:** React 19 + Vite 6 + React Router v7 + Tailwind CSS 3 (_Ledger & Ticket_ Design System: bordes `0px`, sombras duras, Space Grotesk + IBM Plex Mono).
- **Rendimiento extremo en `/f/:token` (~109 KB gzip):** ruta del cliente completamente aislada de `AuthProvider`, `@supabase/supabase-js` (~55 KB gzip), `framer-motion` (~43 KB gzip), `qrcode.react` y `lucide-react` mediante `publicRpc.js` (PostgREST directo con timeout de 12 s) y `canvas-confetti` bajo demanda solo en 5★.
- **Seguridad HTTP (`vercel.json`):** CSP estricto (`script-src 'self'` sin `unsafe-inline`), HSTS con preload, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-Robots-Tag: noindex` en paneles privados y `.well-known/security.txt`.
- **SEO / GEO automatizado (`scripts/seoAutoPlugin.mjs`):** genera y valida en cada build `robots.txt`, `sitemap.xml`, `manifest.json`, `llms.txt`, `.well-known/security.txt`, JSON-LD (`SoftwareApplication`, `Organization`, `WebSite`, `FAQPage`) y pre-renderizado estático de rutas públicas.
- **Módulos principales:**
  - **Ticket público (`/f/:token` y `/f/demo`):** logo del local, preguntas personalizables, modo Solo Latido / Solo Google (redirección directa) / Ambas (Latido primero + invitación opcional a Google conforme a políticas anti review gating).
  - **Panel del negocio (`/admin`):** resultados en tiempo real (Supabase Realtime), gestión de soportes QR & NFC y sucursales, Modo Rescate con reloj SLA y plantillas, destino de reseñas, logo propio (Storage) y editor visual de preguntas.
  - **Panel Super Admin (`/super`):** alta de cuentas vía Edge Function con invitación por WhatsApp/Gmail, gestión de planes y precios, y diagnóstico de acompañamiento por negocio (100% libre de PII de clientes finales).

---

## Puesta en marcha local

```bash
cp .env.example .env
npm install
npm run dev
```

### Pruebas y verificación completa

```bash
npm test        # 61 validadores + 9 encuesta/utils + higiene UTF-8/enlaces + 6 auditoría SEO/HTTP
npm run build   # Compilación de producción + generación y validación SEO/GEO
npm run verify  # Build + suite completa de pruebas
```

## Documentación técnica

- [Índice de documentación](./Doc/README.md)
- [Arquitectura del Frontend](./Doc/ARQUITECTURA.md)
- [Bitácora de desarrollo](./Doc/BITACORA.md)
