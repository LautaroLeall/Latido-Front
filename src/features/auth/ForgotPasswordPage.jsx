import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import AuthLayout from './AuthLayout';
import Field from '../../components/ui/Field';
import Alert from '../../components/ui/Alert';
import HardButton from '../../components/ui/HardButton';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../lib/errors';
import { buildWhatsAppUrl, displayPhone } from '../../lib/contact';
import { validateEmail } from '../../lib/validators';

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot anti-bots
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { status: 'sent' | 'not_found' | 'suspended', email }
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setResult(null);

    const emailRes = validateEmail(email);
    if (!emailRes.valid) {
      setError(emailRes.error);
      return;
    }

    // Descartar bots silenciosamente si completaron el campo trampa
    if (website.trim().length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await sendPasswordReset(emailRes.value);
      if (res?.sent) {
        setResult({ status: 'sent', email: emailRes.value });
      } else {
        setResult({ status: res?.reason === 'suspended' ? 'suspended' : 'not_found', email: emailRes.value });
      }
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
      subtitle="Ingresá el email de tu negocio o cuenta administradora y te enviamos un enlace para crear una nueva."
      footer={<p><Link to="/login" className="text-teal font-bold underline">Volver a ingresar</Link></p>}
    >
      {result?.status === 'sent' ? (
        <div className="space-y-4">
          <Alert variant="success" title="Enlace enviado">
            Enviamos un correo de recuperación a <strong>{result.email}</strong>. Revisá tu bandeja de entrada o correo no deseado en los próximos minutos.
          </Alert>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setEmail('');
            }}
            className="font-mono text-xs text-muted hover:text-ink underline cursor-pointer py-1"
          >
            Probar con otro email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field
            id="email"
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            enterKeyHint="send"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
              if (result) setResult(null);
            }}
            placeholder="tu@negocio.com"
          />

          {/* Honeypot anti-bots invisible */}
          <div className="sr-only" aria-hidden="true">
            <label htmlFor="recover-website">Sitio web</label>
            <input
              id="recover-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <Alert variant="error">{error}</Alert>

          {result?.status === 'not_found' && (
            <div role="alert" className="border-[1.5px] border-alert-red bg-alert-red/5 p-3.5 space-y-3 animate-fadeIn">
              <div className="space-y-1">
                <div className="font-mono font-bold text-[11px] uppercase tracking-wider text-alert-red">
                  Email incorrecto o sin cuenta creada
                </div>
                <p className="text-xs text-ink/90 leading-relaxed">
                  No encontramos ningún negocio ni cuenta registrada con <strong className="break-all">{result.email}</strong>.
                  Verificá que esté bien escrito o comunicate con nosotros por WhatsApp para crear tu cuenta o revisar tu acceso.
                </p>
              </div>
              <HardButton
                as="a"
                size="sm"
                variant="teal"
                className="w-full"
                href={buildWhatsAppUrl(
                  `Hola, intenté recuperar mi contraseña en Latido con el email ${result.email} pero no figura ninguna cuenta creada.`
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={14} className="shrink-0" />{displayPhone()}
              </HardButton>
            </div>
          )}

          {result?.status === 'suspended' && (
            <div role="alert" className="border-[1.5px] border-amber bg-amber/10 p-3.5 space-y-3 animate-fadeIn">
              <div className="space-y-1">
                <div className="font-mono font-bold text-[11px] uppercase tracking-wider text-amber-ink">
                  Cuenta pausada temporalmente
                </div>
                <p className="text-xs text-ink/90 leading-relaxed">
                  El negocio vinculado a <strong className="break-all">{result.email}</strong> se encuentra suspendido, por lo que no enviamos el correo de recuperación.
                  Escribinos por WhatsApp para reactivar el acceso.
                </p>
              </div>
              <HardButton
                as="a"
                size="sm"
                variant="teal"
                className="w-full"
                href={buildWhatsAppUrl(
                  `Hola, necesito ayuda con mi cuenta pausada en Latido (${result.email}).`
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={14} className="shrink-0" /> Hablar por WhatsApp ({displayPhone()})
              </HardButton>
            </div>
          )}

          <HardButton type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'VERIFICANDO...' : 'ENVIAR ENLACE'}
          </HardButton>
        </form>
      )}
    </AuthLayout>
  );
}
