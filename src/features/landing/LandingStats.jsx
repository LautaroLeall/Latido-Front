import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { SectionHeader } from './landingUi';

function useCounter(target, duration = 1400, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    let raf;
    let start = null;
    const step = (ts) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 4)) * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);
  return count;
}

const STATS = [
  { value: 30, suffix: ' s', label: 'para dejar su opinión', desc: 'Estrellas, un toque en lo que le gustó o falló, y listo. Cuanto más rápido, más clientes responden.' },
  { value: 1, suffix: ' toque', label: 'y sin instalar nada', desc: 'Escanea el QR o acerca el celular al chip NFC. Abre en el navegador, sin apps ni registros.' },
  { value: 60, suffix: ' min', label: 'para rescatar al cliente', desc: 'Tiempo configurable. Cada caso de Modo Rescate tiene su reloj y su mensaje listo para enviar.' }
];

function StatCard({ stat, index, active }) {
  const n = useCounter(stat.value, 1100 + index * 250, active);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={active ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      whileHover={{ x: -2, y: -2 }}
      className="bg-paper border-[1.5px] border-ink p-8 text-center shadow-hard-ink"
    >
      <div className="font-bold text-ink leading-none mb-2 tabular-nums" style={{ fontSize: 'clamp(2.8rem, 6vw, 3.8rem)' }}>
        {n}<span className="text-[0.4em] font-mono ml-1 text-amber-ink">{stat.suffix}</span>
      </div>
      <div className="font-mono font-bold text-teal text-[12px] uppercase tracking-wider mb-3">{stat.label}</div>
      <p className="text-muted text-[13px] leading-relaxed">{stat.desc}</p>
    </motion.div>
  );
}

export default function LandingStats() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="bg-paper-dim py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <SectionHeader tag="Por qué Latido" title="Menos fricción. Más opiniones. Más clientes que vuelven." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATS.map((s, i) => <StatCard key={s.label} stat={s} index={i} active={inView} />)}
        </div>
      </div>
    </section>
  );
}
