import React, { useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useIsPresent } from 'framer-motion';
import AuthSidebar from './AuthSidebar';

const AUTH_ORDER = {
  '/login': 1,
  '/recuperar': 2,
  '/reset-password': 3
};

const TICKET_VARIANTS = {
  enter: (dir) => ({
    opacity: 0,
    x: dir >= 0 ? 44 : -44,
    scale: 0.985
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: (dir) => ({
    opacity: 0,
    x: dir >= 0 ? -44 : 44,
    scale: 0.985,
    transition: {
      duration: 0.18,
      ease: [0.4, 0, 1, 1]
    }
  })
};

function useAuthStepDirection(pathname) {
  const ref = useRef({ path: pathname, order: AUTH_ORDER[pathname] ?? 1, dir: 1 });
  if (ref.current.path !== pathname) {
    const nextOrder = AUTH_ORDER[pathname] ?? 1;
    const dir = nextOrder >= ref.current.order ? 1 : -1;
    ref.current = { path: pathname, order: nextOrder, dir };
  }
  return ref.current.dir;
}

/**
 * Shell persistente para /login, /recuperar y /reset-password:
 * - Mantiene el sidebar oscuro montado e interactivo en escritorio sin parpadeos.
 * - Anima direccionalmente (izq ↔ der) el ticket al moverse entre pasos de auth.
 */
export default function AuthShell({ loginElement, forgotElement, resetElement }) {
  const liveLocation = useLocation();
  const isPresent = useIsPresent();
  const frozenLocationRef = useRef(liveLocation);
  if (isPresent) {
    frozenLocationRef.current = liveLocation;
  }
  const location = frozenLocationRef.current;
  const direction = useAuthStepDirection(location.pathname);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col lg:flex-row bg-paper-dim overflow-x-clip">
      <AuthSidebar activePath={location.pathname} />

      <main className="flex-1 min-w-0 flex flex-col items-center justify-center px-3.5 sm:px-6 lg:px-10 pt-[max(1.75rem,env(safe-area-inset-top))] pb-[max(2.25rem,env(safe-area-inset-bottom))] lg:py-8 overflow-x-clip">
        <AnimatePresence
          mode="wait"
          custom={direction}
          onExitComplete={() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })}
        >
          <motion.div
            key={location.pathname}
            custom={direction}
            variants={TICKET_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full max-w-[430px]"
          >
            <Routes location={location}>
              <Route path="/login" element={loginElement} />
              <Route path="/recuperar" element={forgotElement} />
              <Route path="/reset-password" element={resetElement} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
