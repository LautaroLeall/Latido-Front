import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2, PlusCircle, Tags, LogOut, Menu, X, Mail, MessageCircle,
  ExternalLink, Pencil, Check, RotateCw
} from 'lucide-react';
import LatidoLogo from '../../components/branding/LatidoLogo';
import BusinessLogo from '../../components/branding/BusinessLogo';
import Stamp from '../../components/ui/Stamp';
import HardButton from '../../components/ui/HardButton';
import Alert from '../../components/ui/Alert';
import { StatCard, EmptyState } from '../admin/components/PanelBits';
import PlansManager from './PlansManager';
import CreateBusinessForm from './CreateBusinessForm';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { getErrorMessage } from '../../lib/errors';
import { buildFeedbackUrl, formatDateTime, formatMoney } from '../../lib/utils';
import { buildGmailUrl } from '../../lib/contact';
import { validateBusinessName, validateNumberRange } from '../../lib/validators';
import { usePageMeta } from '../../lib/seo';

const NAV = [
  { id: 'negocios', label: 'Negocios', subtitle: 'Control global de cuentas, planes, soportes y estado', icon: Building2 },
  { id: 'alta', label: 'Alta de negocio', subtitle: 'Creá la cuenta del cliente y enviá su invitación por WhatsApp o Email', icon: PlusCircle },
  { id: 'planes', label: 'Planes y precios', subtitle: 'Editá nombres, soportes y precios visibles en la landing', icon: Tags }
];

function getAppBaseUrl() {
  return (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/+$/, '');
}

function buildReminderText(b) {
  const loginUrl = `${getAppBaseUrl()}/login`;
  const lines = [
    `Hola${b.owner_name ? ` ${b.owner_name.split(/\s+/)[0]}` : ''}, te comparto tus datos de acceso a Latido para ${b.name}:`,
    '',
    `Ingreso al panel: ${loginUrl}`,
    b.owner_email ? `Email: ${b.owner_email}` : null,
    b.primary_token ? `Tu ticket QR/NFC: ${buildFeedbackUrl(b.primary_token)}` : null,
    '',
    'Si necesitás restablecer tu contraseña, podés hacerlo desde "¿Olvidaste tu contraseña?" en la pantalla de ingreso.'
  ].filter(v => v !== null);
  return lines.join('\n');
}

/**
 * Panel Super Admin — 100% pantalla completa, responsive para celular, tablet, notebook y escritorio.
 * Datos vía get_platform_overview(): solo métricas agregadas + datos del dueño (cliente B2B).
 * El Super Admin NO puede leer comentarios ni contactos de clientes finales (bloqueado por RLS).
 */
