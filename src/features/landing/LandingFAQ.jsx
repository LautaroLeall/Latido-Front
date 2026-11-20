import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Reveal, SectionHeader } from './landingUi';

const FAQS = [
  { q: '¿Qué es un “soporte”?', a: 'Es el kit físico que va en tu mostrador: una lámina impresa con tu logo y un QR, un soporte de acrílico y un chip NFC pegado atrás. El QR y el chip abren el mismo ticket de opinión.' },
  { q: '¿Mis clientes tienen que instalar una app?', a: 'No. Escanean el QR con la cámara o acercan el celular al chip y se abre en el navegador, sin descargar ni registrarse.' },
  { q: '¿Funciona en iPhone?', a: 'Sí. El QR funciona en cualquier celular. Para el chip NFC en iPhone hay que acercarlo desbloqueado a la parte de arriba del teléfono; la lámina lo indica.' },
  { q: '¿Qué es el Modo Rescate?', a: 'Cuando un cliente deja una nota baja y sus datos, se abre un caso con cuenta regresiva y un mensaje de disculpa listo para enviar por WhatsApp o email. Después marcás si lo rescataste y Latido suma clientes recuperados y ventas estimadas.' },
  { q: '¿Los datos de mis clientes están protegidos?', a: 'Sí. La opinión es anónima por defecto; el nombre y el contacto se guardan aparte, solo con consentimiento, y únicamente tu negocio puede verlos dentro de la plataforma. Latido no los usa para publicidad ni los comparte. Se eliminan a los 12 meses de resuelto el caso. Más en la política de privacidad.' },
  { q: '¿Puedo usar mis soportes en varias sucursales?', a: 'Sí. Tu plan define cuántos soportes tenés y los podés usar en cualquier sucursal de tu negocio. Si abrís o cambiás de local, movés el soporte desde el panel sin regrabar el chip.' },
  { q: '¿Cómo se paga y puedo cambiar de plan?', a: 'El pago es mensual. Podés pasar a un plan con más soportes cuando lo necesites escribiéndonos por WhatsApp; los datos y el historial no se pierden.' },
  { q: '¿Latido me ayuda con las reseñas de Google?', a: 'Sí. Podés invitar a todos tus clientes a dejar una reseña en Google después de opinar. Lo hacemos sin filtrar por puntaje, que es lo que pide la política de Google para no sancionar tu ficha.' }
];

function FAQItem({ faq, open, onToggle }) {
  return (
    <div className="border-[1.5px] border-ink bg-paper">
      <button type="button" onClick={onToggle} aria-expanded={open}
        className="w-full flex justify-between items-center gap-4 px-5 py-4 text-left hover:bg-paper-dim transition-colors cursor-pointer">
        <span className="font-bold text-[14.5px]">{faq.q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="shrink-0">
          <ChevronDown size={18} className="text-muted" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }} className="overflow-hidden">
            <p className="px-5 pb-5 pt-3 text-muted text-[13.5px] leading-relaxed border-t border-dashed border-line-gray">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandingFAQ() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <section id="faq" className="py-24 px-6 bg-paper">
      <div className="max-w-3xl mx-auto">
        <SectionHeader tag="Preguntas frecuentes" title="Todo lo que querés saber" className="mb-12" />
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <Reveal key={faq.q} delay={i * 0.04}>
              <FAQItem faq={faq} open={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? null : i)} />
            </Reveal>
          ))}
        </div>
        <p className="text-center font-mono text-[12px] text-muted mt-8">
          Más detalle en nuestra <Link to="/privacidad" className="text-teal font-bold underline">política de privacidad</Link>.
        </p>
      </div>
    </section>
  );
}
