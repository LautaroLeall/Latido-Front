import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        // Separación por dominio: /f/:token nunca descarga Framer Motion, QR generator ni iconos del panel
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@supabase/')) return 'supabase';
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'motion';
          if (id.includes('qrcode.react')) return 'qr';
          if (id.includes('canvas-confetti')) return 'confetti';
          if (id.includes('lucide-react')) return 'icons';
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/') ||
            id.includes('/react-router')
          ) {
            return 'react';
          }
          return undefined;
        }
      }
    }
  }
});
