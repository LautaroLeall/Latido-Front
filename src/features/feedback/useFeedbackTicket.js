import { useCallback, useEffect, useRef, useState } from 'react';
import { callPublicRpc, isPublicRpcConfigured } from '../../lib/publicRpc';
import { getErrorMessage } from '../../lib/errors';
import { validateEmail, validatePersonName, validatePhone } from '../../lib/validators';
import { isSafeHttpsUrl } from '../../lib/utils';

export const MOODS = ['', 'Pésimo', 'Disconforme', 'Regular', 'Muy bueno', '¡Excelente!'];

// Ticket de demostración (/f/demo): no toca la base de datos
export const DEMO_BUSINESS = {
  token_valid: true,
  business_name: 'Cafetería del Sol',
  branch_name: 'Sucursal Centro',
  logo_url: null,
  review_destination: 'both',
  google_review_url: 'https://maps.google.com',
  rescue_enabled: true,
  rescue_threshold: 2
};

const INITIAL_FORM = {
  stars: 0,
  tags: [],
  comment: '',
  wantContact: false,
  contactTouched: false,
  name: '',
  email: '',
  phone: '',
  channel: 'whatsapp',
  consent: false,
  website: ''
};

/**
 * Estado, carga pública, validación y envío del ticket /f/:token y /f/demo.
 * Aislado del SDK de Supabase para mantener /f/:token por debajo de 150 KB gzip.
 */
export function useFeedbackTicket(token) {
  const isDemo = token === 'demo';

  const [business, setBusiness] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | invalid | error | unconfigured
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [googleDeclined, setGoogleDeclined] = useState(false);
  const [googleOpened, setGoogleOpened] = useState(false);
  const [directGoogleOpened, setDirectGoogleOpened] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoOpenedGoogleRef = useRef(false);

  const setField = useCallback((patch) => {
    setForm(prev => ({ ...prev, ...patch }));
    const keys = Object.keys(patch);
    if (keys.length) {
      setFieldErrors(prev => {
        const next = { ...prev };
        for (const k of keys) delete next[k];
        return next;
      });
    }
  }, []);

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
    setForm(INITIAL_FORM);
    setErrors([]);
    setFieldErrors({});
    setSubmitted(false);
    setGoogleDeclined(false);
    setGoogleOpened(false);
    setDirectGoogleOpened(false);
    autoOpenedGoogleRef.current = false;

    const ctrl = new AbortController();
    loadBusiness(ctrl.signal);
    return () => ctrl.abort();
  }, [loadBusiness]);

  const directGoogle =
    loadState === 'ready' &&
    !isDemo &&
    business?.review_destination === 'google' &&
    isSafeHttpsUrl(business?.google_review_url);

  // Modo "Solo Google": abre la ficha de Google Maps en otra pestaña y deja esta pestaña con "¡Muchas gracias!" + Latido
  useEffect(() => {
    if (!directGoogle || autoOpenedGoogleRef.current) return;
    autoOpenedGoogleRef.current = true;
    const popup = window.open(business.google_review_url, '_blank');
    if (popup && !popup.closed) {
      try { popup.opener = null; } catch { /* cross-origin */ }
      setDirectGoogleOpened(true);
    }
  }, [directGoogle, business?.google_review_url]);

  const threshold = business?.rescue_threshold ?? 2;
  const isLowRating = form.stars > 0 && form.stars <= threshold;

  function handleStarClick(rating) {
    setErrors([]);
    setForm(prev => ({
      ...prev,
      stars: rating,
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

    const cleanName = form.wantContact
      ? validatePersonName(form.name, { required: true, min: 3, max: 120, requireTwoWords: true }).value
      : null;
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
    setGoogleOpened(false);
    setDirectGoogleOpened(false);
    autoOpenedGoogleRef.current = false;
  }

  return {
    isDemo,
    business,
    loadState,
    form,
    errors,
    fieldErrors,
    submitted,
    googleDeclined,
    googleOpened,
    directGoogle,
    directGoogleOpened,
    isSubmitting,
    isLowRating,
    setField,
    setErrors,
    setGoogleDeclined,
    setGoogleOpened,
    setDirectGoogleOpened,
    loadBusiness,
    handleStarClick,
    toggleTag,
    handleSubmit,
    resetForm
  };
}
