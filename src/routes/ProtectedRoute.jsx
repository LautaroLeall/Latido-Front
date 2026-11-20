import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, homePathFor } from '../context/AuthContext';
import { FullScreenLoader, FullScreenMessage } from '../components/ui/FullScreen';
import HardButton from '../components/ui/HardButton';
import { getErrorMessage } from '../lib/errors';

/**
 * Pantalla cuando faltan las variables de entorno de Supabase
 */
export function ConfigMissing() {
  return (
    <FullScreenMessage stamp="SIN CONEXIÓN" stampVariant="red" shadow="red" title="Falta configurar Supabase">
      Creá el archivo <code className="font-mono bg-paper-dim px-1">.env</code> en la carpeta Frontend con
      <code className="font-mono bg-paper-dim px-1">VITE_SUPABASE_URL</code> y
      <code className="font-mono bg-paper-dim px-1">VITE_SUPABASE_PUBLISHABLE_KEY</code>, y reiniciá <code className="font-mono">npm run dev</code>.
    </FullScreenMessage>
  );
}

/**
 * Protege rutas privadas.
 * - roles: lista de roles permitidos (ej. ['admin', 'employee'])
 * - requireBusiness: exige que el perfil tenga negocio asignado y activo
 *
 * Esto es UX. La seguridad real está en la base (RLS + RPCs): aunque alguien
 * forzara una ruta, Supabase no le devolvería datos ajenos.
 */
export default function ProtectedRoute({ roles, requireBusiness = false, children }) {
  const { configured, loading, user, profile, profileError, signOut, refreshProfile } = useAuth();
  const location = useLocation();

  if (!configured) return <ConfigMissing />;
  if (loading) return <FullScreenLoader label="Verificando sesión..." />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!profile) {
    return (
      <FullScreenMessage
        stamp="ERROR"
        stampVariant="red"
        shadow="red"
        title="No pudimos cargar tu cuenta"
        actions={
          <>
            <HardButton size="sm" onClick={refreshProfile}>Reintentar</HardButton>
            <HardButton size="sm" variant="secondary" onClick={signOut}>Cerrar sesión</HardButton>
          </>
        }
      >
        {getErrorMessage(profileError, 'Tu perfil no está disponible en este momento.')}
      </FullScreenMessage>
    );
  }

  if (roles && !roles.includes(profile.role)) {
    return <Navigate to={homePathFor(profile)} replace />;
  }

  if (requireBusiness && !profile.business_id) {
    return (
      <FullScreenMessage
        stamp="PENDIENTE"
        stampVariant="amber"
        title="Tu cuenta todavía no tiene un negocio asignado"
        actions={<HardButton size="sm" variant="secondary" onClick={signOut}>Cerrar sesión</HardButton>}
      >
        Contactá al equipo de Latido para que vinculen tu cuenta a tu negocio, y volvé a ingresar.
      </FullScreenMessage>
    );
  }

  if (requireBusiness && profile.business && profile.business.active === false) {
    return (
      <FullScreenMessage
        stamp="SUSPENDIDO"
        stampVariant="red"
        shadow="red"
        title="El negocio está suspendido"
        actions={<HardButton size="sm" variant="secondary" onClick={signOut}>Cerrar sesión</HardButton>}
      >
        Tus QR y chips NFC están pausados. Contactá al equipo de Latido para reactivar la cuenta.
      </FullScreenMessage>
    );
  }

  return children;
}

/**
 * Rutas solo para visitantes (login, recuperar contraseña). Si ya hay sesión, redirige a su panel.
 */
export function PublicOnlyRoute({ children }) {
  const { configured, loading, user, profile } = useAuth();
  const location = useLocation();

  if (!configured) return <ConfigMissing />;
  if (loading) return <FullScreenLoader label="Verificando sesión..." />;
  if (user && profile) {
    // Volver a la página privada que se intentó abrir (el guard de esa ruta valida el rol)
    const from = location.state?.from;
    const target = from && from.startsWith('/') && !from.startsWith('//') ? from : homePathFor(profile);
    return <Navigate to={target} replace />;
  }
  return children;
}
