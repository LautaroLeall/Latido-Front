import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import HeroMockup from './HeroMockup';
import { scrollToSection } from './landingUi';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' }
});

const PILLS = ['QR + chip NFC', 'Tiempo real', 'Modo Rescate'];

export default function LandingHero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-ink">
      {/* Retícula de fondo */}
      <div className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'linear-gradient(#FAF8F3 1px, transparent 1px), linear-gradient(90deg, #FAF8F3 1px, transparent 1px)',
          backgroundSize: '56px 56px'
        }} />
      {/* Línea de pulso decorativa */}
      <svg className="absolute left-0 right-0 top-[18%] w-full opacity-[0.10] pointer-events-none" viewBox="0 0 1440 120" fill="none" aria-hidden="true" preserveAspectRatio="none">
        <motion.path d="M0 60H520L560 90L640 8L720 112L780 60H1440" stroke="#C89B3C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.4, ease: 'easeInOut' }} />
      </svg>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center w-full">
        <div>
          <motion.span {...fadeUp(0.1)}
            className="inline-block font-mono font-bold text-[11px] uppercase tracking-widest text-amber border-[1.5px] border-amber px-3 py-1 -rotate-1 mb-6">
            Feedback · QR · NFC · Modo Rescate
          </motion.span>

          <motion.h1 {...fadeUp(0.2)} className="font-bold text-paper leading-[1.08] tracking-tight mb-6"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 3.9rem)' }}>
            Cada opinión,{' '}<span className="text-amber">a tiempo.</span>
          </motion.h1>

          <motion.p {...fadeUp(0.32)} className="text-paper/75 text-[17px] leading-relaxed mb-9 max-w-lg">
            Tus clientes opinan en 30 segundos escaneando un QR o acercando el celular. Vos te enterás al instante
            y rescatás al que se fue enojado <strong className="text-paper">antes de perderlo para siempre</strong>.
          </motion.p>

          <motion.div {...fadeUp(0.44)} className="flex flex-wrap gap-4 mb-10">
            <button type="button" onClick={() => scrollToSection('planes')}>
              <motion.span whileHover={{ x: -1, y: -1 }} whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 bg-paper text-ink font-mono font-bold uppercase tracking-wider text-[12.5px] px-6 min-h-[48px] border-[1.5px] border-paper shadow-[4px_4px_0_#C89B3C] cursor-pointer">
                Ver planes <ArrowRight size={15} />
              </motion.span>
            </button>
            <Link to="/f/demo">
              <motion.span whileHover={{ x: -1, y: -1 }} whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 text-paper font-mono font-bold uppercase tracking-wider text-[12.5px] px-6 min-h-[48px] border-[1.5px] border-paper/40 hover:bg-paper/10 cursor-pointer">
                <Play size={13} className="fill-paper" /> Probar el ticket
              </motion.span>
            </Link>
          </motion.div>

          <motion.ul {...fadeUp(0.56)} className="flex flex-wrap gap-x-5 gap-y-2">
            {PILLS.map(p => (
              <li key={p} className="font-mono text-[11px] text-paper/65 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-teal" style={{ backgroundColor: '#4DB3A1' }} />{p}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}>
          <HeroMockup />
        </motion.div>
      </div>

      <button type="button" onClick={() => scrollToSection('como-funciona')} aria-label="Bajar"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-widest text-paper/40 hover:text-paper/80 cursor-pointer">
        ↓ cómo funciona
      </button>

      {/* Borde perforado inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-3 perf-edge"
        style={{ backgroundImage: 'radial-gradient(circle, #FAF8F3 2px, transparent 2.4px)', backgroundColor: '#1A1D29' }} aria-hidden="true" />
    </section>
  );
}
