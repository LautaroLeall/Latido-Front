# Arquitectura del Frontend — LATIDO

## 1. Stack Tecnológico

- **Framework**: React 19 sobre Vite 6.
- **Estilos**: Tailwind CSS 3 con sistema visual **"Ledger & Ticket"** (bordes `0px`, sombras duras, paleta Tinta `#1A1D29`, Papel `#FAF8F3`, Papel gastado `#F0ECE1`, Ámbar `#C89B3C` / Ámbar texto `#8A6414`, Verde registro `#1F6F64`, Rojo alerta `#B3423A`, Muted `#5F636B`).
- **Tipografías**: Space Grotesk (titulares/humano) + IBM Plex Mono (datos/sellos/botones).
- **Ruteo**: React Router v7 con división de código por ruta (`React.lazy`).
- **Animaciones**: Framer Motion (en landing y transiciones de autenticación/rutas, siempre aislado fuera de `/f/:token`, con `<MotionConfig reducedMotion="user">`) + `canvas-confetti` (import dinámico solo al marcar 5★) + `@media (prefers-reduced-motion: reduce)` en CSS.
- **BaaS**: `@supabase/supabase-js` para el área autenticada (proyecto Supabase South America / São Paulo `sa-east-1`) y `publicRpc.js` (`fetch` nativo sin SDK) para el ticket público `/f/:token`.

---

## 2. Organización Real de `src/`

```text
scripts/
└── seoAutoPlugin.mjs       # Genera robots.txt, sitemap.xml, manifest.json, llms.txt, security.txt y prerender SEO
vercel.json                 # Rewrites SPA + prerender (sin cleanUrls), caché inmutable, CSP estricto, HSTS y X-Robots-Tag
src/
├── components/
│   ├── branding/           # LatidoLogo, LatidoSymbol, BusinessLogo, BusinessMonogram
│   ├── layout/             # RouteSEO, ScrollToTop, ViewportGuard
│   └── ui/                 # Alert, BranchNameEditor, ErrorBoundary, Field, FullScreen, HardButton, PasswordChecklist, PerfEdge, Stamp, StarIcon, TicketCard
├── context/
│   └── AuthContext.jsx     # Sesión Supabase + perfil + negocio/plan + checkRecoveryAccount (solo fuera de /f/:token)
├── features/
│   ├── admin/              # Panel del negocio 100% responsive (sidebar escritorio + barra móvil)
│   │   ├── AdminDashboard.jsx
│   │   ├── useAdminData.js # Realtime + stats + respuestas paginadas + rescate (con resolver) + QRs
│   │   ├── components/PanelBits.jsx
│   │   └── tabs/
│   │       ├── ResultsTab.jsx + ResponseCard.jsx         # Métricas + contacto 1★–5★ con respuesta en 1 clic
│   │       ├── QrTab.jsx + QrCard.jsx                    # Soportes físicos sin QR descargable ni escaneable
│   │       ├── DestinationTab.jsx                        # Selector Solo Latido / Solo Google / Ambas
│   │       ├── RescueTab.jsx + rescue/                   # ActiveCaseCard, HistoryCaseCard, HistoryList, RecoveredValueGuide, RescueSettings, rescueHelpers
│   │       ├── AccountTab.jsx + account/                 # LogoSection, PlanOverviewCard, AccountDetailsForm, UpgradePlansGrid, ChangePasswordForm
│   │       └── SurveyEditor.jsx + survey/                # useSurveyEditor, SurveyTicketPreview
│   ├── auth/               # AuthLayout, AuthShell, AuthSidebar, LoginPage, ForgotPasswordPage, ResetPasswordPage (sin /registro)
│   ├── feedback/           # Ticket público (/f/:token y /f/demo): FeedbackView, useFeedbackTicket, FeedbackStates, ContactSection, LatidoDiscoverCard
│   ├── landing/            # Landing pública (Nav móvil sincronizada, Hero, Mockup, Stats, LiveDemo, Features, ForWho, Quote, Pricing sin montos, FAQ, CTA)
│   ├── legal/              # PrivacyPage.jsx (/privacidad)
│   └── super/              # Panel Super Admin (0 PII de clientes finales)
│       ├── SuperDashboard.jsx + dashboard/               # useSuperData, SuperShell, BusinessCardList
│       ├── BusinessDetailDrawer.jsx + detail/            # diagnosticsHelpers, SuperQrKitRow + 6 secciones de diagnóstico
│       ├── KitsManager.jsx + kits/                       # kitStages, KitCard, NewKitPanel
│       ├── CreateBusinessForm.jsx + create/              # createBusinessHelpers, BusinessCreatedCard
│       └── PlansManager.jsx
├── hooks/
│   └── useNow.js           # Reloj para cuentas regresivas SLA (pausa automática en segundo plano)
├── lib/
│   ├── contact.js          # URLs comerciales WhatsApp / Mail / Gmail
│   ├── errors.js           # Traducción de códigos de Supabase Auth / Postgres a español
│   ├── kitPoster.js        # Generador Canvas 2D HD (1200×1800, 2:3 para 10×15 cm a ~305 dpi) con márgenes 5,5 mm, zona NFC y símbolo oficial 52×36
│   ├── logoUpload.js       # Validación y optimización canvas (≤512px) + subida/borrado en Storage (Admin y Super Admin)
│   ├── publicRpc.js        # Llamadas livianas PostgREST con timeout (12s) y AbortSignal sin SDK completo
│   ├── seoConfig.js        # Configuración SEO/canonical/robots por ruta (testable directo en Node)
│   ├── seo.js              # Hook `usePageMeta` para overrides dinámicos (nombre del negocio)
│   ├── supabaseClient.js   # Cliente oficial Supabase (Auth, Realtime, Storage, DB)
│   ├── surveyConfig.js     # Preguntas predeterminadas, plantillas por rubro y resolver del ticket
│   ├── utils.js            # Formateo E.164/moneda/fechas, monograma, plantillas, openExternalInNewTab, normalizeSearch, isSafeHttpsUrl, getAppBaseUrl
│   └── validators.js       # Validadores centralizados de datos reales (61 pruebas unitarias)
├── routes/
│   ├── AuthenticatedApp.jsx
│   ├── AppRoutes.jsx       # Transiciones direccionales + rutas públicas/privadas
│   └── ProtectedRoute.jsx  # Guards de sesión/rol + SafeRedirect (useIsPresent, sin bucles con AnimatePresence)
├── styles/index.css        # Utilidades `.perf-edge`, `.stamp`, `:focus-visible`, `100dvh`, `overflow-x: clip`, inputs 16px y `prefers-reduced-motion`
├── App.jsx                 # ErrorBoundary + ViewportGuard + RouteSEO + ScrollToTop + aislamiento de /f/:token (< 150 KB gzip)
└── main.jsx                # Carga no bloqueante CSP-strict de Google Fonts + montaje React
```

