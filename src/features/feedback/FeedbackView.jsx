import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Stamp from '../../components/ui/Stamp';
import HardButton from '../../components/ui/HardButton';
import StarIcon from '../../components/ui/StarIcon';
import LatidoSymbol from '../../components/branding/LatidoSymbol';
import BusinessLogo from '../../components/branding/BusinessLogo';
import TicketCard from '../../components/ui/TicketCard';
import Alert from '../../components/ui/Alert';
import { callPublicRpc, isPublicRpcConfigured } from '../../lib/publicRpc';
import { getErrorMessage } from '../../lib/errors';
import { resolveSurveyConfig } from '../../lib/surveyConfig';
import { validateEmail, validatePersonName, validatePhone } from '../../lib/validators';
import { usePageMeta } from '../../lib/seo';

const MOODS = ['', 'Pésimo', 'Disconforme', 'Regular', 'Muy bueno', '¡Excelente!'];

// Ticket de demostración (/f/demo): no toca la base de datos
const DEMO_BUSINESS = {
  token_valid: true,
  business_name: 'Cafetería del Sol',
  branch_name: 'Sucursal Centro',
  logo_url: null,
  review_destination: 'both',
  google_review_url: 'https://maps.google.com',
  rescue_enabled: true,
  rescue_threshold: 2
};

const isSafeHttpsUrl = (url) => typeof url === 'string' && /^https:\/\/\S+$/i.test(url);

const INITIAL_FORM = {
  stars: 0, tags: [], comment: '', wantContact: false, contactTouched: false,
  name: '', email: '', phone: '', channel: 'whatsapp', consent: false, website: ''
};

