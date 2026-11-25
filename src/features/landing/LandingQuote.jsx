import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import LatidoSymbol from '../../components/branding/LatidoSymbol';

export default function LandingQuote() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="relative py-20 sm:py-28 px-4 sm:px-6 overflow-hidden bg-ink">
      <div className="absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: 'radial-gradient(circle, #FAF8F3 1.5px, transparent 1.5px)', backgroundSize: '34px 34px' }} />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.5 }}
          className="flex justify-center mb-8">
          <LatidoSymbol width={54} bg="#1A1D29" stroke="#C89B3C" border="#FAF8F3" />
        </motion.div>

        <motion.p initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.75, delay: 0.15 }}
          className="font-bold text-paper leading-snug tracking-tight" style={{ fontSize: 'clamp(1.4rem, 3.2vw, 2.1rem)' }}>
          Un cliente enojado casi nunca te lo dice en la cara:{' '}
          <span className="text-amber">se va y no vuelve.</span>
          <br />Latido hace que te avise <span className="text-amber">a tiempo.</span>
        </motion.p>

        <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={inView ? { opacity: 1, scaleX: 1 } : {}} transition={{ duration: 0.6, delay: 0.5 }}
          className="w-14 h-[2px] bg-paper/30 mx-auto mt-9 mb-5" />
        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.65 }}
          className="font-mono text-[11px] text-paper/50 tracking-widest uppercase">
          El problema que Latido resuelve
        </motion.p>
      </div>
    </section>
  );
}
