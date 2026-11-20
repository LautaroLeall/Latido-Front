import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, Zap, LifeBuoy, ShieldCheck, Star, Building2 } from 'lucide-react';
import { Reveal, SectionHeader } from './landingUi';

const FEATURES = [
  { icon: QrCode, title: 'QR y NFC con una sola URL', desc: 'El código y el chip abren el mismo ticket. Si perdés una lámina, la desactivás desde el panel y el resto sigue funcionando.', badge: null },
  { icon: Zap, title: 'Opiniones en tiempo real', desc: 'Cada respuesta aparece en tu panel al instante, sin recargar. Promedio, distribución de estrellas y lo que más mencionan tus clientes.', badge: 'En vivo' },
  { icon: LifeBuoy, title: 'Modo Rescate', desc: 'Nota baja + contacto = caso con reloj, mensaje de disculpa listo y contador de clientes rescatados y ventas recuperadas.', badge: 'Estrella', highlight: true },
  { icon: ShieldCheck, title: 'Privacidad por diseño', desc: 'La opinión es anónima por defecto. El contacto se guarda aparte, solo con consentimiento, y solo lo ve tu negocio (Ley 25.326).', badge: null },
  { icon: Star, title: 'Google, sin trampas', desc: 'Invitá a todos tus clientes a dejar una reseña en Google, sin filtrar por puntaje: cumple la política de Google y cuida tu ficha.', badge: null },
  { icon: Building2, title: 'Todas tus sucursales', desc: 'Tus soportes se usan en cualquier sucursal de tu negocio y los podés mover cuando quieras, sin regrabar el chip.', badge: null }
];

export default function LandingFeatures() {
  return (
    <section id="funciones" className="py-24 px-6 bg-paper-dim">
      <div className="max-w-5xl mx-auto">
        <SectionHeader tag="Funciones" title="Todo lo que necesitás, en un solo lugar"
          subtitle="Sin integraciones ni planillas. Latido cubre desde que el cliente opina hasta que lo recuperás." />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={(i % 3) * 0.08}>
                <motion.div
                  whileHover={{ rotateY: 3, rotateX: -2, x: -2, y: -2 }}
                  style={{ transformPerspective: 900 }}
                  className={`relative h-full bg-paper border-[1.5px] p-6 ${f.highlight ? 'border-teal shadow-hard-teal' : 'border-ink shadow-hard-line'}`}
                >
                  {f.badge && (
                    <span className={`absolute top-4 right-4 font-mono font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 ${f.highlight ? 'bg-teal text-paper' : 'border border-teal text-teal'}`}>
                      {f.badge}
                    </span>
                  )}
                  <div className="w-11 h-11 bg-paper-dim border border-line-gray flex items-center justify-center mb-4">
                    <Icon size={20} className={f.highlight ? 'text-teal' : 'text-ink'} />
                  </div>
                  <h3 className="font-bold text-[16px] mb-2 leading-snug">{f.title}</h3>
                  <p className="text-muted text-[13px] leading-relaxed">{f.desc}</p>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
