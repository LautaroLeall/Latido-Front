import { createClient } from '@supabase/supabase-js';

// Credenciales del proyecto Latido (Supabase)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validación temprana — si faltan vars, el front corre en modo demo sin crash
if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[LATIDO] Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY.\n' +
    'El frontend iniciará en modo desconectado / demo. Verificá el archivo .env'
  );
}

/**
 * Cliente de Supabase para el Frontend.
 * Es `null` si las variables de entorno no están configuradas (modo demo local).
 * Usar siempre con guard: if (supabase) { ... }
 */
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;
