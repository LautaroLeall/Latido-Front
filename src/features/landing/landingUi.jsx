import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/** Scroll suave a una sección por id compensando el navbar fijo (null = volver arriba) */
export function scrollToSection(id) {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const behavior = reduce ? 'auto' : 'smooth';
  if (!id) {
    window.scrollTo({ top: 0, behavior });
    return;
  }
  const el = document.getElementById(id);
  if (!el) return;
  const nav = document.querySelector('nav');
  const rawNavH = nav ? nav.getBoundingClientRect().height : 68;
  const offset = Math.min(Math.max(rawNavH, 56), 84);
  const top = Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - offset));
  window.scrollTo({ top, behavior });
}

/** Entrada suave al aparecer en pantalla (una sola vez) */
export function Reveal({ children, delay = 0, y = 20, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Etiqueta mono tipo sello sobre cada título de sección */
export function SectionTag({ children, dark = false }) {
  return (
    <span
      className={`inline-block font-mono font-bold text-[11px] uppercase tracking-widest px-3 py-1 border-[1.5px] -rotate-1 mb-4 ${dark ? 'text-[#4DB3A1] border-[#4DB3A1]' : 'text-teal border-teal bg-teal/5'
        }`}
    >
      {children}
    </span>
  );
}

export function SectionHeader({ tag, title, subtitle, dark = false, className = 'mb-14' }) {
  return (
    <Reveal className={`text-center ${className}`}>
      <SectionTag dark={dark}>{tag}</SectionTag>
      <h2 className={`font-bold tracking-tight text-[28px] md:text-[34px] leading-tight ${dark ? 'text-paper' : 'text-ink'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-[15px] mt-3 max-w-xl mx-auto leading-relaxed ${dark ? 'text-paper/65' : 'text-muted'}`}>
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
