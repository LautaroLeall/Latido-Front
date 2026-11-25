import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, LifeBuoy, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';
import LatidoLogo from '../../components/branding/LatidoLogo';

const HIGHLIGHTS = [
  {
    id: 'realtime',
    icon: Zap,
    title: 'Opiniones en tiempo real',
    desc: 'Métricas, estrellas y aspectos más mencionados por sucursal sin recargar.',
    previewTag: 'EN VIVO · SUCURSAL CENTRO',
    previewMetric: '4.8 ★',
    previewSub: '+14 opiniones hoy',
    previewDetail: '“Excelente atención y rapidez en caja.”',
    tone: 'teal'
  },
  {
    id: 'rescue',
    icon: LifeBuoy,
    title: 'Modo Rescate con SLA',
    desc: 'Alertas de notas bajas con cuenta regresiva y mensajes listos para WhatsApp o email.',
    previewTag: 'RESCATE ACTIVO · SLA 42 MIN',
    previewMetric: '+$ 8.500',
    previewSub: 'Cliente recuperado',
    previewDetail: 'Plantilla personalizada lista para abrir en WhatsApp en 1 clic.',
    tone: 'amber'
  },
  {
    id: 'privacy',
    icon: ShieldCheck,
    title: 'Privacidad Ley 25.326',
    desc: 'Aislamiento multi-tenant: solo tu negocio accede a sus opiniones y contactos.',
    previewTag: 'SEGURIDAD · RLS ACTIVO',
    previewMetric: '100% aislado',
    previewSub: 'Anónimo por defecto',
    previewDetail: 'Contactos separados con consentimiento y purga a los 12 meses.',
    tone: 'paper'
  }
];

const ROUTE_BADGES = {
  '/login': 'Acceso al panel · Comercios',
  '/recuperar': 'Recuperación de contraseña',
  '/reset-password': 'Crear nueva contraseña'
};

const EASE_OUT = [0.22, 1, 0.36, 1];

/**
 * Sidebar de marca animado e interactivo para escritorio/notebook (lg+).
 * Permanece montado sin parpadeos al navegar entre /login, /recuperar y /reset-password.
 */
