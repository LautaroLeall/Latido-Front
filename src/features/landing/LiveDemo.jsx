import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Stamp from '../../components/ui/Stamp';
import StarIcon from '../../components/ui/StarIcon';
import BusinessMonogram from '../../components/branding/BusinessMonogram';
import HardButton from '../../components/ui/HardButton';

const MOODS = ['', 'Pésimo', 'Disconforme', 'Regular', 'Muy bueno', '¡Excelente!'];

const SEED = [
  {
    id: 's1',
    stars: 5,
    text: 'Excelente atención, volvemos seguro.',
    ago: 'hace 15 min'
  },
  {
    id: 's2',
    stars: 4,
    text: 'Todo bien, faltó variedad de pastelería.',
    ago: 'hace 1 h'
  }
];

function Stars({ value, size = 30, onPick, hover, onHover }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Calificación de 1 a 5 estrellas" onMouseLeave={() => onHover?.(0)}>
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" role="radio" aria-checked={value === i} aria-label={`${i} estrellas`}
          onClick={() => onPick(i)} onMouseEnter={() => onHover?.(i)}
          className="p-0.5 hover:scale-110 active:scale-95 transition-transform cursor-pointer">
          <StarIcon size={size} filled={i <= (hover || value)} />
        </button>
      ))}
    </div>
  );
}

