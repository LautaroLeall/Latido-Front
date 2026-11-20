import React, { useMemo, useState } from 'react';
import { Mail, MessageCircle, Copy, Check } from 'lucide-react';
import Field from '../../components/ui/Field';
import Alert from '../../components/ui/Alert';
import HardButton from '../../components/ui/HardButton';
import Stamp from '../../components/ui/Stamp';
import PasswordChecklist from '../../components/ui/PasswordChecklist';
import { supabase } from '../../lib/supabaseClient';
import { getErrorMessage } from '../../lib/errors';
import { buildFeedbackUrl } from '../../lib/utils';
import { buildGmailUrl, buildMailUrl } from '../../lib/contact';
import {
  validateBranchName,
  validateBusinessName,
  validateEmail,
  validateNumberRange,
  validatePassword,
  validatePersonName,
  validatePhone
} from '../../lib/validators';

const PASS_UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const PASS_LOWER = 'abcdefghjkmnpqrstuvwxyz';
const PASS_DIGITS = '23456789';
const PASS_ALL = PASS_UPPER + PASS_LOWER + PASS_DIGITS;

function generatePassword(length = 12) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  const chars = [
    PASS_UPPER[bytes[0] % PASS_UPPER.length],
    PASS_LOWER[bytes[1] % PASS_LOWER.length],
    PASS_DIGITS[bytes[2] % PASS_DIGITS.length],
    PASS_DIGITS[bytes[3] % PASS_DIGITS.length]
  ];
  for (let i = 4; i < length; i++) {
    chars.push(PASS_ALL[bytes[i] % PASS_ALL.length]);
  }
  // Mezclar posiciones
  for (let i = chars.length - 1; i > 0; i--) {
    const j = bytes[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

function getAppBaseUrl() {
  return (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/+$/, '');
}

async function extractFunctionError(error) {
  if (error?.context && typeof error.context.json === 'function') {
    try {
      const body = await error.context.json();
      if (body?.error) return body.error;
    } catch {
      // Sin cuerpo JSON legible
    }
  }
  if (/failed to send a request to the edge function/i.test(error?.message || '')) {
    return 'No pudimos conectar con la función create-business-account. Verificá que esté desplegada en Supabase.';
  }
  return getErrorMessage(error, 'No pudimos crear la cuenta del negocio.');
}

function defaultPlanId(plans) {
  return (plans.find(p => p.code === 'base') || plans[0])?.id || '';
}

function initialForm(plans) {
  return {
    businessName: '',
    branchName: 'Casa central',
    managerName: '',
    planId: defaultPlanId(plans),
    supportsOverride: '1',
    ownerName: '',
    ownerPhone: '',
    email: '',
    password: generatePassword()
  };
}

export default function CreateBusinessForm({ plans, onCreated, onClose }) {
  const [form, setForm] = useState(() => initialForm(plans));
  const [showPassword, setShowPassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  const activePlanId = form.planId || defaultPlanId(plans);
  const selectedPlan = useMemo(
    () => plans.find(p => p.id === activePlanId) || null,
    [plans, activePlanId]
  );

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError('');
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError('');

    const bizRes = validateBusinessName(form.businessName);
    if (!bizRes.valid) return setError(bizRes.error);

    const branchInput = form.branchName.trim() || 'Casa central';
    const branchRes = validateBranchName(branchInput);
    if (!branchRes.valid) return setError(branchRes.error);

    const mgrRes = validatePersonName(form.managerName, { required: false, min: 2, max: 60, label: 'La firma Modo Rescate' });
    if (!mgrRes.valid) return setError(mgrRes.error);

    const ownerRes = validatePersonName(form.ownerName, { required: true, min: 2, max: 80, label: 'El nombre del dueño' });
    if (!ownerRes.valid) return setError(ownerRes.error);

    const emailRes = validateEmail(form.email, { required: true, label: 'El email de acceso' });
    if (!emailRes.valid) return setError(emailRes.error);

    const phoneRes = validatePhone(form.ownerPhone, { required: false, label: 'El WhatsApp del dueño' });
    if (!phoneRes.valid) return setError(phoneRes.error);

    const passRes = validatePassword(form.password);
    if (!passRes.valid) return setError(passRes.error);

    let supportsOverride = null;
    if (selectedPlan?.is_custom) {
      const supRes = validateNumberRange(form.supportsOverride, { min: 1, max: 1000, integer: true, label: 'La cantidad de soportes' });
      if (!supRes.valid) return setError(supRes.error);
      supportsOverride = supRes.value;
    }

    setSubmitting(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('create-business-account', {
        body: {
          ownerName: ownerRes.value,
          email: emailRes.value,
          password: passRes.value,
          businessName: bizRes.value,
          branchName: branchRes.value,
          managerName: mgrRes.value || null,
          planId: selectedPlan?.id || null,
          supportsOverride
        }
      });

      if (fnErr) {
        throw new Error(await extractFunctionError(fnErr));
      }
      if (!data?.business_id || !data?.token) {
        throw new Error('La función respondió sin los datos del negocio creado.');
      }

      setCreated({
        businessName: bizRes.value,
        branchName: branchRes.value,
        ownerName: ownerRes.value,
        ownerPhone: phoneRes.whatsappDigits || '',
        planName: selectedPlan?.name || 'Plan Base',
        supportsLabel: selectedPlan?.is_custom
          ? `${supportsOverride} ${supportsOverride === 1 ? 'soporte' : 'soportes'}`
          : selectedPlan?.supports
            ? `${selectedPlan.supports} ${selectedPlan.supports === 1 ? 'soporte' : 'soportes'}`
            : '1 soporte',
        email: data.email || emailRes.value,
        password: passRes.value,
        token: data.token,
        loginUrl: `${getAppBaseUrl()}/login`,
        ticketUrl: buildFeedbackUrl(data.token)
      });
      await onCreated();
    } catch (err) {
      setError(err?.message || 'No pudimos crear la cuenta del negocio.');
    } finally {
      setSubmitting(false);
    }
  }

  function buildHandoffText(c) {
    return [
      `Hola ${c.ownerName.split(/\s+/)[0]}, ¡bienvenido/a a Latido!`,
      `Ya está activa la cuenta de ${c.businessName} (${c.planName} · ${c.supportsLabel}).`,
      '',
      `Ingreso al panel: ${c.loginUrl}`,
      `Email: ${c.email}`,
      `Contraseña inicial: ${c.password}`,
      '',
      `Primer ticket (${c.branchName}): ${c.ticketUrl}`,
      '',
      'Cuando ingreses podés subir el logo de tu negocio, personalizar las preguntas del formulario y cambiar tu contraseña desde "Mi cuenta".'
    ].join('\n');
  }

  async function copyCredentials() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(buildHandoffText(created));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('No pudimos copiar al portapapeles. Seleccioná los datos manualmente.');
    }
  }

  function resetForAnother() {
    setCreated(null);
    setCopied(false);
    setError('');
    setForm(initialForm(plans));
  }

  if (created) {
    const handoffText = buildHandoffText(created);
    const subject = `Tus accesos a Latido · ${created.businessName}`;
    const waHref = created.ownerPhone
      ? `https://wa.me/${created.ownerPhone}?text=${encodeURIComponent(handoffText)}`
      : `https://wa.me/?text=${encodeURIComponent(handoffText)}`;
    const gmailHref = buildGmailUrl(subject, handoffText, created.email);
    const mailHref = buildMailUrl(subject, handoffText, created.email);

    return (
      <div className="border-[1.5px] border-teal bg-paper p-5 shadow-[4px_4px_0_#1F6F64]">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-dashed border-line-gray">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Stamp variant="teal">NEGOCIO CREADO</Stamp>
            <h3 className="font-bold text-lg">{created.businessName}</h3>
          </div>
          <span className="font-mono text-xs text-muted">
            {created.planName} ({created.supportsLabel}) · {created.branchName}
          </span>
        </div>

        <p className="text-sm text-ink/80 mb-4">
          La cuenta ya está confirmada y lista para iniciar sesión en <code className="font-mono bg-paper-dim px-1">/login</code>.
          Enviá la invitación con las credenciales ahora: se abre siempre en una pestaña nueva para que no salgas del panel.
        </p>

        <dl className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 bg-paper-dim border border-line-gray p-4 font-mono text-xs mb-5">
          <div>
            <dt className="text-muted uppercase text-[10px]">Acceso al panel</dt>
            <dd className="mt-0.5 break-all">{created.loginUrl}</dd>
          </div>
          <div>
            <dt className="text-muted uppercase text-[10px]">Email ({created.ownerName})</dt>
            <dd className="mt-0.5 font-bold break-all">{created.email}</dd>
          </div>
          <div>
            <dt className="text-muted uppercase text-[10px]">Contraseña inicial</dt>
            <dd className="mt-0.5 font-bold text-amber-ink select-all">{created.password}</dd>
          </div>
          <div>
            <dt className="text-muted uppercase text-[10px]">Primer soporte (QR / NFC)</dt>
            <dd className="mt-0.5 break-all">
              <a href={created.ticketUrl} target="_blank" rel="noopener noreferrer" className="text-teal underline">
                {created.ticketUrl}
              </a>
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-2">
          <HardButton as="a" size="sm" variant="teal" href={waHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={14} /> Enviar por WhatsApp
          </HardButton>
          <HardButton as="a" size="sm" variant="primary" href={gmailHref} target="_blank" rel="noopener noreferrer">
            <Mail size={14} /> Enviar por Gmail
          </HardButton>
          <HardButton as="a" size="sm" variant="secondary" href={mailHref} target="_blank" rel="noopener noreferrer">
            <Mail size={14} /> Abrir app de correo
          </HardButton>
          <HardButton size="sm" variant="secondary" onClick={copyCredentials}>
            {copied ? <><Check size={14} /> Datos copiados</> : <><Copy size={14} /> Copiar invitación</>}
          </HardButton>
          <HardButton size="sm" variant="secondary" onClick={resetForAnother}>
            + Crear otro negocio
          </HardButton>
          {onClose && (
            <HardButton size="sm" variant="secondary" onClick={onClose}>
              Ver negocios
            </HardButton>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-[1.5px] border-ink bg-paper p-5 shadow-hard-line space-y-5" noValidate>
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-line-gray">
        <div>
          <h2 className="font-bold text-lg">Alta de nuevo negocio</h2>
          <p className="font-mono text-xs text-muted mt-0.5">
            Creás la cuenta confirmada, el negocio, la primera sucursal y su primer soporte QR/NFC, y al final enviás los accesos por WhatsApp o Email.
          </p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="font-mono text-xs text-muted hover:text-ink underline cursor-pointer shrink-0">
            Cancelar
          </button>
        )}
      </div>

      <div>
        <div className="font-mono text-[11px] uppercase tracking-wider text-teal font-bold mb-3">1. Datos del negocio</div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <Field
            id="new-business-name"
            label="Nombre del negocio"
            value={form.businessName}
            onChange={set('businessName')}
            placeholder="Ej: Cafetería del Sol"
            maxLength={80}
            required
          />
          <Field
            id="new-branch-name"
            label="Primera sucursal"
            value={form.branchName}
            onChange={set('branchName')}
            placeholder="Casa central"
            maxLength={60}
          />
          <Field
            id="new-plan"
            label="Plan"
            as="select"
            value={activePlanId}
            onChange={set('planId')}
          >
            {plans.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} {p.is_custom ? '(a medida)' : `(${p.supports} ${p.supports === 1 ? 'soporte' : 'soportes'})`}
              </option>
            ))}
          </Field>
          {selectedPlan?.is_custom ? (
            <Field
              id="new-supports-override"
              label="Cantidad de soportes"
              type="number"
              min="1"
              max="1000"
              value={form.supportsOverride}
              onChange={set('supportsOverride')}
              hint="Acordada para este plan a medida."
              required
            />
          ) : (
            <Field
              id="new-manager-name"
              label="Firma Modo Rescate (opcional)"
              value={form.managerName}
              onChange={set('managerName')}
              placeholder="Ej: Sofía"
              hint="Si queda vacío, usa el primer nombre del dueño."
              maxLength={60}
            />
          )}
        </div>

        {selectedPlan?.is_custom && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-3">
            <Field
              id="new-manager-name-custom"
              label="Firma Modo Rescate (opcional)"
              value={form.managerName}
              onChange={set('managerName')}
              placeholder="Ej: Sofía"
              hint="Si queda vacío, usa el primer nombre del dueño."
              maxLength={60}
            />
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-dashed border-line-gray">
        <div className="font-mono text-[11px] uppercase tracking-wider text-teal font-bold mb-3">
          2. Cuenta del dueño (acceso directo en /login)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <Field
            id="new-owner-name"
            label="Nombre completo del dueño"
            value={form.ownerName}
            onChange={set('ownerName')}
            placeholder="Ej: Sofía Pérez"
            maxLength={80}
            required
          />
          <Field
            id="new-owner-email"
            label="Email de acceso"
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="dueno@negocio.com"
            autoComplete="off"
            required
          />
          <Field
            id="new-owner-phone"
            label="WhatsApp del dueño (opcional)"
            type="tel"
            value={form.ownerPhone}
            onChange={set('ownerPhone')}
            placeholder="Ej: 381 555 1234"
            hint="Solo para abrir su chat al enviar la invitación."
            maxLength={25}
          />
          <div>
            <Field
              id="new-owner-password"
              label="Contraseña inicial"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="font-mono text-[11px] text-muted hover:text-ink underline cursor-pointer"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, password: generatePassword() }))}
                className="font-mono text-[11px] text-teal hover:underline cursor-pointer"
              >
                Generar otra
              </button>
            </div>
            <PasswordChecklist password={form.password} />
          </div>
        </div>
      </div>

      <Alert variant="error">{error}</Alert>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <HardButton type="submit" disabled={submitting}>
          {submitting ? 'CREANDO NEGOCIO...' : 'CREAR CUENTA Y GENERAR INVITACIÓN'}
        </HardButton>
        {onClose && (
          <HardButton size="sm" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </HardButton>
        )}
      </div>
    </form>
  );
}
