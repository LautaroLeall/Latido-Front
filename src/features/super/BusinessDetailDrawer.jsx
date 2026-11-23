import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  X, RotateCw, ExternalLink, MessageCircle, Mail, CheckCircle2,
  AlertTriangle, Sparkles, Building2, LifeBuoy, QrCode, Activity, ShieldCheck
} from 'lucide-react';
import BusinessLogo from '../../components/branding/BusinessLogo';
import Stamp from '../../components/ui/Stamp';
import HardButton from '../../components/ui/HardButton';
import Alert from '../../components/ui/Alert';
import { StarsText } from '../admin/components/PanelBits';
import { supabase } from '../../lib/supabaseClient';
import { getErrorMessage } from '../../lib/errors';
import {
  buildFeedbackUrl, formatDateTime, formatMoney, formatRelative, OUTCOME_LABELS
} from '../../lib/utils';
import { buildGmailUrl } from '../../lib/contact';

const DEST_LABELS = {
  panel: { label: 'Solo panel (Latido)', variant: 'ink' },
  google: { label: 'Solo Google (directo)', variant: 'amber' },
  both: { label: 'Ambas (Latido → Google)', variant: 'teal' }
};

const RESCUE_STATUS_LABELS = {
  open: { label: 'Rescate abierto', variant: 'red' },
  contacted: { label: 'Contactado', variant: 'amber' },
  resolved: { label: 'Resuelto', variant: 'teal' },
  dismissed: { label: 'Descartado', variant: 'ink' }
};

function daysSince(iso) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

/**
 * Construye recomendaciones concretas para que el Super Admin ayude a este negocio.
 */
