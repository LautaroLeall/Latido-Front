import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import Field from '../../components/ui/Field';
import Alert from '../../components/ui/Alert';
import HardButton from '../../components/ui/HardButton';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../lib/errors';
import { validateEmail } from '../../lib/validators';

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
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
    setSubmitting(true);
    try {
      await sendPasswordReset(emailRes.value);
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Recuperar acceso"
      title="¿Olvidaste tu contraseña?"
      subtitle="Te enviamos un enlace para crear una nueva."
      footer={<p><Link to="/login" className="text-teal font-bold underline">Volver a ingresar</Link></p>}
    >
      {sent ? (
        // Mensaje neutro: no revela si el email existe (evita enumeración de cuentas)
        <Alert variant="success" title="Revisá tu email">
          Si <strong>{email.trim()}</strong> tiene una cuenta en Latido, vas a recibir un enlace en unos minutos.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field id="email" label="Email" type="email" autoComplete="email"
            value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@negocio.com" />
          <Alert variant="error">{error}</Alert>
          <HardButton type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'ENVIANDO...' : 'ENVIAR ENLACE'}
          </HardButton>
        </form>
      )}
    </AuthLayout>
  );
}
