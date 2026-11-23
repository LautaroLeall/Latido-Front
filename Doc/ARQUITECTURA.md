# Arquitectura del Frontend — LATIDO

## 1. Stack Tecnológico

- **Framework**: React 19 sobre Vite 6.
- **Estilos**: Tailwind CSS 3 con sistema visual **"Ledger & Ticket"** (bordes `0px`, sombras duras, paleta Tinta `#1A1D29`, Papel `#FAF8F3`, Papel gastado `#F0ECE1`, Ámbar `#C89B3C` / Ámbar texto `#8A6414`, Verde registro `#1F6F64`, Rojo alerta `#B3423A`, Muted `#5F636B`).
- **Tipografías**: Space Grotesk (titulares/humano) + IBM Plex Mono (datos/sellos/botones).
- **Ruteo**: React Router v7 con división de código por ruta (`React.lazy`).
- **Animaciones**: Framer Motion (aislado en la landing, con `<MotionConfig reducedMotion="user">`) + `canvas-confetti` (import dinámico solo al marcar 5★) + `@media (prefers-reduced-motion: reduce)` en CSS.
- **BaaS**: `@supabase/supabase-js` para el área autenticada y `publicRpc.js` (`fetch` nativo sin SDK) para el ticket público `/f/:token`.

---

## 2. Organización Real de `src/`

```text
scripts/
└── seoAutoPlugin.mjs       # Genera robots.txt, sitemap.xml, manifest.json, llms.txt, security.txt y prerender SEO
vercel.json                 # Rewrites SPA, caché inmutable, CSP estricto, HSTS y X-Robots-Tag privado
src/
├── components/
│   ├── branding/           # LatidoLogo, LatidoSymbol, BusinessLogo, BusinessMonogram
│   ├── layout/             # RouteSEO, ScrollToTop
│   └── ui/                 # Alert, ErrorBoundary, Field, FullScreen, HardButton, PasswordChecklist, PerfEdge, Stamp, StarIcon, TicketCard
├── context/
│   └── AuthContext.jsx     # Sesión Supabase + perfil + negocio/plan (solo fuera de /f/:token)
├── features/
│   ├── admin/              # Panel del negocio 100% responsive (sidebar escritorio + barra móvil)
│   │   ├── AdminDashboard.jsx
│   │   ├── useAdminData.js # Realtime + stats + respuestas paginadas + rescate + QRs
│   │   ├── components/PanelBits.jsx
│   │   └── tabs/           # ResultsTab, QrTab, RescueTab, DestinationTab, AccountTab, SurveyEditor
│   ├── auth/               # AuthLayout, LoginPage, ForgotPasswordPage, ResetPasswordPage (sin /registro)
│   ├── feedback/           # FeedbackView.jsx (/f/:token y /f/demo; modos panel / google directo / both)
│   ├── landing/            # Landing pública (Hero, Mockup, Stats, LiveDemo, Features, ForWho, Quote, Pricing, FAQ, CTA)
│   ├── legal/              # PrivacyPage.jsx (/privacidad)
│   └── super/              # SuperDashboard.jsx, BusinessDetailDrawer.jsx, CreateBusinessForm.jsx, PlansManager.jsx
├── hooks/
│   └── useNow.js           # Reloj para cuentas regresivas SLA (pausa automática en segundo plano)
├── lib/
│   ├── contact.js          # URLs comerciales WhatsApp / Mail / Gmail
│   ├── errors.js           # Traducción de códigos de Supabase Auth / Postgres a español
│   ├── logoUpload.js       # Validación y optimización canvas (≤512px) + subida/borrado en Storage
│   ├── publicRpc.js        # Llamadas livianas PostgREST con timeout (12s) y AbortSignal sin SDK completo
│   ├── seoConfig.js        # Configuración SEO/canonical/robots por ruta (testable directo en Node)
│   ├── seo.js              # Hook `usePageMeta` para overrides dinámicos (nombre del negocio)
│   ├── supabaseClient.js   # Cliente oficial Supabase (Auth, Realtime, Storage, DB)
│   ├── surveyConfig.js     # Preguntas predeterminadas, plantillas por rubro y resolver del ticket
│   ├── utils.js            # Formateo E.164/moneda/fechas, monograma, plantillas, openExternalInNewTab
│   └── validators.js       # Validadores centralizados de datos reales (61 pruebas unitarias)
├── routes/
│   ├── AuthenticatedApp.jsx
│   ├── AppRoutes.jsx
│   └── ProtectedRoute.jsx
├── styles/index.css        # Utilidades `.perf-edge`, `.stamp`, `:focus-visible` y `prefers-reduced-motion`
├── App.jsx                 # ErrorBoundary + RouteSEO + ScrollToTop + aislamiento de /f/:token (< 115 KB gzip)
└── main.jsx                # Carga no bloqueante CSP-strict de Google Fonts + montaje React
```

---

## 3. Estrategia de Rendimiento y Seguridad en Cliente

1. **Ticket público (`/f/:token`) por debajo de 150 KB gzip (~107 KB gzip reales)**:
   - `App.jsx` monta `FeedbackView` fuera de `AuthProvider` y usa `publicRpc.js`, evitando descargar `@supabase/supabase-js` (~55 KB gzip), `framer-motion` (~43 KB gzip), `qrcode.react` (~6 KB gzip) y `lucide-react` (~4 KB gzip).
   - `canvas-confetti` se carga por `import()` dinámico únicamente si el cliente elige 5 estrellas y no tiene movimiento reducido activo.
2. **Sin registro público**:
   - No existe `/registro` ni `/onboarding`. Las cuentas de negocios las crea el Super Admin en `/super` invocando la Edge Function `create-business-account`.
3. **Enlaces externos seguros**:
   - Todos los envíos por WhatsApp, Email y Gmail abren siempre en una pestaña nueva (`target="_blank" rel="noopener noreferrer"` u `openExternalInNewTab()`) para nunca perder ni romper la sesión de Latido.
4. **Pruebas y CI automatizado (`npm test` / `npm run verify` / `.github/workflows/ci.yml`)**:
   - `tests/validators.test.mjs` (61 pruebas), `tests/survey.test.mjs` (9 pruebas), `tests/hygiene.test.mjs` (UTF-8, ausencia de `/registro` y enlaces externos seguros) y `tests/seo.test.mjs` (validación de `vercel.json`, CSP, HSTS, JSON-LD, OG PNG, `robots.txt`, `sitemap.xml`, `manifest.json`, `llms.txt` y `.well-known/security.txt`).
