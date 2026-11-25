import React, { useEffect, useState } from 'react';
import Field from '../../../../components/ui/Field';
import HardButton from '../../../../components/ui/HardButton';
import Alert from '../../../../components/ui/Alert';
import { supabase } from '../../../../lib/supabaseClient';
import { getErrorMessage } from '../../../../lib/errors';
import { validateBusinessName, validatePersonName } from '../../../../lib/validators';

export default function AccountDetailsForm({ business, profile, user, isAdmin, onSaved }) {
  const [bizName, setBizName] = useState(business.name || '');
  const [managerName, setManagerName] = useState(business.manager_name || '');
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [status, setStatus] = useState({ saving: false, error: '', ok: '' });

  useEffect(() => {
    setBizName(business.name || '');
    setManagerName(business.manager_name || '');
    setFullName(profile?.full_name || '');
  }, [business.name, business.manager_name, profile?.full_name]);

  async function handleSaveAccount(e) {
    e.preventDefault();
    if (status.saving) return;

    const fullNameRes = validatePersonName(fullName, { required: true, min: 2, max: 80, label: 'Tu nombre completo' });
    if (!fullNameRes.valid) {
      return setStatus({ saving: false, error: fullNameRes.error, ok: '' });
    }

    let cleanBizName = business.name;
    let cleanManager = business.manager_name || null;

    if (isAdmin) {
      const bizRes = validateBusinessName(bizName);
      if (!bizRes.valid) {
        return setStatus({ saving: false, error: bizRes.error, ok: '' });
      }
      const mgrRes = validatePersonName(managerName, { required: false, min: 2, max: 60, label: 'La firma en mensajes de rescate' });
      if (!mgrRes.valid) {
        return setStatus({ saving: false, error: mgrRes.error, ok: '' });
      }
      cleanBizName = bizRes.value;
      cleanManager = mgrRes.value || null;
    }

    setStatus({ saving: true, error: '', ok: '' });
    try {
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ full_name: fullNameRes.value })
        .eq('id', profile.id);
      if (profErr) throw profErr;

      if (isAdmin) {
        const { error: bizErr } = await supabase
          .from('businesses')
          .update({ name: cleanBizName, manager_name: cleanManager })
          .eq('id', business.id);
        if (bizErr) throw bizErr;
      }

      await onSaved();
      setStatus({ saving: false, error: '', ok: 'Datos actualizados correctamente.' });
    } catch (err) {
      setStatus({ saving: false, error: getErrorMessage(err, 'No pudimos guardar los cambios.'), ok: '' });
    }
  }

  return (
    <form onSubmit={handleSaveAccount} className="bg-paper border border-line-gray p-5 shadow-hard-line space-y-4">
      <div className="pb-3 border-b border-line-gray">
        <h2 className="text-lg font-bold">Datos del negocio y tu perfil</h2>
        <p className="text-xs text-muted mt-0.5">
          El nombre del negocio aparece en tu panel y en el ticket digital que ven tus clientes.
        </p>
      </div>

      <Field
        id="acc-biz-name"
        label="Nombre del negocio"
        value={bizName}
        onChange={e => { setBizName(e.target.value); setStatus(s => ({ ...s, ok: '' })); }}
        maxLength={80}
        disabled={!isAdmin || status.saving}
        hint={!isAdmin ? 'Solo el administrador puede cambiar el nombre del negocio.' : undefined}
        required
      />

      <Field
        id="acc-manager-name"
        label="Firma en mensajes de rescate"
        value={managerName}
        onChange={e => { setManagerName(e.target.value); setStatus(s => ({ ...s, ok: '' })); }}
        maxLength={60}
        disabled={!isAdmin || status.saving}
        placeholder="Ej: Sofía"
        hint="Reemplaza {encargado} en las plantillas de WhatsApp y Email."
      />

      <div className="pt-3 border-t border-dashed border-line-gray space-y-4">
        <Field
          id="acc-full-name"
          label="Tu nombre completo"
          value={fullName}
          onChange={e => { setFullName(e.target.value); setStatus(s => ({ ...s, ok: '' })); }}
          maxLength={80}
          disabled={status.saving}
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

      {status.error && <Alert variant="error">{status.error}</Alert>}
      {status.ok && <Alert variant="success">{status.ok}</Alert>}

      <HardButton type="submit" disabled={status.saving}>
        {status.saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
      </HardButton>
    </form>
  );
}
