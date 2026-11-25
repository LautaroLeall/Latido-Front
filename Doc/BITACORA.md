# Bitácora de Desarrollo — Frontend LATIDO

Registro cronológico de avances, decisiones, fallas resueltas y tareas pendientes.

---

## [2026-10-13] — Fase 1: Inicialización y Establecimiento de Marca

- **Identidad Oficial**: Migración integral de la marca de trabajo "TALÓN" a la marca definitiva **LATIDO** (_"Cada opinión, a tiempo."_).
- **Control de Versiones**:
  - Configuración del repositorio remoto `https://github.com/LautaroLeall/Latido-Front.git` en rama `LautyGod`.
  - Creación del archivo `.gitignore` estricto para blindar credenciales (`.env`, `node_modules`, builds).
- **Sistema de Diseño Base**:
  - Implementación de los tokens de color: Tinta (`#1A1D29`), Papel (`#FAF8F3`), Papel gastado (`#F0ECE1`), Ámbar (`#C89B3C`), Ámbar texto (`#8A6414`), Verde registro (`#1F6F64`), Rojo alerta (`#B3423A`) y Perforado (`#D8D2C2`).
  - Integración tipográfica dual: Space Grotesk (conversacional/titulares) + IBM Plex Mono (transaccional/sellos).
  - Filosofía de bordes: `border-radius: 0px` en tarjetas y botones (corte a guillotina) y sombras duras sin desenfoque.
- **Componentes Atómicos Creados**:
  - `LatidoSymbol` y `LatidoLogo` en SVG puro.
  - `Ticket`, `PerfEdge`, `NotchEdges`, `Stamp`, `HardButton`.

---

## [2026-10-21] — Fase 2: Conexión real con Supabase, autenticación y panel completo

### Avances

- **Conexión**: `.env` con `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` (nuevo formato de claves de Supabase). `.env` sigue ignorado por Git; `.env.example` actualizado.
- **Autenticación completa** (`src/features/auth/`): Login, Registro (con confirmación por email), Recuperar contraseña (mensaje neutro, no revela si el email existe), Restablecer contraseña y **Onboarding** (crea negocio + sucursal + primer QR en una transacción vía RPC `create_my_business`).
- **Guards de rutas** (`src/routes/ProtectedRoute.jsx`): sesión, rol (`admin`/`employee`/`super_admin`), negocio asignado, negocio suspendido, y redirección a la página que se intentaba abrir.
- **AuthContext** reescrito: sesión y perfil separados (sin bloqueos del cliente de Auth), sin perfiles falsos en modo real, conserva el perfil si falla un refresco.
- **Ticket del cliente** (`/f/:token`): datos reales vía `get_business_by_token`, estados de carga / QR inactivo / sin conexión con reintento, honeypot anti-bots, consentimiento enviado al servidor, accesibilidad (radiogroup, aria-live) y respeto de `prefers-reduced-motion`. `/f/demo` = demostración sin guardar datos.
- **Panel del negocio** (`src/features/admin/`): pestañas Resultados (métricas agregadas por período, distribución, etiquetas top, opiniones paginadas), Mis QR & NFC (QR real, PNG 1024px, copiar URL, activar/desactivar, nuevas sucursales), Destino de reseñas (con URL de Google validada) y Modo Rescate (reloj SLA, plantillas, WhatsApp/Email/Llamada, confirmación de envío, resultado, descarte, historial, borrado de datos personales y ajustes).
- **Tiempo real**: suscripción Realtime por negocio con debounce; indicador “EN VIVO” según el estado real del canal.
- **Super Admin**: libro mayor real vía `get_platform_overview` (solo agregados), búsqueda, cambio de plan y suspensión/reactivación.
- **Rendimiento**: rutas con `React.lazy` + chunks manuales (react / supabase / extras). El cliente que escanea un QR no descarga el código del panel. Build sin warnings.
- **UI compartida**: `Field`, `Alert`, `TicketCard`, `FullScreen`; `HardButton` con `as="a"` y `type="button"` por defecto.

### Fallas corregidas

