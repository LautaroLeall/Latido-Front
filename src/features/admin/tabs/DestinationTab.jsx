import React, { useEffect, useState } from 'react';
import { ArrowDown, ExternalLink, QrCode } from 'lucide-react';
import HardButton from '../../../components/ui/HardButton';
import Alert from '../../../components/ui/Alert';
import Field from '../../../components/ui/Field';
import Stamp from '../../../components/ui/Stamp';
import { supabase } from '../../../lib/supabaseClient';
import { getErrorMessage } from '../../../lib/errors';
import { buildFeedbackUrl } from '../../../lib/utils';
import { validateGoogleReviewUrl } from '../../../lib/validators';

const OPTIONS = [
  {
    id: 'panel',
    title: 'Solo mi panel (Latido)',
    badge: 'PRIVADO',
    desc: 'El cliente escanea el QR/NFC y responde únicamente el ticket privado de Latido (con Modo Rescate). Nunca se muestra Google.',
    steps: [
      'El cliente escanea tu QR o acerca el celular al chip NFC.',
      'Responde el ticket de Latido (estrellas, aspectos y comentario).',
      'La opinión llega al instante a tu panel y activa el Modo Rescate si corresponde.'
    ]
  },
  {
    id: 'google',
    title: 'Solo Google (redirección directa)',
    badge: 'DIRECTO',
    desc: 'El QR y el chip NFC llevan al cliente directamente a tu enlace de reseñas de Google Maps, sin pasar por el formulario de Latido.',
    steps: [
      'El cliente escanea tu QR o acerca el celular al chip NFC.',
      'Latido lo redirige automáticamente a tu ficha de Google Maps.',
      'No necesitás reimprimir el QR ni regrabar el chip NFC si algún día cambiás de modo.'
    ]
  },
  {
    id: 'both',
    title: 'Ambas: primero Latido y después Google (recomendado)',
    badge: 'RECOMENDADO',
    desc: 'Siempre responde primero el ticket de Latido. Al terminar, se le ofrece ir también a dejar su reseña en Google y el cliente elige si quiere ir o no.',
    steps: [
      'El cliente escanea tu QR o acerca el celular al chip NFC.',
      'Primero completa tu ticket de Latido (métricas + Modo Rescate).',
      'Al enviar, ve la invitación opcional “Sí, ir a Google” o “No, gracias” y elige.'
    ]
  }
];

