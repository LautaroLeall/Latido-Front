import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import ProtectedRoute, { PublicOnlyRoute } from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import HardButton from '../components/ui/HardButton';
import { FullScreenLoader, FullScreenMessage } from '../components/ui/FullScreen';

// Carga diferida por ruta: Landing, Panel Negocio y Super Admin en chunks independientes
const Landing = lazy(() => import('../features/landing/Landing'));
const PrivacyPage = lazy(() => import('../features/legal/PrivacyPage'));
const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('../features/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../features/auth/ResetPasswordPage'));
const AdminDashboard = lazy(() => import('../features/admin/AdminDashboard'));
const SuperDashboard = lazy(() => import('../features/super/SuperDashboard'));

function NotFound() {
  return (
    <FullScreenMessage stamp="404" stampVariant="ink" title="Esta página no existe"
      actions={<HardButton as={Link} to="/" size="sm">Volver al inicio</HardButton>}>
      Revisá la dirección o volvé al inicio.
    </FullScreenMessage>
  );
}

/**
 * Si Supabase devolvió al usuario a otra URL tras el enlace de recuperación,
 * lo llevamos a la pantalla de nueva contraseña.
 */
function RecoveryRedirect() {
  const { recoveryMode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (recoveryMode && location.pathname !== '/reset-password') {
      navigate('/reset-password', { replace: true });
    }
  }, [recoveryMode, location.pathname, navigate]);

  return null;
}

export default function AppRoutes() {
  return (
    <>
      <RecoveryRedirect />
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Landing />} />
          <Route path="/privacidad" element={<PrivacyPage />} />

          {/* Solo visitantes (no hay registro público: las cuentas las crea el Super Admin) */}
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/recuperar" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Privadas */}
          <Route path="/admin/*" element={
            <ProtectedRoute roles={['admin', 'employee']} requireBusiness><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/super/*" element={
            <ProtectedRoute roles={['super_admin']}><SuperDashboard /></ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