- Token `muted` usado en toda la UI pero no definido en Tailwind → textos secundarios sin color. Agregado `muted: #5F636B`.
- Animación `animate-fadeIn` usada pero inexistente → agregada.
- El ticket **simulaba éxito si fallaba el envío** → ahora muestra el error real (el cliente sabe si su opinión llegó).
- El ticket mostraba datos de demo si fallaba la red → ahora muestra “sin conexión” con reintento.
- `<button>` dentro de `<a>` (HTML inválido) en el botón de Google → `HardButton as="a"`.
- Email de rescate duplicaba la firma (las plantillas ya la incluyen) → corregido en `getContactUrl`.
- `fillTemplate` borraba los saltos de línea de las plantillas de email → ahora solo colapsa espacios.

### Pendiente / futuro

- Invitar empleados (rol `employee`) desde el panel.
- Edición de plantillas de rescate propias desde la UI.
- Subida de logo del negocio (Supabase Storage).
- Lámina A5 imprimible en PDF con co-branding.
- `npm audit`: revisar vulnerabilidades reportadas por dependencias de desarrollo.

---

## [2026-11-16] — Landing, planes por soportes y privacidad

### Avances

- **Landing pública** (`src/features/landing/`, ruta `/`), con la misma estructura que la de NutriOlivia pero en el lenguaje visual de Latido (ticket, sellos, sombras duras, bordes cero): navbar con scroll, hero con mockup que recorre solo _ticket → panel → rescate_, estadísticas con contadores, “cómo funciona” + **demo interactiva** (el visitante opina y ve cómo le llega a su panel, incluido el Modo Rescate), funciones, “para quién”, cita, **planes**, preguntas frecuentes y cierre con contacto.
- **Planes en vivo**: la landing lee la tabla `plans` (solo los activos). Si la base no responde, usa valores de reserva.
- **Super Admin**: nueva pestaña **Planes y precios** (editar nombre, soportes, precio, orden, visible/destacado; crear planes) y selector de plan por negocio, con soportes manuales para el plan personalizado. MRR estimado según los planes. Confirmación antes de suspender.
- **Panel del negocio → Mis QR & NFC**: medidor “X de N soportes en uso”, mover un soporte entre sucursales, sucursales sin soporte con botón “Asignar”, alta de sucursal con o sin soporte según disponibilidad.
- **`/privacidad`**: política preliminar (a revisar con un profesional) enlazada desde el footer y las FAQ.
- `framer-motion` agregado (solo se descarga al entrar a la landing). `AuthContext` sigue funcionando si la migración 007 todavía no se aplicó.
- Contacto comercial configurable con `VITE_CONTACT_WHATSAPP` / `VITE_CONTACT_EMAIL` (ver `.env.example`).

### Pendiente

- Revisar visualmente la landing en celular y escritorio, y ajustar textos.
- Configuración del negocio (nombre, logo con Supabase Storage).
- Reemplazar el email/WhatsApp de contacto por los definitivos.
- Dominio definitivo (`VITE_APP_URL`) antes de grabar chips NFC.

---

## [2026-11-19] — Cierre de registro público y alta de negocios desde Super Admin

### Avances

- **Panel Super Admin (`/super`)**: nuevo formulario `CreateBusinessForm` accesible desde **+ Nuevo negocio**. Permite cargar negocio, primera sucursal, firma de rescate, plan (y soportes manuales si es plan personalizado) y credenciales iniciales del dueño (con generador seguro y ver/ocultar contraseña). Invoca la Edge Function `create-business-account` y al finalizar muestra un ticket con URL de acceso, credenciales, primer enlace QR/NFC y botones para **copiar datos** o **enviar por WhatsApp**.
- **Sin registro público**:
  - Eliminados `RegisterPage.jsx`, `OnboardingPage.jsx`, `signUp` en `AuthContext` y `requireNoBusiness` en `ProtectedRoute`.
  - `/registro` redirige a `/login`; `/onboarding` removido.
  - `LoginPage` reemplaza "Crear cuenta" por contacto comercial por WhatsApp.
  - Landing (`LandingNav`, `LandingHero`, `LandingPricing`, `LandingCTA`) reemplaza los enlaces a `/registro` por "Ver planes" y contacto por WhatsApp con el plan elegido precompletado.
