import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import LatidoLogo from '../../components/branding/LatidoLogo';
import { usePageMeta } from '../../lib/seo';
import Alert from '../../components/ui/Alert';

const SECTIONS = [
  {
    title: '1. Qué datos se recolectan',
    body: [
      'Opinión del cliente: calificación de 1 a 5 estrellas, aspectos que marcó y comentario opcional. Es anónima: no incluye nombre ni ningún dato que identifique a la persona.',
      'Datos de contacto (solo si el cliente decide dejarlos): nombre y apellido, email y/o teléfono, y el canal por el que prefiere que lo contacten. Se piden únicamente cuando el cliente activa la opción “¿Querés que te contactemos?”.',
      'Datos de la cuenta del negocio: nombre, email, contraseña (guardada de forma cifrada) y datos del negocio.'
    ]
  },
  {
    title: '2. Para qué se usan',
    body: [
      'La opinión se usa para mostrarle al negocio cómo viene su atención. Los datos de contacto se usan solamente para que el negocio se comunique con el cliente en relación a ese comentario (por ejemplo, para pedir disculpas o resolver un problema).',
      'No se usan para publicidad, no se venden y no se comparten con terceros. Si en el futuro hubiera una finalidad distinta, se pedirá un consentimiento aparte.'
    ]
  },
  {
    title: '3. Consentimiento',
    body: [
      'Para dejar datos de contacto, el cliente debe tildar de forma expresa una casilla de consentimiento (nunca viene marcada). Se guarda la fecha y hora en que lo aceptó. Dejar datos es siempre opcional: no hace falta para enviar una opinión.'
    ]
  },
  {
    title: '4. Quién puede ver los datos',
    body: [
      'Los datos de contacto de un cliente solo pueden verlos las personas autorizadas del negocio al que el cliente le dejó su opinión. Un negocio nunca puede ver los datos de otro.',
      'El panel de administración de la plataforma muestra únicamente métricas agregadas (cantidades y promedios), sin comentarios ni datos personales de clientes.'
    ]
  },
  {
    title: '5. Cuánto tiempo se conservan',
    body: [
      'Los datos de contacto se eliminan automáticamente a los 12 meses de resuelto el caso. Si un contacto nunca llega a resolverse, se elimina como máximo a los 24 meses. La opinión anónima y las estadísticas pueden conservarse, porque no identifican a nadie.'
    ]
  },
  {
    title: '6. Tus derechos',
    body: [
      'Podés pedir acceso, rectificación o supresión de tus datos personales. Para pedir que se borren, escribile al negocio al que le dejaste tu opinión: desde su panel puede eliminar tus datos de contacto en cualquier momento, y el mensaje que te envió se elimina junto con ellos. También podés escribirnos a Latido y te ayudamos a canalizar el pedido.',
      'Quien resulte titular de datos personales tiene la facultad de ejercer el derecho de acceso en forma gratuita a intervalos no inferiores a seis meses (Ley 25.326). La Agencia de Acceso a la Información Pública es el órgano de control de la ley y atiende denuncias y reclamos.'
    ]
  },
  {
    title: '7. Seguridad',
    body: [
      'Las conexiones son cifradas y el acceso a los datos está restringido por permisos en la base de datos: cada negocio solo puede acceder a lo propio. Aun así, ningún sistema es 100% invulnerable; ante un incidente que afecte datos personales se avisará a quienes corresponda.'
    ]
  }
];

export default function PrivacyPage() {
  usePageMeta({
    title: 'Política de Privacidad · Latido',
    description: 'Cómo Latido protege los datos personales de clientes y negocios conforme a la Ley 25.326.'
  });
  useEffect(() => {
    const previous = document.title;
    document.title = 'Política de privacidad · Latido';
    window.scrollTo({ top: 0 });
    return () => { document.title = previous; };
  }, []);

  return (
    <div className="min-h-screen bg-paper-dim">
      <header className="bg-paper border-b-[1.5px] border-ink">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" aria-label="Volver al inicio"><LatidoLogo fontSize={20} symWidth={36} /></Link>
          <Link to="/" className="font-mono text-[11px] uppercase tracking-wider text-muted hover:text-ink underline">Volver al inicio</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <span className="font-mono text-[11px] uppercase tracking-widest text-teal font-bold">Legal</span>
        <h1 className="text-3xl font-bold tracking-tight mt-1">Política de privacidad</h1>
        <p className="font-mono text-xs text-muted mt-2">Última actualización: noviembre de 2026</p>

        <Alert variant="warning" title="Versión preliminar" className="mt-6">
          Este texto es un borrador y debe ser revisado por un profesional antes del lanzamiento comercial.
        </Alert>

        <div className="mt-8 space-y-8">
          {SECTIONS.map(s => (
            <section key={s.title} className="bg-paper border border-line-gray p-6 shadow-hard-line">
              <h2 className="font-bold text-[18px] mb-3">{s.title}</h2>
              <div className="space-y-3">
                {s.body.map(p => <p key={p.slice(0, 40)} className="text-[14px] text-ink/80 leading-relaxed">{p}</p>)}
              </div>
            </section>
          ))}
        </div>

        <p className="font-mono text-xs text-muted mt-10 text-center">
          Cada opinión, a tiempo. · Latido
        </p>
      </main>
    </div>
  );
}