export default function AuthSidebar({ activePath = '/login' }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % HIGHLIGHTS.length);
    }, 5200);
    return () => clearInterval(timer);
  }, [paused]);

  const activeItem = HIGHLIGHTS[activeIdx] || HIGHLIGHTS[0];
  const routeBadge = ROUTE_BADGES[activePath] || ROUTE_BADGES['/login'];

  return (
    <aside
      className="hidden lg:flex lg:w-[44%] lg:min-w-[410px] lg:max-w-[540px] shrink-0 relative overflow-hidden bg-ink text-paper border-r-2 border-ink flex-col justify-between p-9 xl:p-11 select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Retícula arquitectónica sutil */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#FAF8F3 1px, transparent 1px), linear-gradient(90deg, #FAF8F3 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }}
        aria-hidden="true"
      />

      {/* Línea de pulso EKG que se dibuja al entrar */}
      <svg
        className="absolute left-0 right-0 top-[17%] w-full opacity-[0.14] pointer-events-none"
        viewBox="0 0 600 90"
        fill="none"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0 45H210L235 68L275 8L318 82L350 45H600"
          stroke="#C89B3C"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0.4 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
      </svg>

      {/* Cabecera del sidebar */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        className="relative z-10 flex items-center justify-between gap-4"
      >
        <Link to="/" aria-label="Volver al inicio de Latido" className="group inline-flex items-center">
          <LatidoLogo variant="dark" fontSize={23} symWidth={38} />
        </Link>

        <Link
          to="/"
          className="group inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-paper/70 hover:text-paper transition-colors py-1"
        >
          <ArrowLeft size={13} className="transition-transform duration-200 group-hover:-translate-x-1" />
          <span>Volver al sitio</span>
        </Link>
      </motion.div>

      {/* Centro: titular + tarjetas interactivas + mini vista en vivo */}
      <div className="relative z-10 my-6 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: EASE_OUT }}
        >
          <div className="min-h-[28px] mb-4 flex items-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={routeBadge}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
                className="inline-flex items-center gap-2 font-mono font-bold text-[10.5px] uppercase tracking-widest text-amber border-[1.5px] border-amber px-2.5 py-1 -rotate-1"
              >
                <span className="w-1.5 h-1.5 bg-[#4DB3A1] animate-pulse" />
                {routeBadge}
              </motion.span>
            </AnimatePresence>
          </div>

          <h2 className="text-3xl xl:text-[36px] font-bold tracking-tight leading-[1.1]">
            Cada opinión, <span className="text-amber">a tiempo.</span>
          </h2>
          <p className="text-sm text-paper/75 leading-relaxed mt-2.5 max-w-md">
            Controlá tus sucursales, rescatá clientes insatisfechos antes de perderlos y cuidá tus reseñas de Google desde un solo panel.
          </p>
        </motion.div>

        {/* Tarjetas interactivas seleccionables */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.16, ease: EASE_OUT }}
          className="space-y-2"
          role="tablist"
          aria-label="Funciones principales de Latido"
        >
          {HIGHLIGHTS.map((item, idx) => {
            const Icon = item.icon;
            const selected = idx === activeIdx;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setActiveIdx(idx);
                  setPaused(true);
                }}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`relative w-full text-left flex items-start gap-3 p-3 border transition-colors duration-200 cursor-pointer ${selected
                  ? 'border-amber/60 bg-paper/[0.08] text-paper'
                  : 'border-paper/12 bg-paper/[0.02] text-paper/75 hover:border-paper/30 hover:bg-paper/[0.05]'
                  }`}
              >
                {selected && (
                  <motion.span
                    layoutId="auth-sidebar-active-bar"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber"
                    aria-hidden="true"
                  />
                )}

                <span
                  className={`w-8 h-8 shrink-0 border flex items-center justify-center mt-0.5 transition-colors ${selected ? 'bg-amber/15 border-amber/50 text-amber' : 'bg-paper/10 border-paper/15 text-paper/70'
                    }`}
                >
                  <Icon size={15} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[13.5px] leading-snug text-paper">{item.title}</div>
                  <p className="text-xs text-paper/65 leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </motion.div>

        {/* Mini tarjeta en vivo que reacciona a la función seleccionada */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.24, ease: EASE_OUT }}
          className="border border-paper/20 bg-[#121520] p-3.5 min-h-[96px] flex flex-col justify-between"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-paper/60">
                  <span
                    className={`w-1.5 h-1.5 ${activeItem.tone === 'amber' ? 'bg-amber' : 'bg-[#4DB3A1]'
                      }`}
                  />
                  {activeItem.previewTag}
                </span>
                <span
                  className={`font-mono font-bold text-xs px-1.5 py-0.5 border ${activeItem.tone === 'amber'
                    ? 'border-amber/60 text-amber bg-amber/10'
                    : 'border-[#4DB3A1]/50 text-[#4DB3A1] bg-[#4DB3A1]/10'
                    }`}
                >
                  {activeItem.previewMetric}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs text-paper/85 leading-snug">{activeItem.previewDetail}</p>
              </div>
              <div className="font-mono text-[10px] text-paper/45 uppercase tracking-wider">
                {activeItem.previewSub}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Pie del sidebar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.28 }}
        className="relative z-10 pt-4 border-t border-dashed border-paper/15 flex items-center justify-between gap-4 font-mono text-xs"
      >
        <Link to="/f/demo" className="group inline-flex items-center gap-1.5 text-amber hover:underline font-bold">
          <span>Probar ticket demo</span>
          <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
        <Link
          to="/privacidad"
          className="text-[11px] uppercase tracking-wider text-paper/55 hover:text-paper transition-colors"
        >
          Privacidad
        </Link>
      </motion.div>
    </aside>
  );
}
