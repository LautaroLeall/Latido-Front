import React, { useState } from 'react';
import { Check, ExternalLink, Eye, Mail, MessageCircle, Nfc, Pencil, X } from 'lucide-react';
import BusinessLogo from '../../../components/branding/BusinessLogo';
import Stamp from '../../../components/ui/Stamp';
import HardButton from '../../../components/ui/HardButton';
import { buildFeedbackUrl, formatDateTime } from '../../../lib/utils';
import { buildGmailUrl } from '../../../lib/contact';
import { buildReminderText } from './useSuperData';

export default function BusinessCardList({
  businesses,
  plans,
  busyId,
  kitsByBiz,
  onChangePlan,
  onChangeSupports,
  onRenameBusiness,
  onToggleActive,
  onOpenDetail,
  onOpenKits
}) {
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  async function saveName(b) {
    const ok = await onRenameBusiness(b, editingName);
    if (ok) setEditingId(null);
  }

  return (
    <div className="space-y-4">
      {businesses.map(b => {
        const isEditing = editingId === b.business_id;
        const reminder = buildReminderText(b);
        const mailHref = b.owner_email ? buildGmailUrl(`Acceso a Latido · ${b.name}`, reminder, b.owner_email) : null;
        const waHref = `https://wa.me/?text=${encodeURIComponent(reminder)}`;
        const pendingCount = kitsByBiz.get(b.business_id) || 0;
        const branchCount = Number(b.branches_count ?? 1);
        const atLimit = !b.plan_custom && Number(b.qr_active) >= Number(b.supports_limit);

        return (
          <article
            key={b.business_id}
            className={`border border-line-gray border-l-4 shadow-hard-line p-4 sm:p-5 space-y-4 animate-fadeIn ${b.active ? 'bg-paper border-l-teal' : 'bg-alert-red/5 border-l-alert-red'
              }`}
          >
            {/* Cabecera: identidad del negocio, dueño y estado */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <BusinessLogo name={b.name} logoUrl={b.logo_url} size={44} className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <input
                        type="text"
                        value={editingName}
                        maxLength={80}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveName(b);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        aria-label="Nuevo nombre del negocio"
                        className="bg-paper border-[1.5px] border-ink px-2.5 py-1.5 text-base sm:text-sm rounded-none w-full sm:w-64"
                      />
                      <button
                        type="button"
                        onClick={() => saveName(b)}
                        aria-label="Guardar nombre"
                        className="p-2 bg-teal text-paper cursor-pointer"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        aria-label="Cancelar edición"
                        className="p-2 border border-line-gray bg-paper text-muted hover:text-ink cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(b.business_id)}
                        className="font-bold text-base sm:text-lg leading-tight text-left hover:text-teal hover:underline cursor-pointer break-words"
                        title="Ver diagnóstico y detalles del negocio"
                      >
                        {b.name}
                      </button>
                      <button
                        type="button"
                        title="Editar nombre del negocio"
                        aria-label={`Editar nombre de ${b.name}`}
                        onClick={() => { setEditingId(b.business_id); setEditingName(b.name); }}
                        className="text-muted hover:text-ink cursor-pointer p-1"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  )}

                  {(b.owner_name || b.owner_email) && (
                    <div className="font-mono text-xs text-muted mt-1 break-all">
                      {b.owner_name}
                      {b.owner_name && b.owner_email ? ' · ' : ''}
                      {b.owner_email && <span className="select-all text-ink/80">{b.owner_email}</span>}
                    </div>
                  )}

                  <div className="font-mono text-[11px] text-muted mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                    <span>Alta {formatDateTime(b.created_at)}</span>
                    <span>· {branchCount} {branchCount === 1 ? 'sucursal' : 'sucursales'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {pendingCount > 0 && (
                  <button
                    type="button"
                    onClick={onOpenKits}
                    className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 border border-amber bg-amber/15 text-amber-ink hover:bg-amber/25 cursor-pointer transition-colors"
                    title="Ir a Kits y NFC"
                  >
                    <Nfc size={12} /> {pendingCount} {pendingCount === 1 ? 'kit pend.' : 'kits pend.'}
                  </button>
                )}
                <Stamp variant={b.active ? 'teal' : 'red'}>{b.active ? 'Activo' : 'Suspendido'}</Stamp>
              </div>
            </div>

            {/* Franja de datos: Plan/Soportes + Métricas limpias sin colisiones */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-3 items-stretch">
              <div className="bg-paper-dim/70 border border-line-gray p-3 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted block min-w-0">
                  Plan contratado
                  <select
                    value={b.plan_id}
                    disabled={busyId === b.business_id}
                    onChange={e => onChangePlan(b, e.target.value)}
                    aria-label={`Plan de ${b.name}`}
                    className="mt-1.5 block w-full min-h-[40px] bg-paper border-[1.5px] border-ink px-2.5 py-1.5 text-sm font-mono text-ink rounded-none cursor-pointer focus:border-teal outline-none"
                  >
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>

                <div className="font-mono min-w-[104px]">
                  <div className="text-[10px] uppercase tracking-wider text-muted">Soportes</div>
                  <div className="mt-1.5 min-h-[40px] flex items-center">
                    {b.plan_custom ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-ink">
                        <span>{b.qr_active}/</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="1"
                          max="1000"
                          defaultValue={b.supports_limit}
                          key={`${b.business_id}-${b.supports_limit}`}
                          aria-label={`Soportes de ${b.name}`}
                          onBlur={e => Number(e.target.value) !== b.supports_limit && onChangeSupports(b, e.target.value)}
                          className="w-16 min-h-[38px] bg-paper border-[1.5px] border-ink px-2 py-1 text-sm rounded-none"
                        />
                      </span>
                    ) : (
                      <span className={`text-base font-bold tabular-nums whitespace-nowrap ${atLimit ? 'text-amber-ink' : 'text-ink'}`}>
                        {b.qr_active} / {b.supports_limit}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                <div className="bg-paper-dim/70 border border-line-gray px-3 py-2.5 flex flex-col justify-center">
                  <div className="text-[10px] uppercase tracking-wider text-muted">Total</div>
                  <div className="text-lg font-bold text-ink tabular-nums mt-0.5">
                    {Number(b.responses_total || 0).toLocaleString('es-AR')}
                  </div>
                </div>
                <div className="bg-paper-dim/70 border border-line-gray px-3 py-2.5 flex flex-col justify-center">
                  <div className="text-[10px] uppercase tracking-wider text-muted">Últ. 30d</div>
                  <div className="text-lg font-bold text-ink tabular-nums mt-0.5">
                    {Number(b.responses_30d || 0).toLocaleString('es-AR')}
                  </div>
                </div>
                <div className="bg-paper-dim/70 border border-line-gray px-3 py-2.5 flex flex-col justify-center">
                  <div className="text-[10px] uppercase tracking-wider text-muted">Promedio</div>
                  <div className="text-lg font-bold text-amber-ink tabular-nums whitespace-nowrap mt-0.5">
                    {b.avg_stars ? `★ ${b.avg_stars}` : '—'}
                  </div>
                </div>
                <div className="bg-paper-dim/70 border border-line-gray px-3 py-2.5 flex flex-col justify-center">
                  <div className="text-[10px] uppercase tracking-wider text-muted">Rescates</div>
                  <div className="text-lg font-bold text-teal tabular-nums whitespace-nowrap mt-0.5">
                    {b.rescued}
                    {Number(b.open_cases) > 0 && (
                      <span className="text-alert-red text-[11px] font-bold ml-1.5">({b.open_cases} ab.)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Barra de acciones clara y sin amontonamiento */}
            <div className="pt-3 border-t border-dashed border-line-gray flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <HardButton size="sm" variant="primary" onClick={() => onOpenDetail(b.business_id)}>
                  <Eye size={13} /> Ver detalle
                </HardButton>
                <HardButton as="a" size="sm" variant="secondary" href={waHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={13} /> WhatsApp
                </HardButton>
                {mailHref && (
                  <HardButton as="a" size="sm" variant="secondary" href={mailHref} target="_blank" rel="noopener noreferrer">
                    <Mail size={13} /> Email
                  </HardButton>
                )}
                {b.primary_token && (
                  <HardButton as="a" size="sm" variant="secondary" href={buildFeedbackUrl(b.primary_token)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={13} /> Ticket
                  </HardButton>
                )}
              </div>

              <HardButton
                size="sm"
                variant={b.active ? 'danger' : 'teal'}
                disabled={busyId === b.business_id}
                onClick={() => onToggleActive(b)}
              >
                {b.active ? 'Suspender' : 'Reactivar'}
              </HardButton>
            </div>
          </article>
        );
      })}
    </div>
  );
}
