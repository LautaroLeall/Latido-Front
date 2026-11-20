import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { FullScreenLoader } from './components/ui/FullScreen';

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
    <BrowserRouter>
      <Suspense fallback={<FullScreenLoader />}>
        <RootSwitch />
      </Suspense>
    </BrowserRouter>
  );
}
