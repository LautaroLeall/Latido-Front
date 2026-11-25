import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { FullScreenLoader } from './components/ui/FullScreen';
import RouteSEO from './components/layout/RouteSEO';
import ScrollToTop from './components/layout/ScrollToTop';
import ViewportGuard from './components/layout/ViewportGuard';

// El ticket público (/f/:token) se aísla del SDK completo de Supabase y de AuthProvider
// para cargar en < 1.5s en 4G y mantener el bundle por debajo de 150 KB gzip.
const FeedbackView = lazy(() => import('./features/feedback/FeedbackView'));
const AuthenticatedApp = lazy(() => import('./routes/AuthenticatedApp'));

function RootSwitch() {
  const { pathname } = useLocation();
  if (/^\/f\/[^/]+\/?$/.test(pathname)) {
    return (
      <Routes>
        <Route path="/f/:token" element={<FeedbackView />} />
      </Routes>
    );
  }
  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <ViewportGuard />
        <RouteSEO />
        <Suspense fallback={<FullScreenLoader />}>
          <RootSwitch />
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
