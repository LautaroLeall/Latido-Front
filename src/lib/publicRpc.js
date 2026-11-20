/**
 * Cliente ligero para las 2 RPC públicas del ticket (/f/:token):
 *   - get_business_by_token
 *   - submit_feedback
 *
 * Usa `fetch` directo contra PostgREST con los mismos headers oficiales de Supabase
 * (`apikey` + `Authorization: Bearer`), evitando cargar los ~55 KB gzip del SDK completo
 * (Auth + Realtime + Storage) en el celular del cliente que solo escanea un QR.
 */
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const isPublicRpcConfigured = Boolean(supabaseUrl && supabaseKey);

export async function callPublicRpc(fnName, params = {}) {
  if (!isPublicRpcConfigured) {
    return { data: null, error: new Error('Falta configurar las credenciales de Supabase.') };
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${encodeURIComponent(fnName)}`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(params)
    });

    const text = await res.text();
    let parsed = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!res.ok) {
      const err = new Error(parsed?.message || `Error del servidor (${res.status}).`);
      err.code = parsed?.code;
      err.details = parsed?.details;
      err.hint = parsed?.hint;
      return { data: null, error: err };
    }

    return { data: parsed, error: null };
  } catch (networkErr) {
    return { data: null, error: networkErr };
  }
}
