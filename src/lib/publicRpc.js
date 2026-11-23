/**
 * Cliente ligero para endpoints públicos PostgREST (sin descargar el SDK completo de Supabase):
 *   - RPCs del ticket (/f/:token): get_business_by_token, submit_feedback
 *   - Consulta pública de planes en la landing: table `plans`
 *
 * Incluye timeout automático (12s) y soporte de AbortSignal para redes móviles inestables.
 */
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const DEFAULT_TIMEOUT_MS = 12000;

export const isPublicRpcConfigured = Boolean(supabaseUrl && supabaseKey);

function createTimeoutController(externalSignal, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timer);
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      clearTimeout(timer);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    }
  };
}

async function parseJsonResponse(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function callPublicRpc(fnName, params = {}, options = {}) {
  if (!isPublicRpcConfigured) {
    return { data: null, error: new Error('Falta configurar las credenciales de Supabase.') };
  }

  const { signal: externalSignal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const ctrl = createTimeoutController(externalSignal, timeoutMs);

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${encodeURIComponent(fnName)}`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(params),
      signal: ctrl.signal
    });

    const parsed = await parseJsonResponse(res);

    if (!res.ok) {
      const err = new Error(parsed?.message || `Error del servidor (${res.status}).`);
      err.code = parsed?.code;
      err.details = parsed?.details;
      err.hint = parsed?.hint;
      return { data: null, error: err };
    }

    return { data: parsed, error: null };
  } catch (networkErr) {
    if (ctrl.didTimeout()) {
      return { data: null, error: new Error('La conexión tardó demasiado. Revisá tu señal y probá de nuevo.') };
    }
    return { data: null, error: networkErr };
  } finally {
    ctrl.cleanup();
  }
}

export async function fetchPublicTable(table, queryString = '', options = {}) {
  if (!isPublicRpcConfigured) {
    return { data: null, error: new Error('Falta configurar las credenciales de Supabase.') };
  }

  const { signal: externalSignal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const ctrl = createTimeoutController(externalSignal, timeoutMs);
  const qs = queryString ? `?${queryString.replace(/^\?/, '')}` : '';

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent(table)}${qs}`, {
      method: 'GET',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json'
      },
      signal: ctrl.signal
    });

    const parsed = await parseJsonResponse(res);

    if (!res.ok) {
      const err = new Error(parsed?.message || `Error del servidor (${res.status}).`);
      err.code = parsed?.code;
      return { data: null, error: err };
    }

    return { data: parsed, error: null };
  } catch (networkErr) {
    if (ctrl.didTimeout()) {
      return { data: null, error: new Error('La conexión tardó demasiado.') };
    }
    return { data: null, error: networkErr };
  } finally {
    ctrl.cleanup();
  }
}
