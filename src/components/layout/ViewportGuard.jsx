import { useEffect } from 'react';

const FORM_TAGS = new Set(['INPUT', 'SELECT', 'TEXTAREA']);

/**
 * Mantiene el viewport móvil alineado de forma natural cuando se abre o cierra
 * el teclado virtual o el selector nativo en iOS Safari, Android Chrome y WebViews
 * (WhatsApp / Instagram), evitando corrimientos horizontales residuales.
 */
export default function ViewportGuard() {
  useEffect(() => {
    let settleTimer = null;

    const resetHorizontalDrift = () => {
      if (window.scrollX !== 0 || document.documentElement.scrollLeft !== 0) {
        window.scrollTo({ left: 0, top: window.scrollY, behavior: 'auto' });
        document.documentElement.scrollLeft = 0;
        if (document.body) document.body.scrollLeft = 0;
      }
    };

    const onFocusOut = (event) => {
      if (!FORM_TAGS.has(event.target?.tagName)) return;
      clearTimeout(settleTimer);
      // Esperar a que iOS/Android cierre el teclado o selector y reacomodar si hubo corrimiento lateral
      settleTimer = setTimeout(() => {
        const activeTag = document.activeElement?.tagName;
        if (!FORM_TAGS.has(activeTag)) {
          resetHorizontalDrift();
        }
      }, 140);
    };

    const onViewportResize = () => {
      resetHorizontalDrift();
    };

    document.addEventListener('focusout', onFocusOut, true);
    window.addEventListener('orientationchange', onViewportResize);
    window.visualViewport?.addEventListener('resize', onViewportResize);

    return () => {
      clearTimeout(settleTimer);
      document.removeEventListener('focusout', onFocusOut, true);
      window.removeEventListener('orientationchange', onViewportResize);
      window.visualViewport?.removeEventListener('resize', onViewportResize);
    };
  }, []);

  return null;
}