export default function DestinationTab({ business, isAdmin, onSaved }) {
  const [destination, setDestination] = useState(business.review_destination || 'panel');
  const [googleUrl, setGoogleUrl] = useState(business.google_review_url || '');
  const [status, setStatus] = useState({ saving: false, error: '', ok: '' });
  const [sampleToken, setSampleToken] = useState(null);

  useEffect(() => {
    setDestination(business.review_destination || 'panel');
    setGoogleUrl(business.google_review_url || '');
  }, [business.review_destination, business.google_review_url]);

  // Primer QR activo para que el negocio pueda probar el destino real en 1 clic
  useEffect(() => {
    let cancelled = false;
    supabase
      .from('qr_codes')
      .select('token')
      .eq('business_id', business.id)
      .eq('active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setSampleToken(data?.token || null);
      })
      .catch(() => {
        if (!cancelled) setSampleToken(null);
      });
    return () => { cancelled = true; };
  }, [business.id]);

  const needsUrl = destination !== 'panel';
  const trimmedUrl = googleUrl.trim();
  const urlCheck = validateGoogleReviewUrl(trimmedUrl, { required: needsUrl });
  const validUrl = trimmedUrl.length > 0 && urlCheck.valid;
  const selectedOpt = OPTIONS.find(o => o.id === destination) || OPTIONS[0];
  const hasUnsavedChanges =
    destination !== (business.review_destination || 'panel') ||
    (trimmedUrl || '') !== (business.google_review_url || '');

  async function handleSave(e) {
    e.preventDefault();
    if (!isAdmin || status.saving) return;

    const check = validateGoogleReviewUrl(googleUrl, { required: needsUrl });
    if (!check.valid) {
      return setStatus({ saving: false, ok: '', error: check.error });
    }

    setStatus({ saving: true, error: '', ok: '' });
    try {
      const { error } = await supabase.from('businesses').update({
        review_destination: destination,
        google_review_url: check.value || null
      }).eq('id', business.id);
      if (error) throw error;
      await onSaved();
      setStatus({
        saving: false,
        error: '',
        ok:
          destination === 'google'
            ? 'Guardado. Desde ahora tus QR y chips NFC redirigen directo a Google Maps.'
            : destination === 'both'
              ? 'Guardado. Tus clientes responden primero en Latido y luego pueden elegir ir a Google.'
              : 'Guardado. Tus QR y chips NFC llevan únicamente al ticket privado de Latido.'
      });
    } catch (err) {
      setStatus({ saving: false, ok: '', error: getErrorMessage(err, 'No pudimos guardar la configuración.') });
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 items-start">
      <form onSubmit={handleSave} className="bg-paper p-4 sm:p-5 border border-line-gray shadow-hard-line space-y-5 min-w-0" noValidate>
        <div>
          <h2 className="text-lg font-bold">Destino de las reseñas</h2>
          <p className="text-sm text-muted mt-0.5">
            Elegí qué pasa cuando un cliente escanea tu QR o acerca el celular al chip NFC. El cambio aplica al instante sin reimprimir ni regrabar nada.
          </p>
        </div>

        {!isAdmin && <Alert variant="info">Solo el administrador puede modificar esta configuración.</Alert>}

        <fieldset className="space-y-3" disabled={!isAdmin}>
          {OPTIONS.map(opt => {
            const active = destination === opt.id;
            return (
              <label key={opt.id}
                className={`flex items-start gap-3 p-4 border-[1.5px] cursor-pointer transition-colors ${active ? 'border-teal bg-teal/5' : 'border-line-gray hover:border-ink'}`}>
                <input type="radio" name="destination" value={opt.id} checked={active}
                  onChange={() => { setDestination(opt.id); setStatus(s => ({ ...s, error: '', ok: '' })); }} className="mt-1" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm">{opt.title}</strong>
                    {opt.id === 'both' && <Stamp variant="teal">{opt.badge}</Stamp>}
                    {opt.id === 'google' && <Stamp variant="amber">{opt.badge}</Stamp>}
                  </span>
                  <span className="text-xs text-muted leading-relaxed block mt-1">{opt.desc}</span>
                </span>
              </label>
            );
          })}
        </fieldset>

        {destination === 'google' && (
          <Alert variant="warning" title="En modo Solo Google">
            El cliente pasa directo a Google Maps sin ver el formulario de Latido, por lo que no se registran opiniones
            ni casos de Modo Rescate en tu panel mientras esté activo este modo. Podés volver a “Ambas” o “Solo mi panel” cuando quieras.
          </Alert>
        )}

        {needsUrl && (
          <div className="space-y-2 pt-2 border-t border-dashed border-line-gray">
            <Field
              id="google-url"
              type="url"
              label="Enlace directo de reseñas de Google"
              disabled={!isAdmin}
              placeholder="https://g.page/r/XXXXXXXX/review"
              hint="Lo obtenés en Google Business Profile → Pedir reseñas → Copiar enlace (g.page, maps.app.goo.gl o google.com)."
              error={trimmedUrl && !urlCheck.valid ? urlCheck.error : undefined}
              value={googleUrl}
              onChange={e => { setGoogleUrl(e.target.value); setStatus(s => ({ ...s, error: '', ok: '' })); }}
              required
            />
            {validUrl && (
              <div>
                <HardButton as="a" size="sm" variant="secondary" href={urlCheck.value} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={13} /> Probar enlace de Google
                </HardButton>
              </div>
            )}
          </div>
        )}

        {status.error && <Alert variant="error">{status.error}</Alert>}
        {status.ok && <Alert variant="success">{status.ok}</Alert>}

        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <HardButton type="submit" disabled={status.saving}>
              {status.saving ? 'GUARDANDO...' : 'GUARDAR DESTINO'}
            </HardButton>
          )}
          {sampleToken && !hasUnsavedChanges && (
            <HardButton as="a" size="sm" variant="secondary" href={buildFeedbackUrl(sampleToken)} target="_blank" rel="noopener noreferrer">
              <QrCode size={13} /> Probar cómo funciona mi QR ahora
            </HardButton>
          )}
        </div>
      </form>

      {/* Panel derecho: recorrido paso a paso según el modo elegido */}
      <aside className="bg-paper border-[1.5px] border-ink p-5 shadow-hard-line space-y-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-teal font-bold">
            Recorrido del cliente
          </span>
          <h3 className="font-bold text-base mt-0.5">{selectedOpt.title}</h3>
        </div>

        <ol className="space-y-2">
          {selectedOpt.steps.map((step, i) => (
            <li key={step}>
              <div className="bg-paper-dim border border-line-gray p-3 flex items-start gap-2.5">
                <span className="bg-ink text-paper font-mono text-[11px] font-bold px-1.5 py-0.5 shrink-0">
                  0{i + 1}
                </span>
                <span className="text-xs leading-relaxed text-ink/90">{step}</span>
              </div>
              {i < selectedOpt.steps.length - 1 && (
                <div className="flex justify-center py-1 text-muted" aria-hidden="true">
                  <ArrowDown size={14} />
                </div>
              )}
            </li>
          ))}
        </ol>

        <div className="pt-3 border-t border-dashed border-line-gray space-y-1.5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold">
            Política anti “review gating” de Google
          </div>
          <p className="text-xs text-muted leading-relaxed">
            En el modo <strong>Ambas</strong>, la invitación a Google se muestra a todos los clientes por igual después de opinar en Latido,
            sin filtrar por estrellas, para proteger tu ficha de Google Maps contra sanciones.
          </p>
        </div>
      </aside>
    </div>
  );
}