export default function FeedbackView() {
  const { token } = useParams();
  const isDemo = token === 'demo';

  const [business, setBusiness] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | invalid | error | unconfigured
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [googleDeclined, setGoogleDeclined] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (patch) => {
    setForm(prev => ({ ...prev, ...patch }));
    const keys = Object.keys(patch);
    if (keys.length) {
      setFieldErrors(prev => {
        const next = { ...prev };
        for (const k of keys) delete next[k];
        return next;
      });
    }
  };

  // ── Cargar datos públicos del negocio ──────────────────────────────────────
  const loadBusiness = useCallback(async (signal) => {
    setLoadState('loading');
    setBusiness(null);
    if (isDemo) {
      setBusiness(DEMO_BUSINESS);
      setLoadState('ready');
      return;
    }
    if (!isPublicRpcConfigured) {
      setLoadState('unconfigured');
      return;
    }
    try {
      const { data, error } = await callPublicRpc('get_business_by_token', { p_token: token }, { signal });
      if (signal?.aborted) return;
      if (error) throw error;
      if (!data?.token_valid) {
        setLoadState('invalid');
        return;
      }
      setBusiness(data);
      setLoadState('ready');
    } catch (err) {
      if (signal?.aborted) return;
      console.error('[LATIDO] Error cargando negocio por token:', err);
      setLoadState('error');
    }
  }, [token, isDemo]);

  useEffect(() => {
    // Reinicia el formulario si cambia el token en la URL sin desmontar el componente
    setForm(INITIAL_FORM);
    setErrors([]);
    setFieldErrors({});
    setSubmitted(false);
    setGoogleDeclined(false);

    const ctrl = new AbortController();
    loadBusiness(ctrl.signal);
    return () => ctrl.abort();
  }, [loadBusiness]);

  usePageMeta({
    title: isDemo
      ? 'Probá el Ticket de Opinión QR y NFC en Vivo | Latido'
      : business?.business_name
        ? `${business.business_name} · Tu opinión`
        : 'Ticket de opinión · Latido',
    description: isDemo
      ? 'Probá en vivo el ticket digital QR y NFC de Latido sin registrarte: calificá en 30 segundos, elegí aspectos y descubrí el flujo de Google y Modo Rescate.'
      : business?.business_name
        ? `Contanos en 30 segundos cómo fue tu experiencia en ${business.business_name}.`
        : 'Dejá tu opinión en 30 segundos.',
    noindex: !isDemo
  });

  const directGoogle =
    loadState === 'ready' &&
    !isDemo &&
    business?.review_destination === 'google' &&
    isSafeHttpsUrl(business?.google_review_url);

  // Modo "Solo Google": el QR/NFC lleva directo a la ficha de Google Maps sin pasar por el formulario
  useEffect(() => {
    if (!directGoogle) return;
    window.location.replace(business.google_review_url);
  }, [directGoogle, business?.google_review_url]);

  const threshold = business?.rescue_threshold ?? 2;
  const isLowRating = form.stars > 0 && form.stars <= threshold;

  function handleStarClick(rating) {
    setErrors([]);
    setForm(prev => ({
      ...prev,
      stars: rating,
      // Ofrecer contacto automáticamente en calificaciones bajas (si el cliente no lo tocó antes)
      wantContact: prev.contactTouched ? prev.wantContact : rating <= threshold && !!business?.rescue_enabled
    }));
    if (rating === 5 && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      import('canvas-confetti')
        .then(({ default: fire }) =>
          fire({ particleCount: 40, spread: 60, origin: { y: 0.7 }, colors: ['#C89B3C', '#1F6F64', '#FAF8F3'] })
        )
        .catch(() => { });
    }
  }

  function toggleTag(tag) {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
    }));
  }

  function validate() {
    const errs = [];
    const perField = {};

    if (form.stars < 1) {
      errs.push('Elegí una calificación de 1 a 5 estrellas.');
    }

    if (form.wantContact) {
      const nameRes = validatePersonName(form.name, {
        required: true,
        min: 3,
        max: 120,
        requireTwoWords: true,
        label: 'Tu nombre y apellido'
      });
      if (!nameRes.valid) {
        perField.name = nameRes.error;
        errs.push(nameRes.error);
      }

      const emailRes = validateEmail(form.email, { required: false, label: 'El email' });
      const phoneRes = validatePhone(form.phone, { required: false, label: 'El teléfono' });
      const hasEmail = form.email.trim().length > 0;
      const hasPhone = form.phone.trim().length > 0;

      if (!hasEmail && !hasPhone) {
        const msg = 'Completá al menos un medio de contacto (teléfono/WhatsApp o email).';
        perField.phone = msg;
        errs.push(msg);
      }
      if (hasEmail && !emailRes.valid) {
        perField.email = emailRes.error;
        errs.push(emailRes.error);
      }
      if (hasPhone && !phoneRes.valid) {
        perField.phone = phoneRes.error;
        errs.push(phoneRes.error);
      }
      if (form.channel === 'email' && !hasEmail && hasPhone) {
        const msg = 'Elegiste Email como canal preferido: completá tu dirección de email.';
        perField.email = msg;
        errs.push(msg);
      }
      if (form.channel !== 'email' && !hasPhone && hasEmail) {
        const msg = 'Elegiste WhatsApp o llamada: completá tu número de teléfono.';
        perField.phone = msg;
        errs.push(msg);
      }
      if (!form.consent) {
        perField.consent = 'Tenés que aceptar el consentimiento para que podamos contactarte.';
        errs.push(perField.consent);
      }
    }

    setFieldErrors(perField);
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;
    const validationErrors = validate();
    if (validationErrors.length) {
      setErrors(validationErrors);
      return;
    }

    const cleanName = form.wantContact ? validatePersonName(form.name, { required: true, min: 3, max: 120, requireTwoWords: true }).value : null;
    const cleanEmail = form.wantContact ? (validateEmail(form.email, { required: false }).value || null) : null;
    const cleanPhoneRes = form.wantContact ? validatePhone(form.phone, { required: false }) : null;
    const cleanPhone = cleanPhoneRes?.whatsappDigits ? `+${cleanPhoneRes.whatsappDigits}` : null;

    setIsSubmitting(true);
    setErrors([]);
    try {
      if (!isDemo) {
        const { error } = await callPublicRpc('submit_feedback', {
          p_token: token,
          p_stars: form.stars,
          p_tags: form.tags,
          p_comment: form.comment.trim() || null,
          p_contact_name: cleanName,
          p_contact_email: cleanEmail,
          p_contact_phone: cleanPhone,
          p_preferred_channel: form.channel,
          p_consent: form.wantContact && form.consent,
          p_website: form.website || null
        });
        if (error) {
          if (/no válido o inactivo/i.test(error.message || '')) {
            setLoadState('invalid');
            return;
          }
          throw error;
        }
      }
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('[LATIDO] Error enviando feedback:', err);
      // Nunca simular éxito: el cliente tiene que saber si su opinión llegó
      setErrors([getErrorMessage(err, 'No pudimos enviar tu opinión. Revisá tu conexión y probá de nuevo.')]);
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setErrors([]);
    setFieldErrors({});
    setSubmitted(false);
    setGoogleDeclined(false);
  }

  const wrapper = (children) => (
    <div className="max-w-[440px] mx-auto px-4 py-6 md:py-10">
      {isDemo && (
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-dashed border-line-gray">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-ink hover:text-teal transition-colors"
          >
            ← Volver a Latido
          </Link>
          <Stamp variant="amber">Demo</Stamp>
        </div>
      )}
      {children}
    </div>
  );

  // ── Estados de carga / error ───────────────────────────────────────────────
  if (loadState === 'loading') {
    return wrapper(
      <TicketCard bodyClassName="p-10 text-center">
        <div className="animate-pulse inline-block"><LatidoSymbol width={44} /></div>
        <div className="font-mono text-muted text-xs uppercase tracking-wider mt-3">Imprimiendo tu ticket...</div>
      </TicketCard>
    );
  }

  if (loadState === 'invalid') {
    return wrapper(
      <TicketCard shadow="red" bodyClassName="p-8 text-center">
        <Stamp variant="red">QR inactivo</Stamp>
        <h1 className="text-xl font-bold mt-4 tracking-tight">Este código no está activo</h1>
        <p className="text-muted text-sm mt-2 leading-relaxed">
          El QR o chip NFC que escaneaste no corresponde a ningún local activo en Latido.
          Si creés que es un error, avisale al personal del local.
        </p>
      </TicketCard>
    );
  }

  if (loadState === 'error' || loadState === 'unconfigured') {
    return wrapper(
      <TicketCard shadow="red" bodyClassName="p-8 text-center">
        <Stamp variant="red">Sin conexión</Stamp>
        <h1 className="text-xl font-bold mt-4 tracking-tight">No pudimos cargar el ticket</h1>
        <p className="text-muted text-sm mt-2">Revisá tu conexión a internet y probá de nuevo.</p>
        {loadState === 'error' && (
          <HardButton className="mt-5" size="sm" onClick={() => loadBusiness()}>Reintentar</HardButton>
        )}
      </TicketCard>
    );
  }

  const businessName = business.business_name;
  const survey = resolveSurveyConfig(business.survey_questions);
  const showGoogleAfter = business.review_destination === 'both' && isSafeHttpsUrl(business.google_review_url);

  // ── Redirección directa a Google (modo "Solo Google") ──────────────────────
  if (directGoogle) {
    return wrapper(
      <TicketCard bodyClassName="p-8 text-center">
        <Stamp variant="teal">Google Maps</Stamp>
        <div className="flex justify-center mt-5 mb-3">
          <BusinessLogo name={businessName} logoUrl={business.logo_url} size={56} />
        </div>
        <h1 className="text-xl font-bold tracking-tight break-words">{businessName}</h1>
        {business.branch_name && (
          <div className="font-mono text-muted text-xs mt-0.5">{business.branch_name}</div>
        )}
        <p className="text-muted text-sm mt-4 leading-relaxed">
          Te estamos llevando a Google para que dejes tu reseña...
        </p>
        <div className="mt-5">
          <HardButton as="a" variant="teal" className="w-full" href={business.google_review_url} rel="noopener noreferrer">
            Ir a Google ahora
          </HardButton>
        </div>
        <div className="border-t border-dashed border-line-gray mt-6 pt-3 flex items-center justify-center gap-2 font-mono text-xs text-muted">
          <span>Con tecnología de</span>
          <LatidoSymbol width={20} />
          <span className="font-sans font-bold text-ink text-sm">Latido</span>
        </div>
      </TicketCard>
    );
  }

  // ── Confirmación ───────────────────────────────────────────────────────────
  if (submitted) {
    return wrapper(
      <TicketCard bodyClassName="p-8 text-center">
        <div className="flex justify-center mb-3">
          <BusinessLogo name={businessName} logoUrl={business.logo_url} size={48} />
        </div>
        <Stamp variant="teal">Recibido</Stamp>
        <h1 className="text-2xl font-bold mt-4 tracking-tight">¡Muchas gracias!</h1>
        <p className="text-muted text-sm mt-2 leading-relaxed">
          Tu opinión ya fue entregada directamente a {businessName}.
          {form.wantContact && ' Si dejaste tus datos, alguien del local se va a comunicar con vos.'}
        </p>
        {isDemo && <Alert variant="info" className="mt-4 text-left">Modo demostración: no se guardó ningún dato.</Alert>}

        {showGoogleAfter && !googleDeclined && (
          <div className="mt-6 p-4 border-[1.5px] border-teal bg-teal/5 text-left space-y-3 animate-fadeIn">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-teal font-bold">Paso opcional</span>
              <p className="text-sm font-bold mt-0.5">
                ¿Querés dejar también tu reseña pública en Google?
              </p>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Vos elegís: tu opinión en Latido ya quedó guardada. Si querés, podés compartirla también en Google Maps.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <HardButton as="a" variant="teal" size="sm" className="flex-1"
                href={business.google_review_url} target="_blank" rel="noopener noreferrer">
                Sí, ir a Google
              </HardButton>
              <HardButton type="button" variant="secondary" size="sm" onClick={() => setGoogleDeclined(true)}>
                No, gracias
              </HardButton>
            </div>
            <p className="font-mono text-muted text-[10px] leading-snug">
              Se ofrece a todos los clientes por igual, conforme a las políticas de Google.
            </p>
          </div>
        )}

        {showGoogleAfter && googleDeclined && (
          <p className="mt-5 font-mono text-xs text-muted bg-paper-dim border border-line-gray px-3 py-2.5">
            ¡Perfecto! Tu opinión ya llegó a {businessName}. Ya podés cerrar esta pantalla.
          </p>
        )}

        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <HardButton variant="secondary" size="sm" onClick={resetForm}>Enviar otra opinión</HardButton>
          {isDemo && (
            <HardButton as={Link} to="/" size="sm">← Volver a Latido</HardButton>
          )}
        </div>
      </TicketCard>
    );
  }

  // ── Formulario ─────────────────────────────────────────────────────────────
  const inputCls = 'w-full bg-paper border-[1.5px] border-ink p-2 text-sm focus:border-teal focus:shadow-[2px_2px_0px_#1F6F64] outline-none rounded-none';
  const labelCls = 'block font-mono text-[10px] uppercase text-muted mb-0.5';

  return wrapper(
    <>
      <form onSubmit={handleSubmit} noValidate>
        <TicketCard bodyClassName="px-6 py-5">
          {/* Cabecera */}
          <div className="flex justify-between font-mono text-muted text-[11px] mb-3">
            <span>TICKET DE OPINIÓN</span>
            <span>{new Date().toLocaleDateString('es-AR')}</span>
          </div>

          <div className="flex items-center gap-3">
            <BusinessLogo name={businessName} logoUrl={business.logo_url} size={48} />
            <div className="min-w-0">
              <h1 className="text-xl font-bold leading-tight tracking-tight break-words">{businessName}</h1>
              <span className="font-mono text-muted text-xs">{business.branch_name}</span>
            </div>
          </div>

          <div className="border-t-[1.5px] border-dashed border-line-gray my-4" />

          {/* Estrellas */}
          <div className="text-base font-semibold" id="stars-label">{survey.starsQuestion}</div>
          <div className="flex gap-1 my-3" role="radiogroup" aria-labelledby="stars-label">
            {[1, 2, 3, 4, 5].map(val => (
              <button key={val} type="button" role="radio" aria-checked={form.stars === val}
                onClick={() => handleStarClick(val)}
                className="p-1 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                aria-label={`${val} ${val === 1 ? 'estrella' : 'estrellas'}`}>
                <StarIcon size={38} filled={val <= form.stars} />
              </button>
            ))}
          </div>
          <div className={`font-mono font-bold text-xs uppercase tracking-wider min-h-[18px] ${isLowRating ? 'text-alert-red' : 'text-teal'}`} aria-live="polite">
            {MOODS[form.stars]}
          </div>

          {/* Etiquetas */}
          {form.stars > 0 && survey.tagsEnabled && survey.tags.length > 0 && (
            <div className="my-3 animate-fadeIn">
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
                {survey.tagsQuestion || (isLowRating ? '¿Qué falló?' : '¿Qué destacás?')} (opcional)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {survey.tags.map(tag => {
                  const selected = form.tags.includes(tag);
                  return (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)} aria-pressed={selected}
                      className={`font-mono text-xs px-2.5 py-1 border-[1.5px] transition-colors cursor-pointer ${selected ? 'border-teal text-teal bg-teal/10' : 'border-line-gray text-muted hover:border-ink'}`}>
                      {selected ? '✓ ' : '+ '}{tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comentario */}
          {survey.commentEnabled && (
            <div className="mt-3">
              <label htmlFor="comment" className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1">
                {survey.commentQuestion}
              </label>
              <textarea id="comment" rows={3} maxLength={1000} value={form.comment}
                onChange={e => set({ comment: e.target.value })}
                placeholder={survey.commentPlaceholder} className={`${inputCls} p-2.5 resize-y`} />
              {form.comment.length > 800 && (
                <div className="font-mono text-[10px] text-muted text-right">{form.comment.length}/1000</div>
              )}
            </div>
          )}

          {/* Honeypot anti-bots: invisible para personas */}
          <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
            <label htmlFor="website">Sitio web</label>
            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off"
              value={form.website} onChange={e => set({ website: e.target.value })} />
          </div>

          {/* Contacto opcional */}
          <div className={`border-[1.5px] border-dashed p-3 my-4 transition-colors ${isLowRating && business.rescue_enabled ? 'border-alert-red bg-alert-red/5' : 'border-line-gray'}`}>
            <button type="button" aria-expanded={form.wantContact}
              onClick={() => { set({ wantContact: !form.wantContact, contactTouched: true }); setErrors([]); }}
              className="flex items-start gap-2.5 w-full text-left cursor-pointer">
              <span className={`w-5 h-5 border-[1.5px] border-ink flex items-center justify-center shrink-0 font-mono text-sm ${form.wantContact ? 'bg-ink text-paper' : 'bg-paper'}`}>
                {form.wantContact ? '✓' : ''}
              </span>
              <span className="text-[13.5px] font-medium leading-tight">
                {isLowRating && business.rescue_enabled
                  ? 'Lamentamos eso. ¿Querés que alguien del local te contacte para solucionarlo?'
                  : '¿Querés dejarnos tus datos para que te contactemos?'}
              </span>
            </button>

            {form.wantContact && (
              <div className="grid gap-2.5 mt-3 pt-3 border-t border-line-gray animate-fadeIn">
                <div>
                  <label htmlFor="c-name" className={labelCls}>Nombre y apellido</label>
                  <input id="c-name" type="text" autoComplete="name" maxLength={120} value={form.name}
                    onChange={e => set({ name: e.target.value })} placeholder="Ej: Martín Gómez"
                    aria-invalid={fieldErrors.name ? 'true' : undefined}
                    className={`${inputCls} ${fieldErrors.name ? '!border-alert-red' : ''}`} />
                  {fieldErrors.name && <p className="text-alert-red text-[11px] mt-0.5">{fieldErrors.name}</p>}
                </div>
                <div>
                  <label htmlFor="c-phone" className={labelCls}>Teléfono / WhatsApp</label>
                  <input id="c-phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={25} value={form.phone}
                    onChange={e => set({ phone: e.target.value })} placeholder="+54 9 381 555 1234"
                    aria-invalid={fieldErrors.phone ? 'true' : undefined}
                    className={`${inputCls} ${fieldErrors.phone ? '!border-alert-red' : ''}`} />
                  {fieldErrors.phone && <p className="text-alert-red text-[11px] mt-0.5">{fieldErrors.phone}</p>}
                </div>
                <div>
                  <label htmlFor="c-email" className={labelCls}>Email</label>
                  <input id="c-email" type="email" autoComplete="email" inputMode="email" maxLength={254} value={form.email}
                    onChange={e => set({ email: e.target.value })} placeholder="tu@email.com"
                    aria-invalid={fieldErrors.email ? 'true' : undefined}
                    className={`${inputCls} ${fieldErrors.email ? '!border-alert-red' : ''}`} />
                  {fieldErrors.email && <p className="text-alert-red text-[11px] mt-0.5">{fieldErrors.email}</p>}
                </div>
                <div>
                  <label htmlFor="c-channel" className={labelCls}>¿Cómo preferís que te contacten?</label>
                  <select id="c-channel" value={form.channel} onChange={e => set({ channel: e.target.value })} className={inputCls}>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="call">Llamada telefónica</option>
                  </select>
                </div>
                <label className="flex items-start gap-2 text-xs text-muted mt-1 cursor-pointer">
                  <input type="checkbox" checked={form.consent} onChange={e => set({ consent: e.target.checked })}
                    className="mt-0.5 w-4 h-4 shrink-0" />
                  <span>
                    Acepto que {businessName} use estos datos solo para responder a este comentario (Ley 25.326).
                    No se usan para publicidad y podés pedir que se borren.
                  </span>
                </label>
              </div>
            )}
          </div>

          {errors.length > 0 && (
            <div role="alert" className="mb-3">
              <ul className="text-alert-red text-xs list-disc pl-5 space-y-0.5">
                {errors.map((err) => <li key={err}>{err}</li>)}
              </ul>
            </div>
          )}

          <HardButton type="submit" disabled={form.stars === 0 || isSubmitting} className="w-full">
            {isSubmitting ? 'ENVIANDO...' : 'ENVIAR OPINIÓN'}
          </HardButton>

          <div className="border-t border-dashed border-line-gray mt-5 pt-3 flex items-center justify-center gap-2 font-mono text-xs text-muted">
            <span>Con tecnología de</span>
            <LatidoSymbol width={20} />
            <span className="font-sans font-bold text-ink text-sm">Latido</span>
          </div>
        </TicketCard>
      </form>

      <p className="font-mono text-muted text-[11px] text-center mt-3">
        Anónimo por defecto · dejar contacto es 100% opcional
      </p>
    </>
  );
}
