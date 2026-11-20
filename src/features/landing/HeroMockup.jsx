import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Stamp from '../../components/ui/Stamp';
import { STAR_PATH } from '../../components/ui/StarIcon';
import BusinessMonogram from '../../components/branding/BusinessMonogram';
import LatidoSymbol from '../../components/branding/LatidoSymbol';

export const TOUR_STEPS = [
  { id: 'ticket', url: 'latido.app/f/cafeteria-del-sol-…', caption: '1 · El cliente escanea y opina' },
  { id: 'panel', url: 'latido.app/admin', caption: '2 · Te llega al instante' },
  { id: 'rescate', url: 'latido.app/admin?tab=rescate', caption: '3 · Lo rescatás antes de que se vaya' }
];

function StepTicket() {
  return (
    <div className="p-5">
      <div className="flex justify-between font-mono text-[10px] text-muted">
        <span>TICKET DE OPINIÓN</span><span>HOY</span>
      </div>
      <div className="flex items-center gap-2.5 mt-2">
        <BusinessMonogram text="CS" size={34} />
        <div>
          <div className="font-bold text-[15px] leading-tight">Cafetería del Sol</div>
          <div className="font-mono text-[10px] text-muted">Sucursal Centro</div>
        </div>
      </div>
      <div className="border-t-[1.5px] border-dashed border-line-gray my-3" />
      <div className="text-[13px] font-semibold">¿Cómo fue tu experiencia hoy?</div>
      <div className="flex gap-1 my-2">
        {[1, 2, 3, 4, 5].map(i => (
          <svg key={i} width="30" height="30" viewBox="0 0 24 24" stroke="#C89B3C" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
            <motion.path d={STAR_PATH}
              initial={{ fill: 'rgba(200,155,60,0)' }}
              animate={{ fill: i <= 2 ? '#C89B3C' : 'rgba(200,155,60,0)' }}
              transition={{ delay: 0.35 + i * 0.22, duration: 0.2 }} />
          </svg>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
        className="font-mono font-bold text-[11px] uppercase tracking-wider text-alert-red">
        Disconforme
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}
        className="mt-3 border-[1.5px] border-dashed border-alert-red bg-alert-red/5 p-2.5 flex gap-2 items-start">
        <span className="w-4 h-4 bg-ink text-paper flex items-center justify-center font-mono text-[11px] shrink-0">✓</span>
        <span className="text-[12px] font-medium leading-tight">
          Lamentamos eso. ¿Querés que alguien del local te contacte para solucionarlo?
        </span>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.1 }}
        className="mt-3 bg-ink text-paper font-mono font-bold text-[11px] uppercase tracking-wider text-center py-2.5 shadow-hard-teal">
        Enviar opinión
      </motion.div>
    </div>
  );
}

