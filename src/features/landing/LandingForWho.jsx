import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { SectionHeader } from './landingUi';

const CLIENT = [
  'Opina escaneando o acercando el celular',
  'No instala nada ni crea una cuenta',
  'Termina en menos de 30 segundos',
  'Elige si deja sus datos: es opcional',
  'Sabe que su opinión llegó al local',
  'Si hubo un problema, alguien lo contacta'
];

const BUSINESS = [
  'Panel con todas tus opiniones en vivo',
  'Alertas de notas bajas al instante',
  'Modo Rescate con reloj y mensaje listo',
  'QR y NFC por sucursal, siempre tuyos',
  'Reseñas en Google sin arriesgar tu ficha',
  'Datos de clientes aislados y protegidos'
];

export default function LandingForWho() {
  return (
    <section className="py-24 px-6 bg-paper">
      <div className="max-w-5xl mx-auto">
        <SectionHeader tag="Para quién" title="Pensado para los dos lados del mostrador" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55 }} whileHover={{ x: -2, y: -2 }}
            className="bg-paper-dim border-[1.5px] border-ink p-8 shadow-hard-line">
            <div className="w-10 h-10 bg-ink text-paper flex items-center justify-center font-mono font-bold mb-5">01</div>
            <h3 className="font-bold text-[21px] mb-1">Para tu cliente</h3>
            <p className="text-muted text-[13px] mb-6">Tan simple que lo hace mientras espera el vuelto.</p>
            <ul className="space-y-3">
              {CLIENT.map(t => (
                <li key={t} className="flex items-start gap-3">
                  <span className="w-5 h-5 bg-teal/15 flex items-center justify-center shrink-0 mt-0.5"><Check size={12} className="text-teal" strokeWidth={3} /></span>
                  <span className="text-[13.5px] text-ink/80 leading-snug">{t}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, delay: 0.1 }} whileHover={{ x: -2, y: -2 }}
            className="bg-ink text-paper border-[1.5px] border-ink p-8 shadow-[4px_4px_0_#1F6F64]">
            <div className="w-10 h-10 bg-amber text-ink flex items-center justify-center font-mono font-bold mb-5">02</div>
            <h3 className="font-bold text-[21px] mb-1">Para tu negocio</h3>
            <p className="text-paper/60 text-[13px] mb-6">Bar, gimnasio, peluquería, tienda, restaurante: cualquier local con mostrador.</p>
            <ul className="space-y-3">
              {BUSINESS.map(t => (
                <li key={t} className="flex items-start gap-3">
                  <span className="w-5 h-5 bg-[#4DB3A1]/20 flex items-center justify-center shrink-0 mt-0.5"><Check size={12} className="text-[#4DB3A1]" strokeWidth={3} /></span>
                  <span className="text-[13.5px] text-paper/85 leading-snug">{t}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
