import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Mail, Check, ShieldCheck, SlidersHorizontal, CreditCard, ImagePlus, Trash2 } from 'lucide-react';
import Field from '../../../components/ui/Field';
import HardButton from '../../../components/ui/HardButton';
import Alert from '../../../components/ui/Alert';
import Stamp from '../../../components/ui/Stamp';
import BusinessLogo from '../../../components/branding/BusinessLogo';
import PasswordChecklist from '../../../components/ui/PasswordChecklist';
import SurveyEditor from './SurveyEditor';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { getErrorMessage } from '../../../lib/errors';
import { formatMoney, getMonogram } from '../../../lib/utils';
import { buildWhatsAppUrl, buildMailUrl, displayPhone, CONTACT_EMAIL } from '../../../lib/contact';
import { validateBusinessName, validatePassword, validatePersonName } from '../../../lib/validators';
import { uploadBusinessLogo, removeBusinessLogo } from '../../../lib/logoUpload';

const SUBTABS = [
  { id: 'plan', label: 'Plan y datos', icon: CreditCard },
  { id: 'formulario', label: 'Preguntas del formulario', icon: SlidersHorizontal },
  { id: 'seguridad', label: 'Contraseña', icon: ShieldCheck }
];

export default function AccountTab({ business, isAdmin, onSaved }) {
  const { user, profile, updatePassword } = useAuth();
  const [subtab, setSubtab] = useState('plan');

  // Datos de plan, soportes y sucursales
  const [supports, setSupports] = useState(null);
  const [counts, setCounts] = useState({ branches: 0, qrTotal: 0, qrActive: 0 });
  const [plans, setPlans] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(true);

  // Logo del negocio
  const logoInputRef = useRef(null);
  const [logoStatus, setLogoStatus] = useState({ busy: false, error: '', ok: '' });

  // Edición de datos del negocio y perfil
  const [bizName, setBizName] = useState(business.name || '');
  const [managerName, setManagerName] = useState(business.manager_name || '');
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [profileStatus, setProfileStatus] = useState({ saving: false, error: '', ok: '' });

  // Cambio de contraseña
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passStatus, setPassStatus] = useState({ saving: false, error: '', ok: '' });

  useEffect(() => {
    setBizName(business.name || '');
    setManagerName(business.manager_name || '');
    setFullName(profile?.full_name || '');
  }, [business.name, business.manager_name, profile?.full_name]);

  useEffect(() => {
    let cancelled = false;
    setLoadingPlan(true);
    Promise.all([
      supabase.rpc('get_my_supports'),
      supabase.from('branches').select('id', { count: 'exact', head: true }).eq('business_id', business.id),
      supabase.from('qr_codes').select('id, active').eq('business_id', business.id),
      supabase.from('plans').select('id, code, name, supports, price_monthly, currency, is_custom, highlighted').eq('active', true).order('sort_order', { ascending: true })
    ]).then(([supRes, brRes, qrRes, plRes]) => {
      if (cancelled) return;
      setSupports(supRes.error ? null : supRes.data);
      const qrList = qrRes.data || [];
      setCounts({
        branches: brRes.count ?? 0,
        qrTotal: qrList.length,
        qrActive: qrList.filter(q => q.active).length
      });
      if (!plRes.error) setPlans(plRes.data || []);
      setLoadingPlan(false);
    });
    return () => { cancelled = true; };
  }, [business.id]);

  async function handleLogoSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !isAdmin || logoStatus.busy) return;

    setLogoStatus({ busy: true, error: '', ok: '' });
    try {
      await uploadBusinessLogo(business.id, file);
      await onSaved();
      setLogoStatus({
        busy: false,
        error: '',
        ok: 'Logo actualizado. Ya aparece en tu panel, el ticket del cliente, el formulario y tus láminas QR.'
      });
    } catch (err) {
      setLogoStatus({ busy: false, error: err?.message || 'No pudimos subir el logo.', ok: '' });
    }
  }

  async function handleRemoveLogo() {
    if (!isAdmin || !business.logo_url || logoStatus.busy) return;
    if (!window.confirm('¿Quitar el logo y volver a mostrar las iniciales de tu negocio?')) return;

    setLogoStatus({ busy: true, error: '', ok: '' });
    try {
      await removeBusinessLogo(business.id);
      await onSaved();
      setLogoStatus({
        busy: false,
        error: '',
        ok: `Logo quitado. Se muestran nuevamente las iniciales (${getMonogram(business.name)}).`
      });
    } catch (err) {
      setLogoStatus({ busy: false, error: err?.message || 'No pudimos quitar el logo.', ok: '' });
    }
  }

  async function handleSaveAccount(e) {
    e.preventDefault();
    if (profileStatus.saving) return;

    const fullNameRes = validatePersonName(fullName, { required: true, min: 2, max: 80, label: 'Tu nombre completo' });
    if (!fullNameRes.valid) {
      return setProfileStatus({ saving: false, error: fullNameRes.error, ok: '' });
    }

    let cleanBizName = business.name;
    let cleanManager = business.manager_name || null;

    if (isAdmin) {
      const bizRes = validateBusinessName(bizName);
      if (!bizRes.valid) {
        return setProfileStatus({ saving: false, error: bizRes.error, ok: '' });
      }
      const mgrRes = validatePersonName(managerName, { required: false, min: 2, max: 60, label: 'La firma en mensajes de rescate' });
      if (!mgrRes.valid) {
        return setProfileStatus({ saving: false, error: mgrRes.error, ok: '' });
      }
      cleanBizName = bizRes.value;
      cleanManager = mgrRes.value || null;
    }

    setProfileStatus({ saving: true, error: '', ok: '' });
    try {
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ full_name: fullNameRes.value })
        .eq('id', profile.id);
      if (profErr) throw profErr;

      if (isAdmin) {
        const { error: bizErr } = await supabase
          .from('businesses')
          .update({
            name: cleanBizName,
            manager_name: cleanManager
          })
          .eq('id', business.id);
        if (bizErr) throw bizErr;
      }

      await onSaved();
      setProfileStatus({ saving: false, error: '', ok: 'Datos actualizados correctamente.' });
    } catch (err) {
      setProfileStatus({ saving: false, error: getErrorMessage(err, 'No pudimos guardar los cambios.'), ok: '' });
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (passStatus.saving) return;

    const passRes = validatePassword(newPassword);
    if (!passRes.valid) {
      return setPassStatus({ saving: false, error: passRes.error, ok: '' });
    }
    if (newPassword !== confirmPassword) {
      return setPassStatus({ saving: false, error: 'Las contraseñas no coinciden.', ok: '' });
    }

    setPassStatus({ saving: true, error: '', ok: '' });
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setPassStatus({ saving: false, error: '', ok: 'Contraseña actualizada. Usá la nueva la próxima vez que ingreses.' });
    } catch (err) {
      setPassStatus({ saving: false, error: getErrorMessage(err, 'No pudimos actualizar la contraseña.'), ok: '' });
    }
  }

  const currentPlan = business.plan;
  const used = supports?.used ?? counts.qrActive;
  const limit = supports?.limit ?? currentPlan?.supports ?? 1;
  const free = Math.max(0, limit - used);
  const usedPct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const upgradePlans = plans.filter(p => p.id !== business.plan_id);

  return (
    <div className="space-y-6">
      {/* Sub-navegación de Mi cuenta */}
      <div className="flex flex-wrap gap-2">
        {SUBTABS.map(({ id, label, icon: Icon }) => (
          <HardButton
            key={id}
            size="sm"
            variant={subtab === id ? 'primary' : 'secondary'}
            onClick={() => setSubtab(id)}
            aria-pressed={subtab === id}
          >
            <Icon size={14} /> {label}
          </HardButton>
        ))}
      </div>

      {/* ── 1. PLAN ACTUAL, SOPORTES, LOGO Y DATOS DEL NEGOCIO ─────────────── */}
      {subtab === 'plan' && (
        <div className="space-y-6">
          {/* Tarjeta de Logo / Identidad visual del negocio */}
          <section className="bg-paper border-[1.5px] border-ink p-5 shadow-hard-line">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <BusinessLogo name={business.name} logoUrl={business.logo_url} size={72} />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold">Logo del negocio</h2>
                    <Stamp variant={business.logo_url ? 'teal' : 'amber'}>
                      {business.logo_url ? 'Logo activo' : `Usando iniciales (${getMonogram(business.name)})`}
                    </Stamp>
                  </div>
                  <p className="text-xs text-muted leading-relaxed max-w-2xl">
                    {business.logo_url
                      ? 'Tu logo se muestra automáticamente en este panel, el ticket y formulario del cliente, la pantalla de Google y tus láminas QR.'
                      : 'Sumá el logo de tu marca para personalizar el ticket, el formulario, el panel y las láminas QR. Si preferís no subir uno, seguimos mostrando tus iniciales.'}
                  </p>
                  <p className="font-mono text-[11px] text-muted">
                    PNG, JPG o WebP · mínimo 64×64 px · máx. 5 MB (se optimiza automáticamente).
                  </p>
                </div>
              </div>

              {isAdmin && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoSelected}
                    className="hidden"
                    aria-label="Seleccionar archivo de logo"
                  />
                  <HardButton
                    size="sm"
                    variant={business.logo_url ? 'secondary' : 'teal'}
                    disabled={logoStatus.busy}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <ImagePlus size={14} />
                    {logoStatus.busy ? 'SUBIENDO...' : business.logo_url ? 'Cambiar logo' : 'Subir logo'}
                  </HardButton>
                  {business.logo_url && (
                    <HardButton
                      size="sm"
                      variant="danger"
                      disabled={logoStatus.busy}
                      onClick={handleRemoveLogo}
                    >
                      <Trash2 size={14} /> Quitar logo
                    </HardButton>
                  )}
                </div>
              )}
            </div>

            {!isAdmin && (
              <p className="font-mono text-[11px] text-muted mt-3">
                Solo el administrador del negocio puede cargar o cambiar el logo.
              </p>
            )}
            {logoStatus.error && <Alert variant="error" className="mt-3">{logoStatus.error}</Alert>}
            {logoStatus.ok && <Alert variant="success" className="mt-3">{logoStatus.ok}</Alert>}
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            {/* Tarjeta de Plan y soportes activos */}
            <section className="bg-paper border-[1.5px] border-ink p-5 shadow-hard-line space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-line-gray">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted">Plan actual</span>
                  <h2 className="text-2xl font-bold tracking-tight mt-0.5">
                    {supports?.plan_name || currentPlan?.name || 'Plan Base'}
                  </h2>
                </div>
                <div className="text-right">
                  {currentPlan?.is_custom ? (
                    <Stamp variant="amber">A medida</Stamp>
                  ) : currentPlan?.price_monthly != null ? (
                    <div>
                      <div className="font-bold text-xl tabular-nums">
                        {formatMoney(currentPlan.price_monthly, currentPlan.currency)}
                      </div>
                      <div className="font-mono text-[10px] text-muted uppercase">por mes</div>
                    </div>
                  ) : (
                    <Stamp variant="teal">Activo</Stamp>
                  )}
                </div>
              </div>

              {/* Medidor de soportes activos */}
              {loadingPlan ? (
                <div className="h-24 bg-paper-dim border border-line-gray animate-pulse" />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="uppercase tracking-wider text-muted">Soportes QR + NFC activos</span>
                    <strong className="text-sm text-ink">{used} de {limit}</strong>
                  </div>
                  <div className="h-3.5 bg-paper-dim border border-line-gray">
                    <div
                      className={`h-full transition-all ${free === 0 ? 'bg-amber' : 'bg-teal'}`}
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-xs">
                    <div className="bg-paper-dim border border-line-gray p-2.5">
                      <div className="text-[10px] uppercase text-muted">Activos</div>
                      <div className="text-lg font-bold text-teal">{used}</div>
                    </div>
                    <div className="bg-paper-dim border border-line-gray p-2.5">
                      <div className="text-[10px] uppercase text-muted">Disponibles</div>
                      <div className="text-lg font-bold">{free}</div>
                    </div>
                    <div className="bg-paper-dim border border-line-gray p-2.5">
                      <div className="text-[10px] uppercase text-muted">Sucursales</div>
                      <div className="text-lg font-bold">{counts.branches}</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Todos los planes incluyen las mismas funciones completas (Modo Rescate, tiempo real y destino Google).
                    La diferencia es cuántos soportes físicos (QR + NFC) podés tener activos en simultáneo.
                  </p>
                </div>
              )}

              {/* Contacto directo para mejorar de plan */}
              <div className="pt-4 border-t border-dashed border-line-gray space-y-3">
                <div className="font-mono text-[11px] uppercase tracking-wider text-teal font-bold">
                  ¿Necesitás más soportes o mejorar tu plan?
                </div>
                <p className="text-xs text-muted">
                  Escribinos y te ampliamos el plan al instante sin perder historial ni cambiar tus QR/NFC actuales.
                </p>
                <div className="flex flex-wrap gap-2">
                  <HardButton
                    as="a"
                    size="sm"
                    variant="teal"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={buildWhatsAppUrl(
                      `Hola, soy de ${business.name} (plan actual: ${supports?.plan_name || currentPlan?.name || 'Base'}, ${used}/${limit} soportes). Quiero consultar para mejorar de plan.`
                    )}
                  >
                    <MessageCircle size={14} /> Mejorar plan por WhatsApp
                  </HardButton>
                  <HardButton
                    as="a"
                    size="sm"
                    variant="secondary"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={buildMailUrl(
                      `Cambio de plan Latido · ${business.name}`,
                      `Hola, soy de ${business.name} (plan actual: ${supports?.plan_name || currentPlan?.name || 'Base'}, ${used}/${limit} soportes). Quiero consultar para mejorar de plan.`
                    )}
                  >
                    <Mail size={14} /> {CONTACT_EMAIL}
                  </HardButton>
                </div>
                <div className="font-mono text-[11px] text-muted">
                  WhatsApp comercial: {displayPhone()}
                </div>
              </div>
            </section>

            {/* Formulario de datos del negocio y usuario */}
            <form onSubmit={handleSaveAccount} className="bg-paper border border-line-gray p-5 shadow-hard-line space-y-4">
              <div className="pb-3 border-b border-line-gray">
                <h2 className="text-lg font-bold">Datos del negocio y tu perfil</h2>
                <p className="text-xs text-muted mt-0.5">
                  El nombre del negocio aparece en el panel, las láminas QR y el ticket que ven tus clientes.
                </p>
              </div>

              <Field
                id="acc-biz-name"
                label="Nombre del negocio"
                value={bizName}
                onChange={e => { setBizName(e.target.value); setProfileStatus(s => ({ ...s, ok: '' })); }}
                maxLength={80}
                disabled={!isAdmin || profileStatus.saving}
                hint={!isAdmin ? 'Solo el administrador puede cambiar el nombre del negocio.' : undefined}
                required
              />

              <Field
                id="acc-manager-name"
                label="Firma en mensajes de rescate"
                value={managerName}
                onChange={e => { setManagerName(e.target.value); setProfileStatus(s => ({ ...s, ok: '' })); }}
                maxLength={60}
                disabled={!isAdmin || profileStatus.saving}
                placeholder="Ej: Sofía"
                hint="Reemplaza {encargado} en las plantillas de WhatsApp y Email."
              />

              <div className="pt-3 border-t border-dashed border-line-gray space-y-4">
                <Field
                  id="acc-full-name"
                  label="Tu nombre completo"
                  value={fullName}
                  onChange={e => { setFullName(e.target.value); setProfileStatus(s => ({ ...s, ok: '' })); }}
                  maxLength={80}
                  disabled={profileStatus.saving}
                  required
                />

                <Field
                  id="acc-email"
                  label="Email de acceso"
                  value={user?.email || ''}
                  disabled
                  hint="Para cambiar el email de acceso de la cuenta, escribinos por WhatsApp."
                />
              </div>

              {profileStatus.error && <Alert variant="error">{profileStatus.error}</Alert>}
              {profileStatus.ok && <Alert variant="success">{profileStatus.ok}</Alert>}

              <HardButton type="submit" disabled={profileStatus.saving}>
                {profileStatus.saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
              </HardButton>
            </form>
          </div>

          {/* Otros planes disponibles para mejorar */}
          {upgradePlans.length > 0 && (
            <section className="bg-paper border border-line-gray p-5">
              <div className="font-mono text-xs uppercase tracking-wider text-muted mb-3">
                Otros planes disponibles
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upgradePlans.map(p => (
                  <div key={p.id} className={`border p-4 flex flex-col justify-between gap-3 ${p.highlighted ? 'border-teal bg-teal/5' : 'border-line-gray bg-paper-dim/50'}`}>
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-base">{p.name}</strong>
                        {p.highlighted && <Stamp variant="teal">Recomendado</Stamp>}
                      </div>
                      <div className="font-bold text-2xl mt-2 tabular-nums">
                        {p.is_custom || p.price_monthly == null
                          ? 'A medida'
                          : <>{formatMoney(p.price_monthly, p.currency)} <span className="font-mono text-[11px] font-normal text-muted">/ mes</span></>}
                      </div>
                      <div className="font-mono text-xs text-amber-ink font-bold mt-1">
                        {p.is_custom ? 'Cantidad de soportes a medida' : `${p.supports} ${p.supports === 1 ? 'soporte' : 'soportes'} QR + NFC`}
                      </div>
                      <ul className="mt-3 space-y-1 text-xs text-muted">
                        <li className="flex items-center gap-1.5"><Check size={13} className="text-teal" /> Todas las funciones incluidas</li>
                        <li className="flex items-center gap-1.5"><Check size={13} className="text-teal" /> Válido para todas tus sucursales</li>
                      </ul>
                    </div>
                    <HardButton
                      as="a"
                      size="sm"
                      variant={p.highlighted ? 'teal' : 'secondary'}
                      className="w-full"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={buildWhatsAppUrl(
                        `Hola, soy de ${business.name} y quiero pasar al ${p.name}${p.supports ? ` (${p.supports} soportes)` : ''}.`
                      )}
                    >
                      <MessageCircle size={13} /> Pedir este plan
                    </HardButton>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── 2. PREGUNTAS DEL FORMULARIO ────────────────────────────────────── */}
      {subtab === 'formulario' && <SurveyEditor business={business} isAdmin={isAdmin} />}

      {/* ── 3. CAMBIAR CONTRASEÑA ──────────────────────────────────────────── */}
      {subtab === 'seguridad' && (
        <form onSubmit={handleChangePassword} className="max-w-[540px] bg-paper border border-line-gray p-5 shadow-hard-line space-y-4">
          <div className="pb-3 border-b border-line-gray">
            <h2 className="text-lg font-bold">Cambiar contraseña</h2>
            <p className="text-xs text-muted mt-0.5">
              Usá una contraseña de al menos 8 caracteres para proteger el acceso a tu panel.
            </p>
          </div>

          <div>
            <Field
              id="new-pass"
              label="Nueva contraseña"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setPassStatus(s => ({ ...s, ok: '' })); }}
              placeholder="Mínimo 8 caracteres, letras y números"
              minLength={8}
              maxLength={72}
              required
            />
            <PasswordChecklist password={newPassword} />
          </div>

          <Field
            id="confirm-pass"
            label="Repetir nueva contraseña"
            type={showPass ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={e => { setConfirmPassword(e.target.value); setPassStatus(s => ({ ...s, ok: '' })); }}
            placeholder="Volvé a escribir la contraseña"
            minLength={8}
            maxLength={72}
            required
          />

          <button
            type="button"
            onClick={() => setShowPass(v => !v)}
            className="font-mono text-xs text-muted hover:text-ink underline cursor-pointer"
          >
            {showPass ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
          </button>

          {passStatus.error && <Alert variant="error">{passStatus.error}</Alert>}
          {passStatus.ok && <Alert variant="success">{passStatus.ok}</Alert>}

          <div>
            <HardButton type="submit" disabled={passStatus.saving}>
              {passStatus.saving ? 'ACTUALIZANDO...' : 'ACTUALIZAR CONTRASEÑA'}
            </HardButton>
          </div>
        </form>
      )}
    </div>
  );
}