/** Mini ticket del cliente + espejo del panel del negocio, todo en el navegador (nada se guarda) */
export default function LiveDemo() {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [wantContact, setWantContact] = useState(false);
  const [items, setItems] = useState(SEED);
  const [rescue, setRescue] = useState(null); // { id, minutes }
  const [sent, setSent] = useState(false);

  const low = stars > 0 && stars <= 2;

  // Cuenta regresiva del caso de rescate (1 s de demo = 1 min)
  useEffect(() => {
    if (!rescue || rescue.done) return undefined;
    const t = setInterval(() => {
      setRescue(r => (r && r.minutes > 0 ? { ...r, minutes: r.minutes - 1 } : r));
    }, 1000);
    return () => clearInterval(t);
  }, [rescue]);

  function pick(n) {
    setStars(n);
    setSent(false);
    setWantContact(n <= 2);
  }

  function submit() {
    if (!stars) return;
    const id = `d${Date.now()}`;
    const text = low ? 'Tardaron mucho en traer los cafés.' : stars === 3 ? 'Rico, pero un poco caro.' : 'Muy buena experiencia, gracias.';
    setItems(prev => [{ id, stars, text, ago: 'recién', contact: low && wantContact }, ...prev].slice(0, 4));
    if (low && wantContact) setRescue({ id, minutes: 60, done: false });
    setSent(true);
    setStars(0);
    setWantContact(false);
  }

  function reset() {
    setItems(SEED); setRescue(null); setSent(false); setStars(0); setWantContact(false);
  }

  const avg = (items.reduce((a, i) => a + i.stars, 0) / items.length).toFixed(1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-8 items-start">
      {/* Celular del cliente */}
      <div>
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted mb-2 text-center">① Lo que ve tu cliente</div>
        <div className="mx-auto w-full max-w-[340px] bg-ink p-2.5 shadow-hard-teal">
          <div className="bg-paper">
            <div className="perf-edge" aria-hidden="true" />
            <div className="px-5 py-4">
              <div className="flex items-center gap-2.5">
                <BusinessMonogram text="CS" size={36} />
                <div>
                  <div className="font-bold text-[15px] leading-tight">Cafetería del Sol</div>
                  <div className="font-mono text-[10px] text-muted">Sucursal Centro</div>
                </div>
              </div>
              <div className="border-t-[1.5px] border-dashed border-line-gray my-3" />
              <div className="text-[13.5px] font-semibold mb-1">¿Cómo fue tu experiencia hoy?</div>
              <Stars value={stars} hover={hover} onHover={setHover} onPick={pick} />
              <div className={`font-mono font-bold text-[11px] uppercase tracking-wider h-4 mt-1 ${low ? 'text-alert-red' : 'text-teal'}`} aria-live="polite">
                {MOODS[hover || stars]}
              </div>

              <AnimatePresence>
                {low && (
                  <motion.button type="button" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    onClick={() => setWantContact(v => !v)}
                    className="mt-2 w-full text-left border-[1.5px] border-dashed border-alert-red bg-alert-red/5 p-2.5 flex gap-2 items-start cursor-pointer overflow-hidden">
                    <span className={`w-4 h-4 border-[1.5px] border-ink flex items-center justify-center font-mono text-[11px] shrink-0 ${wantContact ? 'bg-ink text-paper' : 'bg-paper'}`}>
                      {wantContact ? '✓' : ''}
                    </span>
                    <span className="text-[12px] font-medium leading-tight">
                      Lamentamos eso. ¿Querés que alguien del local te contacte para solucionarlo?
                    </span>
                  </motion.button>
                )}
              </AnimatePresence>

              <HardButton className="w-full mt-4" disabled={!stars} onClick={submit}>Enviar opinión</HardButton>
              {sent && <p className="font-mono text-[11px] text-teal font-bold text-center mt-2">✓ ¡Gracias! Mirá cómo llegó a tu panel →</p>}
              {!stars && !sent && <p className="font-mono text-[10.5px] text-muted text-center mt-2">Tocá una estrella para probar</p>}
            </div>
            <div className="perf-edge" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Panel del negocio (espejo) */}
      <div>
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted mb-2 flex justify-between items-center">
          <span>② Lo que ves vos, en tu panel</span>
          <button type="button" onClick={reset} className="underline hover:text-ink cursor-pointer normal-case tracking-normal">Reiniciar demo</button>
        </div>
        <div className="bg-paper border-[1.5px] border-ink shadow-hard-line">
          <div className="bg-ink text-paper px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2"><BusinessMonogram text="CS" size={24} variant="light" /><span className="font-bold text-[13px]">Cafetería del Sol</span></div>
            <span className="font-mono text-[10px] text-[#4DB3A1] uppercase tracking-wider">● en vivo</span>
          </div>

          <div className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[['Promedio', avg, 'text-ink'], ['Opiniones', items.length, 'text-ink'], ['Casos abiertos', rescue ? 1 : 0, rescue ? 'text-alert-red' : 'text-ink']].map(([l, v, c]) => (
                <div key={l} className="border border-line-gray p-2.5 shadow-hard-line">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-muted">{l}</div>
                  <motion.div key={String(v)} initial={{ scale: 1.25 }} animate={{ scale: 1 }} className={`text-2xl font-bold ${c}`}>{v}</motion.div>
                </div>
              ))}
            </div>

            <AnimatePresence>
              {rescue && (
                <motion.div initial={{ opacity: 0, y: -12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
                  className={`border-2 p-3.5 ${rescue.done ? 'border-teal shadow-hard-teal' : 'border-alert-red shadow-hard-red'}`}>
                  <div className="flex justify-between items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-amber tracking-widest">★★☆☆☆</span>
                    {rescue.done ? <Stamp variant="teal">Rescatado</Stamp> : <Stamp variant="red">Rescatar · {rescue.minutes} min</Stamp>}
                  </div>
                  <p className="text-[13px] font-medium my-2">“Tardaron mucho en traer los cafés.”</p>
                  <div className="font-mono text-[10px] text-muted mb-2">Cliente dejó su contacto · WhatsApp</div>
                  {!rescue.done && (
                    <div className="flex gap-2 flex-wrap">
                      <HardButton size="sm" onClick={() => setRescue(r => ({ ...r, done: true }))}>Enviar mensaje y rescatar</HardButton>
                    </div>
                  )}
                  {rescue.done && <p className="font-mono text-[11px] text-teal font-bold">+$ 8.500 recuperados (estimado)</p>}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {items.map(it => (
                  <motion.div key={it.id} layout initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    className={`border border-line-gray border-l-4 p-2.5 ${it.stars <= 2 ? 'border-l-alert-red' : it.stars === 3 ? 'border-l-amber' : 'border-l-teal'}`}>
                    <div className="flex justify-between items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-amber tracking-widest text-[12px]">{'★'.repeat(it.stars)}{'☆'.repeat(5 - it.stars)}
                        <span className="text-muted font-normal tracking-normal ml-2 text-[10px]">{it.ago}</span></span>
                      {it.contact ? <Stamp variant="amber">Dejó contacto</Stamp> : <Stamp variant="ink">Anónimo</Stamp>}
                    </div>
                    <p className="text-[12.5px] mt-1">“{it.text}”</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
