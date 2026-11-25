# LATIDO — Frontend

> **Cada opinión, a tiempo.** Plataforma SaaS física y digital con código **QR + chip NFC** para recibir feedback en 30 segundos, impulsar reseñas en Google Maps y rescatar clientes insatisfechos en tiempo real.

- **Producción:** https://latido-opinion.vercel.app/
- **Demo en vivo del ticket:** https://latido-opinion.vercel.app/f/demo
- **Backend:** https://github.com/LautaroLeall/Latido-Backend

---

## Stack y Arquitectura

- **Core:** React 19 + Vite 6 + React Router v7 + Tailwind CSS 3 (_Ledger & Ticket_ Design System: bordes `0px`, sombras duras, Space Grotesk + IBM Plex Mono), blindado para móvil/iOS (`100dvh`, `ViewportGuard`, inputs `16px` anti-zoom).
- **Rendimiento extremo en `/f/:token` (~109 KB gzip):** ruta del cliente completamente aislada de `AuthProvider`, `@supabase/supabase-js` (~55 KB gzip), `framer-motion` (~43 KB gzip), `qrcode.react` y `lucide-react` mediante `publicRpc.js` (PostgREST directo con timeout de 12 s) y `canvas-confetti` bajo demanda solo en 5★.
- **Seguridad HTTP (`vercel.json`):** CSP estricto (`script-src 'self'` sin `unsafe-inline`), HSTS con preload, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-Robots-Tag: noindex` en paneles privados, rewrites SPA + prerender compatibles con `/f/:token` y `.well-known/security.txt`.
- **SEO / GEO automatizado (`scripts/seoAutoPlugin.mjs`):** genera y valida en cada build `robots.txt`, `sitemap.xml`, `manifest.json`, `llms.txt`, `.well-known/security.txt`, JSON-LD (`SoftwareApplication`, `Organization`, `WebSite`, `FAQPage`) y pre-renderizado estático de rutas públicas.
- **Módulos principales:**
  - **Landing pública (`/`):** explicación del modelo llave en mano, demo interactiva, planes mensuales por cantidad de soportes (consulta comercial sin precios numéricos expuestos) y navegación móvil sincronizada.
  - **Acceso y recuperación (`/login`, `/recuperar`, `/reset-password`):** layout split-screen animado sin registro público, recuperación verificada vía `check_recovery_account` y redirecciones seguras (`SafeRedirect`).
  - **Ticket público (`/f/:token` y `/f/demo`):** logo del local, preguntas personalizables, modos Solo Latido / Solo Google (abre Google en nueva pestaña manteniendo el cierre en la pestaña del ticket) / Ambas (Latido primero + invitación opcional a Google en nueva pestaña conforme a políticas anti review gating), con cierre **Conocer Latido** hacia la landing.
  - **Panel del negocio (`/admin`):** resultados en tiempo real (Supabase Realtime) con datos de contacto y respuesta en 1 clic en todas las calificaciones (1★ a 5★), estado de soportes físicos QR & NFC (sin descarga ni QR escaneable para proteger el modelo de kits completos) y sucursales con renombrado inline, Modo Rescate con reloj SLA, guía de ventas recuperadas estimadas, plantillas e historial detallado de casos cerrados (timeline, mensaje enviado y nota editable), destino de reseñas, logo propio (Storage) y editor visual de preguntas.
  - **Panel Super Admin (`/super`):** alta de cuentas vía Edge Function con invitación por WhatsApp/Gmail, pestaña **Kits y NFC** (URL canónica HTTPS para NTAG213, descarga de **Lámina HD 1200×1800 / 10×15 cm** con márgenes de guillotina ≥5,5 mm, zona objetivo NFC y marca oficial de Latido, seguimiento de entrega y alta de kits), detalle por negocio (diagnóstico 0% PII, carga de logo y edición de sucursales) y gestión de planes.

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