function buildSupportInsights(diag) {
  const b = diag.business || {};
  const m = diag.metrics || {};
  const r = diag.rescue || {};
  const branches = diag.branches || [];
  const items = [];

  if (!b.active) {
    items.push({
      level: 'urgent',
      title: 'Cuenta suspendida',
      detail: 'Sus QR y chips NFC están pausados. Consultá si quieren reactivar el servicio.',
      tip: 'si quieren reactivar los soportes QR + NFC de tu local'
    });
  }

  if (Number(r.cases_overdue || 0) > 0) {
    const n = Number(r.cases_overdue);
    items.push({
      level: 'urgent',
      title: `${n} ${n === 1 ? 'caso con SLA vencido' : 'casos con SLA vencido'}`,
      detail: 'Hay clientes insatisfechos esperando respuesta en Modo Rescate.',
      tip: `tenés ${n} ${n === 1 ? 'caso' : 'casos'} pendiente${n === 1 ? '' : 's'} en Modo Rescate esperando respuesta`
    });
  }

  const loginDays = daysSince(b.owner_last_sign_in_at);
  if (!b.owner_last_sign_in_at) {
    items.push({
      level: 'warn',
      title: 'El dueño todavía nunca inició sesión',
      detail: 'Conviene acompañar el primer ingreso para dejar todo listo en 5 minutos.',
      tip: 'todavía no ingresaste al panel, si querés hacemos juntos el primer acceso en 5 minutos'
    });
  } else if (loginDays >= 14) {
    items.push({
      level: 'warn',
      title: `Hace ${loginDays} días que no entra al panel`,
      detail: 'Puede estar perdiéndose métricas u opiniones recientes.',
      tip: 'hace un par de semanas que no ingresás al panel y tenés métricas para revisar'
    });
  }

  const resp7 = Number(m.responses_7d || 0);
  const respTotal = Number(m.responses_total || 0);
  if (b.active && respTotal === 0) {
    items.push({
      level: 'warn',
      title: 'Todavía no recibió ninguna opinión',
      detail: 'Verificá si ya colocaron la lámina QR/NFC en un lugar visible del mostrador o caja.',
      tip: 'vi que todavía no entraron opiniones: podemos revisar juntos dónde ubicar el soporte QR/NFC para que los clientes lo escaneen más'
    });
  } else if (b.active && resp7 === 0) {
    items.push({
      level: 'warn',
      title: '0 opiniones en los últimos 7 días',
      detail: 'Revisá si el soporte físico sigue visible o si el equipo lo está mencionando al cobrar.',
      tip: 'esta semana no entraron opiniones nuevas: ¿el soporte QR/NFC sigue visible en el mostrador?'
    });
  }

  if (!b.logo_url) {
    items.push({
      level: 'info',
      title: 'Sin logo cargado',
      detail: 'Está usando monograma de iniciales. Subir el logo mejora la confianza en el ticket y láminas QR.',
      tip: 'podés subir el logo del negocio desde "Mi cuenta" para que salga en el ticket y las láminas QR'
    });
  }

  if (b.review_destination === 'panel' || !b.has_google_url) {
    items.push({
      level: 'info',
      title: 'Sin reseñas de Google activas',
      detail: 'Podés ayudarlos a copiar su link de Google Maps y activar el modo "Ambas" para sumar reseñas.',
      tip: 'si querés configuramos tu enlace de Google Maps en modo "Ambas" para sumar reseñas públicas después de cada opinión'
    });
  }

  const nfcPending = branches.reduce((acc, br) => acc + Number(br.nfc_pending || 0), 0);
  if (nfcPending > 0) {
    items.push({
      level: 'info',
      title: `${nfcPending} ${nfcPending === 1 ? 'chip NFC pendiente' : 'chips NFC pendientes'} de grabar`,
      detail: 'Coordiná la grabación del chip NTAG213 con la URL del ticket.',
      tip: 'todavía tenemos pendiente grabar el chip NFC para que los clientes solo acerquen el celular'
    });
  }

  if (b.rescue_enabled && Number(b.avg_ticket_value || 0) <= 0) {
    items.push({
      level: 'info',
      title: 'Ticket promedio en $0',
      detail: 'Cargar el ticket promedio les permite ver las ventas estimadas recuperadas en Modo Rescate.',
      tip: 'en Modo Rescate → Ajustes podés cargar tu ticket promedio para medir cuánta plata recuperás cada mes'
    });
  }

  if (!b.has_custom_survey) {
    items.push({
      level: 'info',
      title: 'Usa preguntas predeterminadas',
      detail: 'Podés sugerirles elegir una plantilla de su rubro en Mi cuenta → Preguntas del formulario.',
      tip: 'en "Mi cuenta → Preguntas del formulario" tenés plantillas rápidas por rubro para personalizar los aspectos que eligen tus clientes'
    });
  }

  return items;
}

function buildCoachingText(businessName, ownerName, insights) {
  const first = ownerName ? ownerName.trim().split(/\s+/)[0] : '';
  const tips = insights.slice(0, 3).map((i) => `- ${i.tip.charAt(0).toUpperCase()}${i.tip.slice(1)}.`);
  if (tips.length === 0) {
    return `Hola${first ? ` ${first}` : ''}, ¿cómo venís con Latido en ${businessName}? Vi que el panel viene muy bien encaminado. Cualquier cosa que necesites para aprovecharlo más, avisame.`;
  }
  return [
    `Hola${first ? ` ${first}` : ''}, ¿cómo venís con Latido en ${businessName}?`,
    'Estuve revisando cómo viene tu cuenta para darte una mano:',
    '',
    ...tips,
    '',
    'Si querés lo vemos juntos en 5 minutos.'
  ].join('\n');
}

