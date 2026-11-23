import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import Field from '../../components/ui/Field';
import Alert from '../../components/ui/Alert';
import HardButton from '../../components/ui/HardButton';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../lib/errors';
import { buildWhatsAppUrl } from '../../lib/contact';
import { validateEmail } from '../../lib/validators';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError('');

    const emailRes = validateEmail(email);
    if (!emailRes.valid) {
      setError(emailRes.error);
      return;
    }
    if (!password) {
      setError('Ingresá tu contraseña.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(emailRes.value, password);
      // La redirección la hace PublicOnlyRoute cuando el perfil termina de cargar
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Panel del negocio"
      title="Ingresar"
      subtitle="Accedé a las opiniones de tus clientes y al Modo Rescate."
      footer={
        <p>
          ¿Querés Latido en tu negocio?{' '}
          <a
            href={buildWhatsAppUrl('Hola, quiero activar Latido en mi negocio.')}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal font-bold underline"
          >
            Escribinos por WhatsApp
          </a>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="tu@negocio.com"
          required
        />
        <div>
          <Field
            id="password"
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="mt-1 font-mono text-[11px] text-muted hover:text-ink underline cursor-pointer"
            aria-pressed={showPassword}
          >
            {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          </button>
        </div>

        <div className="text-right -mt-2">
          <Link to="/recuperar" className="font-mono text-xs text-muted hover:text-ink underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Alert variant="error">{error}</Alert>

        <HardButton type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'INGRESANDO...' : 'INGRESAR'}
        </HardButton>
      </form>
    </AuthLayout>
  );
}
