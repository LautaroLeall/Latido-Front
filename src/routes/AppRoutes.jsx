import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { MotionConfig, AnimatePresence, motion } from 'framer-motion';
import ProtectedRoute, { PublicOnlyRoute } from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import HardButton from '../components/ui/HardButton';
import { FullScreenLoader, FullScreenMessage } from '../components/ui/FullScreen';

// Carga diferida por ruta: Landing, Auth, Panel Negocio y Super Admin en chunks independientes
const Landing = lazy(() => import('../features/landing/Landing'));
const PrivacyPage = lazy(() => import('../features/legal/PrivacyPage'));
const AuthShell = lazy(() => import('../features/auth/AuthShell'));
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
 * Orden espacial de grupos de rutas para animar izquierda ↔ derecha según avance o retroceso:
 * Landing (0) → Privacidad (1) → Auth /login /recuperar /reset-password (2) → Paneles (3)
 */
function getRouteGroupMeta(pathname) {
  if (pathname === '/') return { group: 'landing', order: 0 };
  if (pathname === '/privacidad') return { group: 'privacy', order: 1 };
  if (pathname === '/login' || pathname === '/recuperar' || pathname === '/reset-password') {
    return { group: 'auth', order: 2 };
  }
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return { group: 'admin', order: 3 };
  if (pathname === '/super' || pathname.startsWith('/super/')) return { group: 'super', order: 3 };
  return { group: 'notfound', order: 4 };
}

const PAGE_VARIANTS = {
  enter: (dir) => ({
    opacity: 0,
    x: dir >= 0 ? 56 : -56
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: (dir) => ({
    opacity: 0,
    x: dir >= 0 ? -56 : 56,
    transition: {
      duration: 0.18,
      ease: [0.4, 0, 1, 1]
    }
  })
};

function useGroupDirection(meta) {
  const ref = useRef({ group: meta.group, order: meta.order, dir: 1 });
  if (ref.current.group !== meta.group) {
    const dir = meta.order >= ref.current.order ? 1 : -1;
    ref.current = { group: meta.group, order: meta.order, dir };
  }
  return ref.current.dir;
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
  const location = useLocation();
  const meta = getRouteGroupMeta(location.pathname);
  const direction = useGroupDirection(meta);

  const authElement = (
    <AuthShell
      loginElement={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>}
      forgotElement={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>}
      resetElement={<ResetPasswordPage />}
    />
  );

  return (
    <MotionConfig reducedMotion="user">
      <RecoveryRedirect />
      <div className="w-full min-h-[100dvh] overflow-x-clip">
        <AnimatePresence
          mode="wait"
          custom={direction}
          initial={false}
          onExitComplete={() => {
            if (!window.location.hash) {
              window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            }
          }}
        >
          <motion.div
            key={meta.group}
            custom={direction}
            variants={PAGE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full min-h-[100dvh]"
          >
            <Suspense fallback={<FullScreenLoader />}>
              {meta.group === 'auth' ? (
                authElement
              ) : (
                <Routes location={location}>
                  {/* Públicas */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/privacidad" element={<PrivacyPage />} />

                  {/* Privadas */}
                  <Route path="/admin/*" element={
                    <ProtectedRoute roles={['admin', 'employee']} requireBusiness><AdminDashboard /></ProtectedRoute>
                  } />
                  <Route path="/super/*" element={
                    <ProtectedRoute roles={['super_admin']}><SuperDashboard /></ProtectedRoute>
                  } />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              )}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