---

## 3. Estrategia de Rendimiento y Seguridad en Cliente

1. **Ticket público (`/f/:token`) por debajo de 150 KB gzip (~109 KB gzip reales)**:
   - `App.jsx` monta `FeedbackView` fuera de `AuthProvider` y usa `publicRpc.js`, evitando descargar `@supabase/supabase-js` (~55 KB gzip), `framer-motion` (~43 KB gzip), `qrcode.react` (~6 KB gzip) y `lucide-react` (~4 KB gzip).
   - `canvas-confetti` se carga por `import()` dinámico únicamente si el cliente elige 5 estrellas y no tiene movimiento reducido activo.
2. **Sin registro público y recuperación verificada**:
   - No existe `/registro` ni `/onboarding`. Las cuentas de negocios las crea el Super Admin en `/super` invocando la Edge Function `create-business-account`.
   - `/recuperar` valida primero vía `check_recovery_account` si el email pertenece a un negocio activo o Super Admin antes de disparar el correo de restablecimiento.
3. **Modelo de kits llave en mano**:
   - La generación de láminas HD imprimibles (`kitPoster.js`), el render/descarga de QR (`qrcode.react`), la URL de grabación NFC NTAG213 y el seguimiento de entrega viven exclusivamente en `/super` (`KitsManager.jsx`, `BusinessDetailDrawer.jsx`, `CreateBusinessForm.jsx`); en `/admin?tab=qrs` el comercio gestiona sus soportes físicos sin QR descargable ni escaneable para proteger la propuesta comercial de kits físicos completos.
4. **Enlaces externos seguros y experiencia móvil blindada**:
   - Todos los envíos por WhatsApp, Email, Gmail y enlaces de Google Maps abren siempre en una pestaña nueva (`target="_blank" rel="noopener noreferrer"` u `openExternalInNewTab()`) para nunca perder la sesión ni la pestaña de confirmación de Latido.
   - `ViewportGuard` + CSS móvil garantizan altura real `100dvh`, cero zoom involuntario en iOS y cero desborde horizontal.
5. **Pruebas y CI automatizado (`npm test` / `npm run verify` / `.github/workflows/ci.yml`)**:
   - `tests/validators.test.mjs` (61 pruebas), `tests/survey.test.mjs` (9 pruebas), `tests/hygiene.test.mjs` (UTF-8, ausencia de `/registro` y enlaces externos seguros) y `tests/seo.test.mjs` (validación de `vercel.json`, CSP, HSTS, JSON-LD, `favicon.ico` multi-resolución, OG PNG, `robots.txt`, `sitemap.xml`, `manifest.json`, `llms.txt` y `.well-known/security.txt`).
