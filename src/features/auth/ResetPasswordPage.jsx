import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import Field from '../../components/ui/Field';
import Alert from '../../components/ui/Alert';
import HardButton from '../../components/ui/HardButton';
import PasswordChecklist from '../../components/ui/PasswordChecklist';
import { FullScreenLoader } from '../../components/ui/FullScreen';
import { useAuth, homePathFor } from '../../context/AuthContext';
import { getErrorMessage } from '../../lib/errors';
import { validatePassword } from '../../lib/validators';

/**
 * Destino del enlace de "olvidé mi contraseña".
 * Supabase abre esta URL con un token de recuperación y crea una sesión temporal.
 */
export default function ResetPasswordPage() {
  const { configured, loading, user, profile, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (configured && loading) return <FullScreenLoader label="Validando enlace..." />;

  if (!user) {
    return (
      <AuthLayout
        eyebrow="Enlace vencido"
        title="El enlace ya no es válido"
        footer={<p><Link to="/login" className="text-teal font-bold underline">Volver a ingresar</Link></p>}
      >
        <Alert variant="warning">
          Los enlaces de recuperación duran poco tiempo y se usan una sola vez.
          <span className="block mt-2">
            <Link to="/recuperar" className="font-bold underline">Pedí uno nuevo acá</Link>.
          </span>
        </Alert>
      </AuthLayout>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError('');
    const passRes = validatePassword(password);
    if (!passRes.valid) return setError(passRes.error);
    if (password !== confirm) return setError('Las contraseñas no coinciden.');

    setSubmitting(true);
    try {
      await updatePassword(password);
      setDone(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout eyebrow="Recuperar acceso" title="Nueva contraseña">
      {done ? (
        <div className="space-y-4">
          <Alert variant="success" title="Listo">Tu contraseña se actualizó correctamente.</Alert>
          <HardButton className="w-full" onClick={() => navigate(homePathFor(profile), { replace: true })}>
            IR A MI PANEL
          </HardButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Field
              id="password"
              label="Nueva contraseña"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              maxLength={72}
              required
            />
            <PasswordChecklist password={password} />
          </div>
          <Field
            id="confirm"
            label="Repetí la contraseña"
            type={showPass ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            maxLength={72}
            required
          />
          <button
            type="button"
            onClick={() => setShowPass(v => !v)}
            className="py-1 font-mono text-xs text-muted hover:text-ink underline cursor-pointer"
          >
            {showPass ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
          </button>
          <Alert variant="error">{error}</Alert>
          <HardButton type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'GUARDANDO...' : 'GUARDAR CONTRASEÑA'}
          </HardButton>
        </form>
      )}
    </AuthLayout>
  );
}