- **Build verificado**: 2097 módulos, 0 errores, 0 warnings.
- **Mejoras de paneles, "Mi cuenta", formulario editable y corrección UTF-8**:
  - **Eliminado `/registro` por completo** de `AppRoutes.jsx` (ya no existe ruta ni redirección).
  - **Corrección UTF-8 en `QrTab.jsx`**: reparadas las 9 líneas con doble codificación (`Escaneá`, `opiná`, `lámina`, `✓ Copiada`, `→`, `“NFC Tools”`). Escaneo completo del repo: 0 errores de codificación.
  - **Nueva pestaña `Mi cuenta` (`AccountTab.jsx` + `SurveyEditor.jsx`)** en el panel de cada negocio: plan actual con precio, medidor de soportes activos y sucursales, catálogo de otros planes con contacto directo por WhatsApp y Email para mejorar, edición de nombre del negocio / firma de rescate / perfil, cambio de contraseña y **editor visual de preguntas del formulario** (pregunta principal, aspectos clicables con plantillas por rubro, comentario libre y vista previa en vivo del ticket conectada a `FeedbackView.jsx`).
  - **Super Admin completo (`SuperDashboard.jsx` + `CreateBusinessForm.jsx`)**: invitación por **WhatsApp y Email** con credenciales y primer ticket al dar de alta, teléfono opcional del dueño, tabla + vista tarjetas móvil con dueño/email, edición inline de nombre de negocio, reenvío de accesos por WP/Email, filtro por estado y acceso rápido al ticket.
  - **Layout 100% pantalla completa y responsive**: tanto `AdminDashboard` como `SuperDashboard` pasan a ocupar el 100% del viewport con sidebar fija en escritorio/notebook (`lg+`), barra superior + pestañas rápidas en celular y tablet (`<lg`), y grillas adaptativas en todas las vistas.
  - Corregidas variables `{sucursal}`, `{aspectos}` y `{estrellas}` en `RescueTab.jsx`.
  - **Destino de reseñas 100% funcional (`FeedbackView.jsx`, `DestinationTab.jsx`, `QrTab.jsx`)**:
    - `panel`: solo ticket privado de Latido (nunca muestra Google).
    - `google`: redirección directa e instantánea desde `/f/:token` a Google Maps (`window.location.replace` + botón manual de respaldo), sin pasar por el formulario y sin reimprimir QR ni regrabar NFC.
    - `both`: siempre primero Latido y al confirmar ofrece la invitación opcional **“Sí, ir a Google” / “No, gracias”** para que el cliente elija.
    - `DestinationTab` suma vista paso a paso del recorrido, validación estricta `https://`, prueba directa del enlace de Google y prueba en vivo del QR; `QrTab` muestra el destino activo con acceso rápido para cambiarlo.
  - **Validaciones estrictas de datos reales y enlaces externos seguros en toda la app**:
    - Nuevo módulo central `src/lib/validators.js` (61/61 pruebas OK) + `PasswordChecklist.jsx` en vivo.
    - Validación real en todos los formularios (`FeedbackView`, `LoginPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `AccountTab`, `DestinationTab`, `RescueTab`, `QrTab`, `SurveyEditor`, `CreateBusinessForm`, `SuperDashboard`, `PlansManager`): emails con `@` y dominio real, nombres solo con letras/tildes/ñ (sin números ni símbolos raros), teléfonos reales sin letras ni secuencias falsas (`00000000`, `12345678`) con normalización automática AR `549...` para WhatsApp, contraseñas de 8–72 caracteres con letra + número, enlaces de Google restringidos a dominios oficiales (`g.page`, `maps.app.goo.gl`, `google.*`, `https://`), y validación de mensajes de rescate (sin texto vacío ni variables `{...}` sin reemplazar).
    - Todos los enlaces de WhatsApp, Mail, Gmail y pruebas externas usan `target="_blank" rel="noopener noreferrer"` u `openExternalInNewTab()`, y `RescueTab` / `CreateBusinessForm` / `SuperDashboard` suman apertura directa en Gmail + copiar mensaje para no perder ni romper jamás la pestaña principal de Latido.
  - Build verificado: **2102 módulos, 0 errores, 0 warnings**.
  - **Logo por negocio con respaldo automático a iniciales (`BusinessLogo.jsx`, `logoUpload.js`)**:
    - Subida, cambio y borrado de logo en `Mi cuenta → Plan y datos` (`AccountTab.jsx`): valida PNG/JPG/WebP reales (≥ 64×64 px, ≤ 5 MB), redimensiona a máx. 512×512 en canvas manteniendo transparencia, sube a Storage `business-logos/{business_id}/` y limpia logos anteriores.
    - Aviso suave en `AdminDashboard` y `QrTab` invitando a cargar el logo (descartable); si el negocio no carga logo o falla la carga, cae automáticamente al monograma de iniciales (`BusinessMonogram`).
    - Logo integrado de forma unificada en el panel (`AdminDashboard`), láminas QR (`QrTab`), vista previa del formulario (`SurveyEditor`), ticket del cliente / confirmación / redirección Google (`FeedbackView`) y libro mayor del Super Admin (`SuperDashboard`).
  - **Auditoría Integral, Optimización y Limpieza (Fases 1, 3, 4 y 5)**:
    - Pruebas versionadas en `Frontend/tests/` ejecutables con `npm test`: `validators.test.mjs` (61/61), `survey.test.mjs` (9/9) y `hygiene.test.mjs` (UTF-8, ausencia de `/registro` y auditoría de enlaces externos seguros).
    - `npm audit fix` ejecutado: **0 vulnerabilidades**.
    - Organización limpia de marca en `src/components/branding/` (`LatidoLogo`, `LatidoSymbol`, `BusinessLogo`, `BusinessMonogram`) y estrella unificada en `src/components/ui/StarIcon.jsx` (0 archivos muertos, 0 bordes redondeados indebidos, 0 imágenes sin `alt`).
    - Accesibilidad: `@media (prefers-reduced-motion: reduce)` y `:focus-visible` en `styles/index.css`.
    - **Rendimiento `/f/:token` (~107 KB gzip, meta < 150 KB)**: `App.jsx` aísla `/f/:token` de `AuthProvider`, `FeedbackView` usa `publicRpc.js` (evita descargar los 55 KB gzip de `@supabase/supabase-js`) y carga `canvas-confetti` dinámicamente solo en 5★; `vite.config.js` separa `motion`, `qr`, `confetti`, `icons`, `supabase` y `react`.
    - Re-renders reducidos: `QrTab`, `DestinationTab` y `AccountTab` memoizados frente al reloj de 30s en `AdminDashboard`.
    - SEO y favicon: corregido `/latido-icono-app.svg`, meta tags Open Graph/Twitter en `index.html` y `lib/seo.js` con `noindex` en paneles y tickets reales.
    - Documentación sincronizada (`ARQUITECTURA.md` y `Doc/README.md` con enlaces relativos).
    - `/f/demo` incluye link `← Volver a Latido` y sello `Demo` manteniendo idéntico el ticket real.

---

## [2026-11-23] — Estándar de Producción (SEO/GEO, Seguridad HTTP, Resiliencia, Velocidad y CI)

### Avances (alineado con estándares de NutriOliva y Portafolio-LLDP)

- **Despliegue y Seguridad HTTP (`vercel.json` + `.well-known/security.txt`)**:
  - Agregado `vercel.json` con `cleanUrls: true`, rewrites SPA seguros (evitan 404 en `/f/:token`, `/admin`, `/super`, `/privacidad` en Vercel), caché inmutable de 1 año en `/assets/*`, `X-Robots-Tag: noindex, nofollow, noarchive` + `Cache-Control: no-store` en paneles privados y headers estrictos globales (`HSTS` 2 años + preload, `CSP` sin `unsafe-inline` en `script-src`, `X-Content-Type-Options: nosniff`, `Cross-Origin-Opener-Policy: same-origin-allow-popups`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors` acotado a propio dominio y `lautarolealdev.com`).
  - Agregado `public/.well-known/security.txt` (RFC 9116).
- **SEO, GEO y Pre-renderizado Automatizado (`scripts/seoAutoPlugin.mjs` + `src/lib/seoConfig.js` + `RouteSEO.jsx` + `ScrollToTop.jsx`)**:
  - Plugin Vite automatizado que sincroniza en cada `dev`/`build` `robots.txt`, `sitemap.xml` (con `hreflang es-AR` e imagen OG), `manifest.json` (PWA), `llms.txt` (GEO/IA) y `.well-known/security.txt`, pre-renderiza rutas públicas (`/privacidad`, `/f/demo`) con JSON-LD y valida longitudes SEO al compilar.
  - Generados assets PNG optimizados (`og-banner.png` 1200×630, `apple-touch-icon.png` 180×180, `icon-192.png`, `icon-512.png`).
  - `index.html` actualizado con `lang="es-AR"`, Geo-SEO (Tucumán, Argentina), Open Graph PNG absoluto, JSON-LD `@graph` (`SoftwareApplication`, `Organization`, `WebSite`, `FAQPage`), `preconnect` a Supabase y carga no bloqueante CSP-strict de Google Fonts desde `src/main.jsx`.
- **Corrección de fallas de lógica, resiliencia y velocidad**:
  - `ErrorBoundary.jsx` global en estilo ticket para capturar errores inesperados y fallos de chunks tras un despliegue en Vercel.
  - `publicRpc.js`: timeout automático de 12s con `AbortController` + helper `fetchPublicTable` para que `usePlans.js` cargue planes de la landing sin depender del SDK completo de Supabase.
  - `FeedbackView.jsx`: reinicio limpio del estado al cambiar `:token` y cancelación con `AbortController`.
  - `RescueTab.jsx`: corregido doble signo `++` al mostrar teléfonos guardados en E.164, selección inteligente del canal por defecto según los datos válidos del cliente, `trim()` en confirmación de envío y sincronización de `RescueSettings` con cambios externos.
  - `AuthContext.jsx` + `ProtectedRoute.jsx` + `LoginPage.jsx`: `.catch()` en `getSession()`, protección contra carreras en `loadProfile`, eliminación de dependencia redundante `profileLoading` en `useMemo`, y pantalla de recuperación en `PublicOnlyRoute` si falla el perfil (evita bloqueo en `INGRESANDO...`).
  - `SurveyEditor.jsx`: guardado en paralelo con `Promise.all` (3× más rápido) y guarda de cancelación al desmontar.
  - `useAdminData.js`, `QrTab.jsx`, `AccountTab.jsx`, `DestinationTab.jsx`: `.catch()` y guardas de desmontaje en todas las cargas asíncronas.
  - `SuperDashboard.jsx`: `try/catch/finally` en carga, pestaña sincronizada con `?tab=` en la URL y búsqueda insensible a tildes.
  - `useNow.js`: pausa automática en pestañas ocultas (`visibilitychange`).
  - `PrivacyPage.jsx`: eliminado `useEffect` duplicado que competía por `document.title`.
  - `AdminDashboard.jsx`: persistencia por sesión del descarte del aviso de logo.
- **Pruebas y CI automatizado**:
  - Nueva suite `tests/seo.test.mjs` (6/6 OK) + refuerzo de `tests/hygiene.test.mjs` + script `npm run verify`.
  - Workflow `.github/workflows/ci.yml` en GitHub Actions (`build`, `test` y `npm audit --audit-level=high`).
- **Panel Super Admin — Diagnóstico de acompañamiento por negocio (`BusinessDetailDrawer.jsx`)**:
  - Nuevo panel lateral deslizable de solo lectura accesible desde el botón **Ver** / **Detalle** o haciendo clic sobre el nombre de cada negocio en `SuperDashboard.jsx`.
  - Consume `get_business_diagnostics(p_business_id)` (con degradación elegante si aún no se aplicó la migración 012) mostrando: diagnóstico automático de acompañamiento (_cómo ayudar hoy_ + botón de sugerencias por WhatsApp/Gmail en pestaña nueva), rendimiento y tendencia (7d, 30d vs 30d previos, distribución de estrellas, top 6 aspectos), salud del Modo Rescate (tasa, SLA, tiempo de primer contacto, ventas recuperadas), configuración actual del local, desglose por sucursal (QRs y chips NFC) y últimas 12 opiniones estrictamente anonimizadas (Ley 25.326).

---

## [2026-11-24] — Kits Llave en Mano, Ticket Conocer Latido, Rescate Detallado y Pulido Pre-Producción

### Avances y correcciones

- **Infraestructura, Vercel y Región São Paulo (`sa-east-1`)**:
  - Migración del proyecto Supabase a South America (`qonjvzbpfafhfciwooba.supabase.co`), actualización de `preconnect` en `index.html` y pruebas `seo.test.mjs`.
  - Fix de 404 en `/f/:token` en Vercel: removido `cleanUrls: true` de `vercel.json` y movidos los prerenderizados a `/prerender/privacidad.html` y `/prerender/f-demo.html` con fallback final `/(.*) -> /index.html`.
  - Generado `public/favicon.ico` multi-resolución (16/32/48/64/256 px) validado automáticamente por `tests/seo.test.mjs`.
- **Responsive móvil / iOS y Auth animado (`ViewportGuard.jsx`, `AuthShell.jsx`, `AuthSidebar.jsx`, `ProtectedRoute.jsx`)**:
  - Blindaje móvil global (`100dvh`, `overflow-x: clip`, inputs `16px` anti-zoom en iOS, selects nativos consistentes) y `ViewportGuard` para evitar desbordes tras rotación.
  - Pantallas `/login`, `/recuperar` y `/reset-password` rediseñadas con layout split-screen animado y transiciones direccionales.
  - Recuperación de contraseña verificada vía RPC `check_recovery_account` antes de disparar email, con aviso claro y botón de WhatsApp si el correo no existe o el local está suspendido.
  - Corregido bucle `Maximum update depth exceeded` al cerrar sesión o redirigir dentro de `AnimatePresence mode="wait"` reemplazando `<Navigate>` por `SafeRedirect` (con `useIsPresent()`).
- **Ticket público — Cierre "Conocer Latido" y apertura de Google en pestaña nueva (`FeedbackView.jsx`)**:
  - Reemplazado el botón "Enviar otra opinión" (conservado solo como reinicio discreto en `/f/demo`) por la tarjeta oscura `LatidoDiscoverCard` (**¿Qué es Latido? · Conocer Latido ↗**) que lleva a la landing.
  - En modo `both` y modo `google` directo, el enlace de Google Maps abre en una pestaña nueva (`_blank` con `opener = null` y respaldo manual en 1 toque si el navegador bloquea el popup), dejando la pestaña original del ticket en la pantalla de confirmación **"¡Muchas gracias!"** + **Conocer Latido**.
- **Modo Rescate — Historial detallado de casos cerrados y guía de Ventas recuperadas (`RescueTab.jsx`, `PanelBits.jsx`, `useAdminData.js`)**:
  - Eliminado el botón visual "Eliminar datos personales (Ley 25.326)" de la interfaz de casos cerrados.
  - Renovadas las tarjetas de historial (`HistoryCaseCard`): muestran comentario completo, aspectos, contacto, sucursal, insignia de SLA, línea de tiempo de 3 pasos (recepción, primer contacto y cierre con `resolver.full_name`), mensaje enviado expandible, filtros por resultado, motivo de descarte opcional y nota de resolución editable inline.
  - Tarjeta **Ventas recuperadas (ESTIMADO)** aclarada: cuando el ticket promedio está en `0` ofrece acceso directo a **Ajustes** (`Configurá ticket promedio →`) y botón **`¿Qué es?`** que despliega la guía con fórmula paso a paso y ejemplo práctico (también fija junto al formulario en _Modo Rescate → Ajustes_ para no recargar la vista de casos activos).
- **Modelo de Kits Físicos Llave en Mano (`KitsManager.jsx`, `kitPoster.js`, `BusinessDetailDrawer.jsx`, `QrTab.jsx`)**:
  - Retiradas las instrucciones de impresión / `NFC Tools` / `NTAG213` y la descarga/visualización del código QR escaneable del panel del comercio (`QrTab`, `AccountTab`, `AdminDashboard`, `ResultsTab`) y de los textos de la landing (`LandingHowItWorks`, `LandingFAQ`): en `/admin?tab=qrs` el negocio ve la ficha de su soporte físico (sin QR descargable ni escaneable para evitar impresiones caseras fuera del kit), puede probar el ticket, mover/renombrar sucursales, desactivar por pérdida/robo y pedir soportes adicionales por WhatsApp.
  - Nueva pestaña **Kits y NFC** en `/super` (`KitsManager.jsx`) conectada a la migración `015`: lista global de soportes, filtros por estado de entrega, alta de nuevos kits (`super_create_kit`), copia de URL HTTPS canónica (`buildKitUrl` / `SITE_URL`, nunca `localhost`) para chip NTAG213, notas internas, marcado de entrega y descarga exclusiva de **Lámina HD imprimible (1200×1800 px, proporción 2:3 para acrílico 10×15 cm a ~305 dpi)** generada en Canvas 2D (`src/lib/kitPoster.js`) con precarga de fuentes (`document.fonts.load`), márgenes seguros de 5,5 mm, textos ≥ 7 pt (≥ 30 px), zona objetivo NFC (_← Acercá tu celular acá_), mensaje único (_Tu opinión en pocos segundos_) y símbolo oficial 52×36 unificado con `LatidoSymbol.jsx` y `latido-simbolo.svg`.
  - Subida/eliminación de logo del negocio habilitada también para Super Admin desde `BusinessDetailDrawer.jsx` (respaldado por migración `014`).
- **Renombrado inline de sucursales (`BranchNameEditor.jsx`)**:
  - Tanto el Admin del comercio (`QrTab.jsx`) como el Super Admin (`BusinessDetailDrawer.jsx` y `KitsManager.jsx`) pueden editar el nombre de cualquier sucursal inline con validación de 2–60 caracteres (respaldado por migración `016`).
- **Landing pública — Navegación móvil corregida y planes sin montos (`LandingNav.jsx`, `landingUi.jsx`, `LandingPricing.jsx`, `usePlans.js`)**:
  - Corregidos los 4 botones del menú móvil (_Cómo funciona_, _Funciones_, _Planes_, _Preguntas_) difiriendo el scroll compensado por navbar al `onExitComplete` del menú desplegable y agregando `scroll-mt-16` en las secciones.
  - Ocultados los precios numéricos en la landing pública (`LandingPricing` y consulta pública de `usePlans`): se muestran la modalidad **Suscripción mensual**, la cantidad de soportes físicos incluidos, todos los beneficios y el botón **Consultar valor** por WhatsApp.
- **Contacto visible en todas las calificaciones (`ResultsTab.jsx`, `useAdminData.js`)**:
  - `useRecentResponses` ahora trae también `email` y `phone` de `response_contacts` para cualquier calificación (1★ a 5★, no solo Modo Rescate).
  - En **Resultados**, cada opinión donde el cliente dejó contacto muestra nombre, teléfono, email, canal preferido y botones directos (WhatsApp, Gmail, Email y Llamada en pestaña nueva) con mensaje prearmado según el puntaje (agradecimiento en 4–5★, seguimiento en 3★, disculpa en 1–2★), además de filtro rápido `Con contacto`.
- **Refactor modular de `src/features/` (cero archivos > 370 líneas)**:
  - Divididos los 8 módulos extensos (500–1067 líneas) más `QrTab` y `ResultsTab` en subcomponentes, hooks y helpers cohesivos sin cambiar rutas públicas ni contratos:
    - `features/feedback/`: `FeedbackView` + `useFeedbackTicket`, `FeedbackStates`, `ContactSection`, `LatidoDiscoverCard` (aislamiento liviano intacto: `FeedbackView` en ~7.4 KB gzip).
    - `features/admin/tabs/`: `rescue/` (6 módulos), `account/` (5 módulos), `survey/` (`useSurveyEditor` + `SurveyTicketPreview`), `QrCard` y `ResponseCard`.
    - `features/super/`: `detail/` (8 módulos), `kits/` (3 módulos), `create/` (2 módulos) y `dashboard/` (`useSuperData`, `SuperShell`, `BusinessCardList` unificando móvil y escritorio en tarjetas limpias sin colisiones ni scroll horizontal).
- **Limpieza de código**:
  - Centralizadas `normalizeSearch`, `isSafeHttpsUrl` y `getAppBaseUrl` en `src/lib/utils.js` (0 utilidades duplicadas).
  - Conservados los 6 SVGs de marca en `public/` por solicitud expresa como recursos de identidad.
