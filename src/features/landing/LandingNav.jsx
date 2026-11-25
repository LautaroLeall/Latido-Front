import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import LatidoLogo from '../../components/branding/LatidoLogo';
import HardButton from '../../components/ui/HardButton';
import { useAuth, homePathFor } from '../../context/AuthContext';
import { scrollToSection } from './landingUi';
import { buildWhatsAppUrl } from '../../lib/contact';

const NAV_LINKS = [
  {
    label: 'Cómo funciona',
    id: 'como-funciona'
  },
  {
    label: 'Funciones',
    id: 'funciones'
  },
  {
    label: 'Planes',
    id: 'planes'
  },
  {
    label: 'Preguntas',
    id: 'faq'
  }
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pendingSectionRef = useRef(undefined);
  const fallbackTimerRef = useRef(null);
  const { user, profile } = useAuth();
  const panelPath = user && profile ? homePathFor(profile) : null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => () => {
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
  }, []);

  function flushPendingScroll() {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    if (pendingSectionRef.current !== undefined) {
      const target = pendingSectionRef.current;
      pendingSectionRef.current = undefined;
      scrollToSection(target);
    }
  }

  function go(id) {
    if (open) {
      // En móvil esperamos a que cierre el menú desplegable antes de scrollear para
      // que iOS Safari / Chrome Android no cancelen el smooth scroll durante el reflow.
      pendingSectionRef.current = id;
      setOpen(false);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = setTimeout(flushPendingScroll, 220);
      return;
    }
    scrollToSection(id);
  }

  const solid = scrolled || open;

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)] transition-colors duration-300 ${solid ? 'bg-paper border-b-[1.5px] border-ink' : 'bg-transparent'
        }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center gap-2">
        <button type="button" onClick={() => go(null)} className="cursor-pointer" aria-label="Latido, volver arriba">
          <LatidoLogo variant={solid ? 'paper' : 'dark'} fontSize={20} symWidth={36} />
        </button>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, id }) => (
            <button key={id} type="button" onClick={() => go(id)}
              className={`font-mono text-[11.5px] uppercase tracking-wider cursor-pointer transition-colors ${solid ? 'text-muted hover:text-ink' : 'text-paper/75 hover:text-paper'
                }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {panelPath ? (
            <HardButton as={Link} to={panelPath} size="sm" variant={solid ? 'primary' : 'secondary'}
              className={solid ? '' : '!text-paper !border-paper hover:!bg-paper/10'}>
              Ir a mi panel
            </HardButton>
          ) : (
            <>
              <Link to="/login"
                className={`font-mono text-[11.5px] uppercase tracking-wider px-2 ${solid ? 'text-ink' : 'text-paper'} hover:underline`}>
                Ingresar
              </Link>
              <HardButton
                as="a"
                href={buildWhatsAppUrl('Hola, quiero activar Latido en mi negocio.')}
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
                className={solid ? '' : '!bg-paper !text-ink !border-paper !shadow-hard-amber'}
              >
                Pedir Latido
              </HardButton>
            </>
          )}
        </div>

        <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label="Menú"
          className={`md:hidden p-2 cursor-pointer ${solid ? 'text-ink' : 'text-paper'}`}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence onExitComplete={flushPendingScroll}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="md:hidden overflow-hidden bg-paper border-t border-line-gray"
          >
            <div className="px-4 sm:px-6 py-4 flex flex-col gap-1">
              {NAV_LINKS.map(({ label, id }) => (
                <button key={id} type="button" onClick={() => go(id)}
                  className="text-left font-mono text-xs uppercase tracking-wider text-ink py-3 border-b border-dashed border-line-gray cursor-pointer active:bg-paper-dim">
                  {label}
                </button>
              ))}
              <div className="flex flex-wrap gap-2.5 pt-4">
                {panelPath ? (
                  <HardButton as={Link} to={panelPath} size="sm" className="flex-1">Ir a mi panel</HardButton>
                ) : (
                  <>
                    <HardButton as={Link} to="/login" size="sm" variant="secondary" className="flex-1">Ingresar</HardButton>
                    <HardButton
                      as="a"
                      href={buildWhatsAppUrl('Hola, quiero activar Latido en mi negocio.')}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="sm"
                      className="flex-1"
                    >
                      Pedir Latido
                    </HardButton>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