export default function BusinessDetailDrawer({ business, onClose }) {
  const [diag, setDiag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [migrationMissing, setMigrationMissing] = useState(false);

  const load = useCallback(async (isCancelled = () => false) => {
    if (!business?.business_id) return;
    setLoading(true);
    setError('');
    setMigrationMissing(false);
    try {
      const { data, error: rpcErr } = await supabase.rpc('get_business_diagnostics', {
        p_business_id: business.business_id
      });
      if (isCancelled()) return;
      if (rpcErr) {
        if (rpcErr.code === 'PGRST202' || /get_business_diagnostics|could not find the function/i.test(rpcErr.message || '')) {
          setMigrationMissing(true);
          setDiag(null);
        } else {
          setError(getErrorMessage(rpcErr, 'No pudimos cargar el diagnóstico del negocio.'));
        }
      } else {
        setDiag(data || null);
      }
    } catch (err) {
      if (!isCancelled()) {
        setError(getErrorMessage(err, 'No pudimos cargar el diagnóstico del negocio.'));
      }
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, [business?.business_id]);

  useEffect(() => {
    let cancelled = false;
    load(() => cancelled);
    return () => { cancelled = true; };
  }, [load]);

  // Cerrar con Escape y bloquear scroll de fondo mientras está abierto
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const insights = useMemo(() => (diag ? buildSupportInsights(diag) : []), [diag]);

  const b = diag?.business || business;
  const m = diag?.metrics || null;
  const r = diag?.rescue || null;
  const branches = diag?.branches || [];
  const recent = diag?.recent_activity || [];

  const coachingText = useMemo(
    () => buildCoachingText(b.name, b.owner_name, insights),
    [b.name, b.owner_name, insights]
  );
  const coachingWaHref = `https://wa.me/?text=${encodeURIComponent(coachingText)}`;
  const coachingMailHref = b.owner_email
    ? buildGmailUrl(`Acompañamiento Latido · ${b.name}`, coachingText, b.owner_email)
    : null;

  const closedCases = r ? Number(r.cases_recovered || 0) + Number(r.cases_no_response || 0) + Number(r.cases_declined || 0) : 0;
  const rescueRate = closedCases > 0 ? Math.round((Number(r.cases_recovered || 0) / closedCases) * 100) : 0;
  const slaRate = r && Number(r.contacted_total || 0) > 0
    ? Math.round((Number(r.within_sla_count || 0) / Number(r.contacted_total)) * 100)
    : null;

  const r30 = Number(m?.responses_30d ?? business.responses_30d ?? 0);
  const rPrev30 = Number(m?.responses_prev_30d ?? 0);
  const delta30 = r30 - rPrev30;
  const destInfo = DEST_LABELS[b.review_destination] || DEST_LABELS.panel;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-ink/60 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-biz-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[740px] h-full bg-paper border-l-2 border-ink flex flex-col overflow-hidden shadow-[-8px_0_0_rgba(26,29,41,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera fija */}
        <header className="bg-ink text-paper px-5 py-4 border-b-2 border-ink flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <BusinessLogo name={b.name} logoUrl={b.logo_url} size={44} variant="light" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="drawer-biz-title" className="font-bold text-lg leading-tight break-words">
                  {b.name}
                </h2>
                <Stamp variant={b.active ? 'teal' : 'red'}>{b.active ? 'Activo' : 'Suspendido'}</Stamp>
              </div>
              <div className="font-mono text-[11px] text-paper/75 mt-1 break-all">
                {b.owner_name || 'Sin nombre'}{b.owner_email ? ` · ${b.owner_email}` : ''}
              </div>
              <div className="font-mono text-[10px] text-paper/55 mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                <span>{b.plan_name || business.plan_name} ({business.qr_active}/{b.supports_limit ?? business.supports_limit} soportes)</span>
                <span>· Alta {formatDateTime(b.created_at)}</span>
                {diag && (
                  <span>
                    · Último ingreso:{' '}
                    <strong className="text-paper/85">
                      {b.owner_last_sign_in_at ? formatRelative(b.owner_last_sign_in_at) : 'Nunca'}
                    </strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => load()}
              disabled={loading}
              aria-label="Actualizar diagnóstico"
              title="Actualizar diagnóstico"
              className="p-2 border border-paper/25 text-paper/80 hover:text-paper hover:bg-paper/10 cursor-pointer disabled:opacity-50"
            >
              <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel de detalle"
              className="p-2 border border-paper/25 text-paper/80 hover:text-paper hover:bg-paper/10 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Cuerpo desplazable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-paper-dim/40">
          {error && <Alert variant="error">{error}</Alert>}

          {migrationMissing && (
            <Alert variant="warning" title="Falta aplicar la migración 012 en Supabase">
              Para ver el diagnóstico completo (sucursales, tendencias, Modo Rescate y actividad anonimizada), ejecutá{' '}
              <code className="font-mono bg-paper px-1">012_super_admin_diagnostico.sql</code> en Supabase SQL Editor.
              Mientras tanto te mostramos el resumen base del negocio.
            </Alert>
          )}

          {loading ? (
            <div className="space-y-4">
              <div className="h-28 bg-paper border border-line-gray animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-paper border border-line-gray animate-pulse" />)}
              </div>
              <div className="h-44 bg-paper border border-line-gray animate-pulse" />
            </div>
          ) : (
            <>
              {/* 1. Cómo ayudar a este negocio hoy */}
              {diag && (
                <section className="bg-paper border-[1.5px] border-ink p-4 shadow-hard-line space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-teal shrink-0" />
                      <h3 className="font-bold text-sm uppercase font-mono tracking-wider">
                        Diagnóstico de acompañamiento
                      </h3>
                    </div>
                    <Stamp variant={insights.some((i) => i.level === 'urgent') ? 'red' : insights.length ? 'amber' : 'teal'}>
                      {insights.length === 0 ? 'Todo al día' : `${insights.length} ${insights.length === 1 ? 'oportunidad' : 'oportunidades'}`}
                    </Stamp>
                  </div>

                  {insights.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-teal font-medium bg-teal/5 border border-teal/30 p-3">
                      <CheckCircle2 size={15} className="shrink-0" />
                      <span>
                        Excelente salud: cuenta activa, con logo, Google configurado, encuesta y opiniones recientes sin SLA vencido.
                      </span>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {insights.map((ins) => (
                        <li
                          key={ins.title}
                          className={`p-2.5 border text-xs flex items-start gap-2.5 ${ins.level === 'urgent'
                            ? 'border-alert-red bg-alert-red/5'
                            : ins.level === 'warn'
                              ? 'border-amber bg-amber/10'
                              : 'border-line-gray bg-paper-dim/50'
                            }`}
                        >
                          <AlertTriangle
                            size={14}
                            className={`shrink-0 mt-0.5 ${ins.level === 'urgent' ? 'text-alert-red' : ins.level === 'warn' ? 'text-amber-ink' : 'text-teal'
                              }`}
                          />
                          <div className="min-w-0">
                            <strong className="block text-ink">{ins.title}</strong>
                            <span className="text-muted leading-snug">{ins.detail}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-line-gray">
                    <HardButton as="a" size="sm" variant="teal" href={coachingWaHref} target="_blank" rel="noopener noreferrer">
                      <MessageCircle size={13} /> Enviar sugerencias por WhatsApp
                    </HardButton>
                    {coachingMailHref && (
                      <HardButton as="a" size="sm" variant="secondary" href={coachingMailHref} target="_blank" rel="noopener noreferrer">
                        <Mail size={13} /> Enviar por Gmail
                      </HardButton>
                    )}
                    {business.primary_token && (
                      <HardButton as="a" size="sm" variant="secondary" href={buildFeedbackUrl(business.primary_token)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={13} /> Abrir ticket
                      </HardButton>
                    )}
                  </div>
                </section>
              )}

              {/* 2. Rendimiento y tendencia */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted font-bold">
                  <Activity size={14} className="text-teal" /> Rendimiento de opiniones
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-paper border border-line-gray p-3">
                    <div className="font-mono text-[10px] uppercase text-muted">Últimos 7 días</div>
                    <div className="text-xl font-bold mt-0.5 tabular-nums">{m ? m.responses_7d : '—'}</div>
                  </div>
                  <div className="bg-paper border border-line-gray p-3">
                    <div className="font-mono text-[10px] uppercase text-muted">Últimos 30 días</div>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-xl font-bold tabular-nums">{r30}</span>
                      {m && rPrev30 > 0 && (
                        <span className={`font-mono text-[10px] font-bold ${delta30 >= 0 ? 'text-teal' : 'text-alert-red'}`}>
                          {delta30 >= 0 ? `+${delta30}` : delta30} vs ant.
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-paper border border-line-gray p-3">
                    <div className="font-mono text-[10px] uppercase text-muted">Promedio</div>
                    <div className="text-xl font-bold text-amber-ink mt-0.5 tabular-nums">
                      {m?.avg_stars_30d ? `★ ${m.avg_stars_30d}` : business.avg_stars ? `★ ${business.avg_stars}` : '—'}
                    </div>
                    {m?.avg_stars_all != null && (
                      <div className="font-mono text-[10px] text-muted">Histórico: ★ {m.avg_stars_all}</div>
                    )}
                  </div>
                  <div className="bg-paper border border-line-gray p-3">
                    <div className="font-mono text-[10px] uppercase text-muted">Última opinión</div>
                    <div className="text-sm font-bold mt-1 leading-tight">
                      {m?.last_response_at ? formatRelative(m.last_response_at) : 'Sin actividad'}
                    </div>
                    {m && Number(m.low_ratings_30d || 0) > 0 && (
                      <div className="font-mono text-[10px] text-alert-red mt-0.5">
                        {m.low_ratings_30d} alerta{Number(m.low_ratings_30d) === 1 ? '' : 's'} (≤2★) en 30d
                      </div>
                    )}
                  </div>
                </div>

                {m && Number(m.responses_total || 0) > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-paper border border-line-gray p-4">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold mb-2">
                        Distribución histórica ({m.responses_total})
                      </div>
                      <div className="space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const cnt = Number(m.distribution?.[star] || 0);
                          const pct = m.responses_total ? Math.round((cnt / m.responses_total) * 100) : 0;
                          return (
                            <div key={star} className="flex items-center gap-2 font-mono text-[11px]">
                              <span className="w-6 text-right">{star}★</span>
                              <div className="flex-1 h-2.5 bg-paper-dim border border-line-gray">
                                <div
                                  className={`h-full ${star <= 2 ? 'bg-alert-red' : star === 3 ? 'bg-amber' : 'bg-teal'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-14 text-right text-muted tabular-nums">{cnt} · {pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-paper border border-line-gray p-4">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold mb-2">
                        Aspectos más mencionados (90 días)
                      </div>
                      {m.top_tags?.length > 0 ? (
                        <ul className="space-y-1.5">
                          {m.top_tags.map((item) => (
                            <li key={item.tag} className="flex justify-between font-mono text-xs border-b border-dashed border-line-gray pb-1 last:border-0">
                              <span className="truncate pr-2">#{item.tag}</span>
                              <strong className="tabular-nums">{item.count}</strong>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted">Todavía no hay etiquetas en los últimos 90 días.</p>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* 3. Salud del Modo Rescate */}
              {r && (
                <section className="bg-paper border border-line-gray p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted font-bold">
                      <LifeBuoy size={14} className="text-teal" /> Salud del Modo Rescate
                    </div>
                    <Stamp variant={b.rescue_enabled ? 'teal' : 'ink'}>
                      {b.rescue_enabled ? `Activo · ≤${b.rescue_threshold}★ · SLA ${b.rescue_sla_minutes}m` : 'Pausado'}
                    </Stamp>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
                    <div className="bg-paper-dim border border-line-gray p-2.5">
                      <div className="text-[10px] uppercase text-muted">Tasa rescate</div>
                      <div className="text-lg font-bold text-teal">{rescueRate}%</div>
                    </div>
                    <div className="bg-paper-dim border border-line-gray p-2.5">
                      <div className="text-[10px] uppercase text-muted">Dentro de SLA</div>
                      <div className="text-lg font-bold">{slaRate != null ? `${slaRate}%` : '—'}</div>
                    </div>
                    <div className="bg-paper-dim border border-line-gray p-2.5">
                      <div className="text-[10px] uppercase text-muted">1.º contacto</div>
                      <div className="text-lg font-bold">
                        {r.avg_first_response_min != null ? `${r.avg_first_response_min} min` : '—'}
                      </div>
                    </div>
                    <div className="bg-paper-dim border border-line-gray p-2.5">
                      <div className="text-[10px] uppercase text-muted">Recuperado est.</div>
                      <div className="text-base font-bold text-teal truncate">
                        {formatMoney(r.recovered_value, b.currency)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted pt-1">
                    <span>Total: <strong className="text-ink">{r.cases_total}</strong></span>
                    <span>Abiertos: <strong className={Number(r.cases_open) > 0 ? 'text-alert-red' : 'text-ink'}>{r.cases_open}</strong></span>
                    {Number(r.cases_overdue) > 0 && (
                      <span className="text-alert-red font-bold">SLA vencidos: {r.cases_overdue}</span>
                    )}
                    <span>Contactados: <strong className="text-ink">{r.cases_contacted}</strong></span>
                    <span>Rescatados: <strong className="text-teal">{r.cases_recovered}</strong></span>
                    <span>Sin resp.: <strong className="text-ink">{r.cases_no_response}</strong></span>
                    <span>Rechazó: <strong className="text-ink">{r.cases_declined}</strong></span>
                    <span>Descartados: <strong className="text-ink">{r.cases_dismissed}</strong></span>
                  </div>
                </section>
              )}

              {/* 4. Configuración actual del negocio */}
              {diag && (
                <section className="bg-paper border border-line-gray p-4 space-y-2.5">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted font-bold">
                    <Building2 size={14} className="text-teal" /> Configuración del local
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-paper-dim/70 border border-line-gray p-2.5">
                      <dt className="text-[10px] uppercase text-muted">Destino de reseñas</dt>
                      <dd className="mt-1 flex items-center gap-2 flex-wrap">
                        <Stamp variant={destInfo.variant}>{destInfo.label}</Stamp>
                        {b.has_google_url && b.google_review_url && (
                          <a
                            href={b.google_review_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal underline inline-flex items-center gap-1"
                          >
                            Ver link Google <ExternalLink size={11} />
                          </a>
                        )}
                      </dd>
                    </div>
                    <div className="bg-paper-dim/70 border border-line-gray p-2.5">
                      <dt className="text-[10px] uppercase text-muted">Marca y formulario</dt>
                      <dd className="mt-1 text-ink">
                        {b.logo_url ? 'Logo propio activo' : 'Sin logo (usa iniciales)'} ·{' '}
                        {b.has_custom_survey ? 'Encuesta personalizada' : 'Preguntas por defecto'}
                      </dd>
                    </div>
                    <div className="bg-paper-dim/70 border border-line-gray p-2.5">
                      <dt className="text-[10px] uppercase text-muted">Ticket promedio y firma</dt>
                      <dd className="mt-1 text-ink">
                        {formatMoney(b.avg_ticket_value, b.currency)} · Firma: {b.manager_name || 'Sin definir'}
                      </dd>
                    </div>
                    <div className="bg-paper-dim/70 border border-line-gray p-2.5">
                      <dt className="text-[10px] uppercase text-muted">Último acceso del dueño</dt>
                      <dd className="mt-1 text-ink">
                        {b.owner_last_sign_in_at
                          ? `${formatRelative(b.owner_last_sign_in_at)} (${formatDateTime(b.owner_last_sign_in_at)})`
                          : 'Todavía nunca ingresó al panel'}
                      </dd>
                    </div>
                  </dl>
                </section>
              )}

              {/* 5. Desglose por sucursal y soportes QR / NFC */}
              {branches.length > 0 && (
                <section className="bg-paper border border-line-gray p-4 space-y-3">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted font-bold">
                    <QrCode size={14} className="text-teal" /> Sucursales y soportes ({branches.length})
                  </div>
                  <div className="divide-y divide-dashed divide-line-gray">
                    {branches.map((br) => (
                      <div key={br.branch_id} className="py-2.5 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-ink">{br.name}</div>
                          <div className="font-mono text-[11px] text-muted mt-0.5 flex flex-wrap gap-x-2.5">
                            <span>QR activos: <strong className="text-ink">{br.qr_active}/{br.qr_total}</strong></span>
                            <span>
                              NFC: <strong className="text-teal">{br.nfc_programmed} grab.</strong>
                              {Number(br.nfc_pending) > 0 && (
                                <> · <strong className="text-amber-ink">{br.nfc_pending} pend.</strong></>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="font-mono text-right text-[11px]">
                          <div>
                            <strong>{br.responses_30d}</strong> op. (30d) ·{' '}
                            <strong className="text-amber-ink">{br.avg_stars_30d ? `★ ${br.avg_stars_30d}` : '—'}</strong>
                          </div>
                          <div className="text-[10px] text-muted">
                            {br.last_response_at ? `Última ${formatRelative(br.last_response_at)}` : 'Sin opiniones aún'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 6. Actividad reciente estrictamente anonimizada */}
              {diag && (
                <section className="bg-paper border border-line-gray p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted font-bold">
                      <ShieldCheck size={14} className="text-teal" /> Últimas opiniones (datos mínimos anonimizados)
                    </div>
                    <span className="font-mono text-[10px] text-muted">Sin PII ni texto libre</span>
                  </div>

                  {recent.length === 0 ? (
                    <p className="text-xs text-muted">Este negocio todavía no recibió opiniones.</p>
                  ) : (
                    <div className="divide-y divide-dashed divide-line-gray">
                      {recent.map((ev, idx) => {
                        const rBadge = ev.rescue_status ? RESCUE_STATUS_LABELS[ev.rescue_status] : null;
                        return (
                          <div key={`${ev.created_at}-${idx}`} className="py-2.5 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <StarsText value={ev.stars} className="text-sm" />
                                <span className="font-mono text-[11px] text-muted">
                                  {ev.branch_name || 'Sucursal'} · {formatRelative(ev.created_at)}
                                </span>
                              </div>
                              {ev.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                                  {ev.tags.map((t) => (
                                    <span key={t} className="font-mono text-[11px] text-ink/80">#{t}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap font-mono text-[10px]">
                              {ev.has_comment && (
                                <span className="px-1.5 py-0.5 border border-line-gray bg-paper-dim text-muted">
                                  Con comentario
                                </span>
                              )}
                              {ev.has_contact && (
                                <span className="px-1.5 py-0.5 border border-amber bg-amber/10 text-amber-ink font-bold">
                                  Dejó contacto
                                </span>
                              )}
                              {rBadge && (
                                <Stamp variant={ev.rescue_outcome === 'recovered' ? 'teal' : rBadge.variant}>
                                  {ev.rescue_outcome ? (OUTCOME_LABELS[ev.rescue_outcome] || rBadge.label) : rBadge.label}
                                </Stamp>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <p className="font-mono text-[10px] text-muted pt-2 border-t border-dashed border-line-gray leading-relaxed">
                    Privacidad Ley 25.326: esta vista es de solo lectura y omite nombres, teléfonos, emails y comentarios escritos por clientes finales.
                  </p>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
