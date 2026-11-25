import React, { useState } from 'react';
import Field from '../../../../components/ui/Field';
import HardButton from '../../../../components/ui/HardButton';
import Alert from '../../../../components/ui/Alert';
import PasswordChecklist from '../../../../components/ui/PasswordChecklist';
import { getErrorMessage } from '../../../../lib/errors';
import { validatePassword } from '../../../../lib/validators';

export default function ChangePasswordForm({ updatePassword }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus] = useState({ saving: false, error: '', ok: '' });

  async function handleChangePassword(e) {
    e.preventDefault();
    if (status.saving) return;

    const passRes = validatePassword(newPassword);
    if (!passRes.valid) {
      return setStatus({ saving: false, error: passRes.error, ok: '' });
    }
    if (newPassword !== confirmPassword) {
      return setStatus({ saving: false, error: 'Las contraseñas no coinciden.', ok: '' });
    }

    setStatus({ saving: true, error: '', ok: '' });
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setStatus({ saving: false, error: '', ok: 'Contraseña actualizada. Usá la nueva la próxima vez que ingreses.' });
    } catch (err) {
      setStatus({ saving: false, error: getErrorMessage(err, 'No pudimos actualizar la contraseña.'), ok: '' });
    }
  }

  return (
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
          onChange={e => { setNewPassword(e.target.value); setStatus(s => ({ ...s, ok: '' })); }}
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
        onChange={e => { setConfirmPassword(e.target.value); setStatus(s => ({ ...s, ok: '' })); }}
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

      {status.error && <Alert variant="error">{status.error}</Alert>}
      {status.ok && <Alert variant="success">{status.ok}</Alert>}

      <div>
        <HardButton type="submit" disabled={status.saving}>
          {status.saving ? 'ACTUALIZANDO...' : 'ACTUALIZAR CONTRASEÑA'}
        </HardButton>
      </div>
    </form>
  );
}