export default function SuperDashboard() {
  usePageMeta({ title: 'Super Admin · Latido', noindex: true });
  const { profile, signOut } = useAuth();
  const [rows, setRows] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | suspended
  const [view, setView] = useState('negocios');
  const [menuOpen, setMenuOpen] = useState(false);

  // Edición inline del nombre del negocio
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const load = useCallback(async () => {
    setError(null);
    const [ov, pl] = await Promise.all([
      supabase.rpc('get_platform_overview'),
      supabase.from('plans').select('*').order('sort_order', { ascending: true })
    ]);
    const err = ov.error || pl.error;
    if (err) setError(err);
    else {
      setRows(ov.data || []);
      setPlans(pl.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateBusiness(id, patch) {
    setBusyId(id);
    setActionError('');
    try {
      const { error: err } = await supabase.from('businesses').update(patch).eq('id', id);
      if (err) throw err;
      await load();
      return true;
    } catch (err) {
      setActionError(getErrorMessage(err, 'No pudimos actualizar el negocio.'));
      return false;
    } finally {
      setBusyId(null);
    }
  }

  function changePlan(b, planId) {
    const plan = plans.find(p => p.id === planId);
    updateBusiness(b.business_id, {
      plan_id: planId,
      supports_override: plan?.is_custom ? (b.supports_limit || 1) : null
    });
  }

  function changeSupports(b, value) {
    const res = validateNumberRange(value, { min: 1, max: 1000, integer: true, label: 'Los soportes' });
    if (!res.valid) {
      setActionError(res.error);
      return;
    }
    updateBusiness(b.business_id, { supports_override: res.value });
  }

  async function saveBusinessName(b) {
    const res = validateBusinessName(editingName);
    if (!res.valid) {
      setActionError(res.error);
      return;
    }
    if (res.value === b.name) {
      setEditingId(null);
      return;
    }
    const ok = await updateBusiness(b.business_id, { name: res.value });
    if (ok) setEditingId(null);
  }

  const totals = useMemo(() => {
    const priceOf = (planId) => Number(plans.find(p => p.id === planId)?.price_monthly || 0);
    return rows.reduce((acc, b) => ({
      active: acc.active + (b.active ? 1 : 0),
      responses30: acc.responses30 + Number(b.responses_30d || 0),
      rescued: acc.rescued + Number(b.rescued || 0),
      qr: acc.qr + Number(b.qr_active || 0),
      mrr: acc.mrr + (b.active && !b.plan_custom ? priceOf(b.plan_id) : 0)
    }), { active: 0, responses30: 0, rescued: 0, qr: 0, mrr: 0 });
  }, [rows, plans]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(b => {
      if (statusFilter === 'active' && !b.active) return false;
      if (statusFilter === 'suspended' && b.active) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        (b.owner_email || '').toLowerCase().includes(q) ||
        (b.owner_name || '').toLowerCase().includes(q)
      );
    });
  }, [rows, query, statusFilter]);

  const currentNav = NAV.find(n => n.id === view) || NAV[0];

  function selectView(id) {
    setMenuOpen(false);
    setView(id);
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-paper-dim">
      {/* ── Sidebar Escritorio / Notebook (lg+) ────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 shrink-0 bg-ink text-paper sticky top-0 h-screen border-r-2 border-ink">
        <div className="p-5 border-b border-paper/15">
          <LatidoLogo variant="dark" fontSize={20} symWidth={34} />
          <div className="mt-3 flex items-center gap-2">
            <span className="bg-amber text-ink font-mono font-bold text-[10px] px-1.5 py-0.5 uppercase tracking-wider">
              Super Admin
            </span>
            <span className="font-mono text-xs text-paper/75 truncate">{profile.full_name}</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Menú de plataforma">
          {NAV.map(item => {
            const Icon = item.icon;
            const selected = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectView(item.id)}
                aria-current={selected ? 'page' : undefined}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-3 text-left font-mono text-xs uppercase tracking-wider cursor-pointer transition-colors border-l-[3px] ${selected
                  ? 'bg-paper/10 text-paper font-bold border-l-amber'
                  : 'text-paper/70 hover:text-paper hover:bg-paper/5 border-l-transparent'
                  }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon size={16} className={selected ? 'text-amber shrink-0' : 'text-paper/60 shrink-0'} />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === 'negocios' && !loading && (
                  <span className="font-mono text-[10px] px-1.5 py-0.5 bg-paper/15 text-paper shrink-0">
                    {rows.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-paper/15 space-y-3">
          <p className="font-mono text-[10px] text-paper/55 leading-relaxed">
            Ley 25.326: sin acceso a comentarios ni contactos de clientes finales.
          </p>
          <button
            type="button"
            onClick={signOut}
            className="w-full py-2 px-3 border border-paper/25 font-mono text-[11px] uppercase tracking-wider text-paper/80 hover:text-paper hover:bg-paper/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={13} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Header Móvil y Tablet (<lg) ────────────────────────────────────── */}
      <header className="lg:hidden bg-ink text-paper sticky top-0 z-40 border-b border-ink">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <LatidoLogo variant="dark" fontSize={17} symWidth={28} />
            <span className="bg-amber text-ink font-mono font-bold text-[9.5px] px-1.5 py-0.5 uppercase shrink-0">
              Super Admin
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            aria-expanded={menuOpen}
            aria-label="Menú"
            className="p-2 border border-paper/25 text-paper cursor-pointer shrink-0"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {menuOpen && (
          <div className="px-4 pb-4 pt-2 border-t border-paper/15 bg-ink space-y-2.5 animate-fadeIn">
            <div className="font-mono text-xs text-paper/75">Conectado como {profile.full_name}</div>
            <button
              type="button"
              onClick={signOut}
              className="w-full py-2.5 px-3 border border-paper/30 font-mono text-xs uppercase tracking-wider text-paper flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={14} /> Cerrar sesión
            </button>
          </div>
        )}

        <nav className="bg-paper-dim text-ink border-b-[1.5px] border-line-gray px-2 sm:px-4 flex gap-1 overflow-x-auto">
          {NAV.map(item => {
            const Icon = item.icon;
            const selected = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectView(item.id)}
                className={`py-3 px-3 border-b-2 font-mono font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${selected ? 'border-teal text-ink' : 'border-transparent text-muted hover:text-ink'
                  }`}
              >
                <Icon size={14} className={selected ? 'text-teal' : 'text-muted'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* ── Contenido principal (100% del ancho disponible) ────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col bg-paper">
        <div className="hidden lg:flex items-center justify-between gap-4 px-8 py-4 border-b border-line-gray bg-paper-dim/50">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight">{currentNav.label}</h1>
            <p className="font-mono text-xs text-muted mt-0.5">{currentNav.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <HardButton size="sm" variant="secondary" onClick={load} disabled={loading}>
              <RotateCw size={13} /> Actualizar
            </HardButton>
            {view !== 'alta' && (
              <HardButton size="sm" variant="teal" onClick={() => setView('alta')} disabled={loading || plans.length === 0}>
                + Nuevo negocio
              </HardButton>
            )}
          </div>
        </div>

        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 space-y-6">
          {error && <Alert variant="error">{getErrorMessage(error, 'No pudimos cargar la plataforma.')}</Alert>}

          {/* KPIs globales */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            <StatCard label="Negocios activos" value={`${totals.active}/${rows.length}`} loading={loading} />
            <StatCard label="MRR estimado" badge="PLANES" value={formatMoney(totals.mrr)} tone="teal" loading={loading} />
            <StatCard label="Opiniones (30d)" value={totals.responses30.toLocaleString('es-AR')} tone="teal" loading={loading} />
            <StatCard label="Soportes activos" value={totals.qr} loading={loading} />
            <StatCard label="Rescatados" value={totals.rescued} tone="teal" loading={loading} />
          </div>

          {actionError && <Alert variant="error">{actionError}</Alert>}

          {/* Vista: Alta de negocio */}
          {view === 'alta' && (
            <CreateBusinessForm
              plans={plans}
              onCreated={load}
              onClose={() => setView('negocios')}
            />
          )}

          {/* Vista: Planes y precios */}
          {view === 'planes' && <PlansManager plans={plans} onChanged={load} />}

          {/* Vista: Libro mayor de negocios */}
          {view === 'negocios' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'all', label: `Todos (${rows.length})` },
                    { id: 'active', label: `Activos (${totals.active})` },
                    { id: 'suspended', label: `Suspendidos (${rows.length - totals.active})` }
                  ].map(f => (
                    <HardButton
                      key={f.id}
                      size="sm"
                      variant={statusFilter === f.id ? 'primary' : 'secondary'}
                      onClick={() => setStatusFilter(f.id)}
                    >
                      {f.label}
                    </HardButton>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <input
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Buscar negocio, dueño o email..."
                    aria-label="Buscar negocio, dueño o email"
                    className="bg-paper border-[1.5px] border-ink px-3 py-1.5 text-sm rounded-none outline-none focus:border-teal flex-1 sm:w-72"
                  />
                  <HardButton size="sm" variant="teal" className="lg:hidden" onClick={() => setView('alta')} disabled={loading || plans.length === 0}>
                    + Nuevo
                  </HardButton>
                </div>
              </div>

              {loading ? (
                <div className="h-56 bg-paper-dim border border-line-gray animate-pulse" />
              ) : filtered.length === 0 ? (
                <EmptyState title={rows.length ? 'Sin resultados para ese filtro' : 'Todavía no hay negocios dados de alta'}>
                  {!rows.length && (
                    <div className="mt-3">
                      <HardButton size="sm" variant="teal" onClick={() => setView('alta')}>
                        + Crear primer negocio
                      </HardButton>
                    </div>
                  )}
                </EmptyState>
              ) : (
                <>
                  {/* Tarjetas para móvil (<md) */}
                  <div className="grid grid-cols-1 gap-3 md:hidden">
                    {filtered.map(b => {
                      const reminder = buildReminderText(b);
                      const mailHref = b.owner_email
                        ? buildGmailUrl(`Acceso a Latido · ${b.name}`, reminder, b.owner_email)
                        : null;
                      const waHref = `https://wa.me/?text=${encodeURIComponent(reminder)}`;
                      return (
                        <article key={b.business_id} className={`border border-ink p-4 space-y-3 ${b.active ? 'bg-paper' : 'bg-alert-red/5'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <BusinessLogo name={b.name} logoUrl={b.logo_url} size={36} />
                              <div className="min-w-0">
                                <h3 className="font-bold text-base break-words">{b.name}</h3>
                                {(b.owner_name || b.owner_email) && (
                                  <div className="font-mono text-[11px] text-muted break-all">
                                    {b.owner_name}{b.owner_name && b.owner_email ? ' · ' : ''}{b.owner_email}
                                  </div>
                                )}
                                <div className="font-mono text-[10px] text-muted mt-0.5">
                                  alta {formatDateTime(b.created_at)} · {b.branches_count ?? 1} suc.
                                </div>
                              </div>
                            </div>
                            <Stamp variant={b.active ? 'teal' : 'red'}>{b.active ? 'Activo' : 'Suspendido'}</Stamp>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                            <label className="text-muted text-[10px] uppercase">Plan
                              <select value={b.plan_id} disabled={busyId === b.business_id}
                                onChange={e => changePlan(b, e.target.value)}
                                className="mt-1 block w-full bg-paper border border-ink p-1.5 text-xs text-ink rounded-none">
                                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            </label>
                            <div className="text-muted text-[10px] uppercase">Soportes
                              <div className="mt-1.5 text-ink text-xs font-bold">
                                {b.plan_custom ? (
                                  <span className="inline-flex items-center gap-1">
                                    {b.qr_active}/
                                    <input type="number" min="1" max="1000" defaultValue={b.supports_limit}
                                      key={`${b.business_id}-${b.supports_limit}`}
                                      onBlur={e => Number(e.target.value) !== b.supports_limit && changeSupports(b, e.target.value)}
                                      className="w-16 bg-paper border border-ink p-1 rounded-none" />
                                  </span>
                                ) : `${b.qr_active}/${b.supports_limit}`}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-dashed border-line-gray font-mono text-xs text-center">
                            <div><div className="text-[10px] text-muted">Total</div><strong>{b.responses_total}</strong></div>
                            <div><div className="text-[10px] text-muted">30d</div><strong>{b.responses_30d}</strong></div>
                            <div><div className="text-[10px] text-muted">Prom.</div><strong className="text-amber-ink">{b.avg_stars ? `★${b.avg_stars}` : '—'}</strong></div>
                            <div><div className="text-[10px] text-muted">Resc.</div><strong className="text-teal">{b.rescued}</strong></div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-line-gray">
                            <HardButton as="a" size="sm" variant="secondary" href={waHref} target="_blank" rel="noopener noreferrer">
                              <MessageCircle size={13} /> WP
                            </HardButton>
                            {mailHref && (
                              <HardButton as="a" size="sm" variant="secondary" href={mailHref} target="_blank" rel="noopener noreferrer">
                                <Mail size={13} /> Mail
                              </HardButton>
                            )}
                            {b.primary_token && (
                              <HardButton as="a" size="sm" variant="secondary" href={buildFeedbackUrl(b.primary_token)} target="_blank" rel="noopener noreferrer">
                                <ExternalLink size={13} /> Ticket
                              </HardButton>
                            )}
                            <HardButton
                              size="sm"
                              variant={b.active ? 'danger' : 'teal'}
                              disabled={busyId === b.business_id}
                              onClick={() => {
                                if (b.active && !window.confirm(`¿Suspender "${b.name}"? Sus QR dejan de funcionar al instante.`)) return;
                                updateBusiness(b.business_id, { active: !b.active });
                              }}
                            >
                              {b.active ? 'Suspender' : 'Reactivar'}
                            </HardButton>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* Tabla ancho completo para tablet, notebook y escritorio (md+) */}
                  <div className="hidden md:block border border-line-gray bg-paper overflow-x-auto shadow-hard-line">
                    <table className="w-full text-left border-collapse min-w-[980px]">
                      <thead>
                        <tr className="bg-paper-dim border-b border-line-gray font-mono text-[11px] text-muted uppercase">
                          <th className="p-3">Negocio y dueño</th>
                          <th className="p-3">Plan</th>
                          <th className="p-3">Soportes</th>
                          <th className="p-3 text-right">Opiniones</th>
                          <th className="p-3 text-right">30d</th>
                          <th className="p-3">Prom.</th>
                          <th className="p-3 text-right">Rescates</th>
                          <th className="p-3">Estado</th>
                          <th className="p-3 text-right">Gestión</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dashed divide-line-gray text-sm">
                        {filtered.map(b => {
                          const isEditing = editingId === b.business_id;
                          const reminder = buildReminderText(b);
                          const mailHref = b.owner_email
                            ? buildGmailUrl(`Acceso a Latido · ${b.name}`, reminder, b.owner_email)
                            : null;
                          const waHref = `https://wa.me/?text=${encodeURIComponent(reminder)}`;

                          return (
                            <tr key={b.business_id} className={b.active ? 'hover:bg-paper-dim/30' : 'bg-alert-red/5'}>
                              <td className="p-3">
                                <div className="flex items-start gap-2.5">
                                  <BusinessLogo name={b.name} logoUrl={b.logo_url} size={34} className="mt-0.5" />
                                  <div className="min-w-0">
                                    {isEditing ? (
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="text"
                                          value={editingName}
                                          maxLength={80}
                                          onChange={e => setEditingName(e.target.value)}
                                          onKeyDown={e => {
                                            if (e.key === 'Enter') saveBusinessName(b);
                                            if (e.key === 'Escape') setEditingId(null);
                                          }}
                                          autoFocus
                                          className="bg-paper border border-ink px-2 py-1 text-sm rounded-none w-48"
                                        />
                                        <button type="button" onClick={() => saveBusinessName(b)} aria-label="Guardar nombre"
                                          className="p-1 bg-teal text-paper cursor-pointer">
                                          <Check size={14} />
                                        </button>
                                        <button type="button" onClick={() => setEditingId(null)} aria-label="Cancelar edición"
                                          className="p-1 border border-line-gray text-muted cursor-pointer">
                                          <X size={14} />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-semibold">{b.name}</span>
                                        <button
                                          type="button"
                                          title="Editar nombre del negocio"
                                          onClick={() => { setEditingId(b.business_id); setEditingName(b.name); }}
                                          className="text-muted hover:text-ink cursor-pointer p-0.5"
                                        >
                                          <Pencil size={12} />
                                        </button>
                                      </div>
                                    )}
                                    {(b.owner_name || b.owner_email) && (
                                      <div className="font-mono text-[11px] text-muted mt-0.5">
                                        {b.owner_name}{b.owner_name && b.owner_email ? ' · ' : ''}
                                        <span className="select-all">{b.owner_email}</span>
                                      </div>
                                    )}
                                    <div className="font-mono text-[10px] text-muted/80">
                                      alta {formatDateTime(b.created_at)}
                                      {b.branches_count != null && <> · {b.branches_count} {Number(b.branches_count) === 1 ? 'sucursal' : 'sucursales'}</>}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <select value={b.plan_id} disabled={busyId === b.business_id}
                                  onChange={e => changePlan(b, e.target.value)} aria-label={`Plan de ${b.name}`}
                                  className="bg-paper border border-line-gray font-mono text-xs p-1.5 rounded-none max-w-[160px]">
                                  {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                              </td>
                              <td className="p-3 font-mono text-xs">
                                {b.plan_custom ? (
                                  <span className="inline-flex items-center gap-1">
                                    {b.qr_active}/
                                    <input type="number" min="1" max="1000" defaultValue={b.supports_limit}
                                      key={`${b.business_id}-${b.supports_limit}`}
                                      aria-label={`Soportes de ${b.name}`}
                                      onBlur={e => Number(e.target.value) !== b.supports_limit && changeSupports(b, e.target.value)}
                                      className="w-14 bg-paper border border-ink p-1 rounded-none" />
                                  </span>
                                ) : (
                                  <span className={b.qr_active >= b.supports_limit ? 'text-amber-ink font-bold' : ''}>
                                    {b.qr_active}/{b.supports_limit}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-mono text-right">{Number(b.responses_total).toLocaleString('es-AR')}</td>
                              <td className="p-3 font-mono text-right">{Number(b.responses_30d).toLocaleString('es-AR')}</td>
                              <td className="p-3 font-mono text-amber-ink font-bold">{b.avg_stars ? `★ ${b.avg_stars}` : '—'}</td>
                              <td className="p-3 font-mono text-right text-teal font-bold">
                                {b.rescued}
                                {Number(b.open_cases) > 0 && (
                                  <span className="text-alert-red text-[10px] ml-1">({b.open_cases} ab.)</span>
                                )}
                              </td>
                              <td className="p-3"><Stamp variant={b.active ? 'teal' : 'red'}>{b.active ? 'Activo' : 'Suspendido'}</Stamp></td>
                              <td className="p-3">
                                <div className="flex items-center justify-end gap-1.5">
                                  <a href={waHref} target="_blank" rel="noopener noreferrer" title="Enviar acceso por WhatsApp"
                                    className="p-1.5 border border-line-gray hover:border-ink text-muted hover:text-teal transition-colors">
                                    <MessageCircle size={14} />
                                  </a>
                                  {mailHref && (
                                    <a href={mailHref} target="_blank" rel="noopener noreferrer" title="Enviar acceso por Email (nueva pestaña)"
                                      className="p-1.5 border border-line-gray hover:border-ink text-muted hover:text-ink transition-colors">
                                      <Mail size={14} />
                                    </a>
                                  )}
                                  {b.primary_token && (
                                    <a href={buildFeedbackUrl(b.primary_token)} target="_blank" rel="noopener noreferrer" title="Abrir ticket del negocio"
                                      className="p-1.5 border border-line-gray hover:border-ink text-muted hover:text-ink transition-colors">
                                      <ExternalLink size={14} />
                                    </a>
                                  )}
                                  <HardButton
                                    size="sm"
                                    variant={b.active ? 'danger' : 'teal'}
                                    disabled={busyId === b.business_id}
                                    onClick={() => {
                                      if (b.active && !window.confirm(`¿Suspender "${b.name}"? Sus QR dejan de funcionar al instante.`)) return;
                                      updateBusiness(b.business_id, { active: !b.active });
                                    }}
                                  >
                                    {b.active ? 'Suspender' : 'Reactivar'}
                                  </HardButton>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          <p className="font-mono text-xs text-muted p-3 border border-line-gray bg-paper-dim">
            <strong>Aislamiento y Ley 25.326:</strong> el rol Super Admin administra cuentas de negocios y métricas agregadas,
            pero no tiene acceso a comentarios ni datos personales de clientes finales (bloqueado en la base de datos).
          </p>
        </main>
      </div>
    </div>
  );
}