function StepPanel() {
  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { l: 'Promedio', v: '4.4', c: 'text-ink' },
          { l: 'Opiniones', v: '12', c: 'text-ink' },
          { l: 'Alertas', v: '1', c: 'text-alert-red' }
        ].map((s, i) => (
          <motion.div key={s.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="border border-line-gray p-2.5 shadow-hard-line bg-paper">
            <div className="font-mono text-[9px] uppercase tracking-wider text-muted">{s.l}</div>
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, type: 'spring', stiffness: 160 }}
          className="border border-line-gray border-l-4 border-l-alert-red p-2.5 bg-paper">
          <div className="flex justify-between items-center">
            <span className="font-mono font-bold text-amber tracking-widest text-[13px]">★★☆☆☆</span>
            <Stamp variant="amber">Dejó contacto</Stamp>
          </div>
          <p className="text-[12px] mt-1">“Tardaron mucho en traer los cafés.”</p>
          <div className="font-mono text-[10px] text-muted mt-1">recién · Sucursal Centro</div>
        </motion.div>
        {[
          { s: '★★★★★', t: 'Excelente atención, volvemos seguro.', c: 'border-l-teal' },
          { s: '★★★★☆', t: 'Todo bien, faltó variedad de pastelería.', c: 'border-l-teal' }
        ].map((r, i) => (
          <motion.div key={r.t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 + i * 0.15 }}
            className={`border border-line-gray border-l-4 ${r.c} p-2.5 bg-paper`}>
            <span className="font-mono font-bold text-amber tracking-widest text-[12px]">{r.s}</span>
            <p className="text-[12px] mt-0.5">“{r.t}”</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StepRescue() {
  const [rescued, setRescued] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRescued(true), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="p-4">
      <motion.div
        animate={rescued ? { borderColor: '#1F6F64' } : { borderColor: ['#B3423A', '#B3423A'] }}
        className={`relative border-2 p-4 bg-paper ${rescued ? 'shadow-hard-teal' : 'shadow-hard-red'}`}>
        <div className="flex justify-between items-start gap-2">
          <div>
            <div className="font-mono font-bold text-amber tracking-widest text-[15px]">★★☆☆☆</div>
            <div className="font-mono text-[10px] text-muted">Sucursal Centro · hace 12 min</div>
          </div>
          {rescued ? <Stamp variant="teal">Rescatado</Stamp> : (
            <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
              <Stamp variant="red">Rescatar · 47 min</Stamp>
            </motion.div>
          )}
        </div>
        <p className="text-[13px] font-medium my-2.5">“Tardaron mucho en traer los cafés.”</p>
        <div className="font-mono text-[10px] text-muted mb-2">Cliente: <strong className="text-ink">Martín</strong> · Prefiere WhatsApp</div>
        <div className="border border-ink p-2 text-[11px] leading-snug bg-paper-dim">
          Hola Martín, soy Sofía de Cafetería del Sol. Gracias por tu opinión; lamento que no haya estado a la altura…
        </div>
        <div className="flex gap-2 mt-3">
          <div className="bg-ink text-paper font-mono font-bold text-[10px] uppercase tracking-wider px-3 py-2">Abrir WhatsApp</div>
          <div className="border border-ink font-mono font-bold text-[10px] uppercase tracking-wider px-3 py-2">Descartar</div>
        </div>
        <AnimatePresence>
          {rescued && (
            <motion.div initial={{ opacity: 0, scale: 1.6, rotate: -12 }} animate={{ opacity: 1, scale: 1, rotate: -6 }}
              transition={{ type: 'spring', stiffness: 220, damping: 14 }}
              className="absolute right-3 bottom-3 border-[3px] border-teal text-teal font-mono font-bold text-[18px] tracking-widest px-3 py-1 bg-paper/90 select-none">
              +$ 8.500
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

const STEP_VIEWS = { ticket: StepTicket, panel: StepPanel, rescate: StepRescue };

export default function HeroMockup() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => setIdx(i => (i + 1) % TOUR_STEPS.length), 4800);
    return () => clearInterval(t);
  }, [paused]);

  const step = TOUR_STEPS[idx];
  const View = STEP_VIEWS[step.id];

  return (
    <div className="relative w-full max-w-[470px] mx-auto"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="bg-paper border-[1.5px] border-ink shadow-[7px_7px_0_#1F6F64] overflow-hidden">
        {/* Barra de dirección */}
        <div className="bg-paper-dim px-3 py-2 flex items-center gap-2 border-b-[1.5px] border-ink">
          <LatidoSymbol width={20} />
          <div className="flex-1 bg-paper border border-line-gray px-2 py-1 font-mono text-[10px] text-muted truncate">{step.url}</div>
          <span className="font-mono font-bold text-[9px] text-teal uppercase tracking-wider">● en vivo</span>
        </div>

        <div className="min-h-[360px]">
          <AnimatePresence mode="wait">
            <motion.div key={step.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.32 }}>
              <View />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Perforación + leyenda del paso */}
        <div className="perf-edge" aria-hidden="true" />
        <div className="px-4 py-2.5 flex items-center justify-between gap-3 bg-paper">
          <span className="font-mono text-[11px] font-bold text-ink">{step.caption}</span>
          <div className="flex gap-1.5">
            {TOUR_STEPS.map((s, i) => (
              <button key={s.id} type="button" onClick={() => setIdx(i)} aria-label={`Ver paso ${i + 1}`}
                className={`h-2 transition-all cursor-pointer ${i === idx ? 'w-6 bg-teal' : 'w-2 bg-line-gray hover:bg-muted'}`} />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
