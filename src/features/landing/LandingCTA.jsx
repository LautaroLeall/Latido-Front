import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MessageCircle, Mail } from 'lucide-react';
import LatidoLogo from '../../components/branding/LatidoLogo';
import { Reveal, scrollToSection } from './landingUi';
import { buildWhatsAppUrl, buildMailUrl, displayPhone, CONTACT_EMAIL } from '../../lib/contact';

const FOOTER_LINKS = [
  { label: 'Cómo funciona', id: 'como-funciona' },
  { label: 'Funciones', id: 'funciones' },
  { label: 'Planes', id: 'planes' },
  { label: 'Preguntas', id: 'faq' }
];

export default function LandingCTA() {
  return (
    <>
      <section className="relative py-24 px-6 overflow-hidden bg-ink">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'linear-gradient(#FAF8F3 1px, transparent 1px), linear-gradient(90deg, #FAF8F3 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
        <Reveal className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="font-bold text-paper tracking-tight leading-tight" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
            Empezá a escuchar a tus clientes <span className="text-amber">hoy.</span>
          </h2>
          <p className="text-paper/70 text-[16px] mt-4 mb-9 leading-relaxed">
            Elegí tu plan, coordinamos por WhatsApp y te activamos tu cuenta con tus primeros soportes QR + NFC listos para el mostrador.
          </p>

          <div className="flex flex-col items-center gap-5">
            <a href={buildWhatsAppUrl('Hola, quiero activar Latido en mi negocio.')} target="_blank" rel="noopener noreferrer">
              <motion.span whileHover={{ x: -1, y: -1 }} whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 bg-paper text-ink font-mono font-bold uppercase tracking-wider text-[13px] px-8 min-h-[52px] border-[1.5px] border-paper shadow-[4px_4px_0_#C89B3C] cursor-pointer">
                Activar Latido por WhatsApp <ArrowRight size={16} />
              </motion.span>
            </a>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              <a href={buildWhatsAppUrl('Hola, quiero consultar por Latido para mi negocio.')} target="_blank" rel="noopener noreferrer"
                className="border-[1.5px] border-paper/35 text-paper font-mono text-[12px] px-4 py-3 flex items-center justify-center gap-2 hover:bg-paper/10 transition-colors">
                <MessageCircle size={14} className="text-[#4DB3A1]" /> {displayPhone()}
              </a>
              <a href={buildMailUrl('Consulta sobre Latido', 'Hola, quiero consultar por Latido para mi negocio.')}
                target="_blank" rel="noopener noreferrer"
                className="border-[1.5px] border-paper/35 text-paper font-mono text-[12px] px-4 py-3 flex items-center justify-center gap-2 hover:bg-paper/10 transition-colors break-all">
                <Mail size={14} className="text-[#4DB3A1] shrink-0" /> {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="bg-[#0F1119] px-6 py-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <LatidoLogo variant="dark" fontSize={16} symWidth={30} />

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {FOOTER_LINKS.map(({ label, id }) => (
              <button key={id} type="button" onClick={() => scrollToSection(id)}
                className="font-mono text-[11px] uppercase tracking-wider text-paper/45 hover:text-paper/80 transition-colors cursor-pointer">
                {label}
              </button>
            ))}
            <Link to="/privacidad" className="font-mono text-[11px] uppercase tracking-wider text-paper/45 hover:text-paper/80 transition-colors">
              Privacidad
            </Link>
            <Link to="/login" className="font-mono text-[11px] uppercase tracking-wider text-paper/45 hover:text-paper/80 transition-colors">
              Ingresar
            </Link>
          </div>

          <div className="text-center md:text-right">
            <p className="font-mono text-[11px] text-paper/50">Cada opinión, a tiempo.</p>
            <p className="font-mono text-[10px] text-paper/30 mt-0.5">© {new Date().getFullYear()} Latido · Todos los derechos reservados</p>
          </div>
        </div>
      </footer>
    </>
  );
}
