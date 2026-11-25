import React, { useEffect, useState } from 'react';
import {
  AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Clock, MapPin, MessageSquareText, Pencil, Send, User
} from 'lucide-react';
import Stamp from '../../../../components/ui/Stamp';
import HardButton from '../../../../components/ui/HardButton';
import Alert from '../../../../components/ui/Alert';
import Field from '../../../../components/ui/Field';
import { StarsText } from '../../components/PanelBits';
import { supabase } from '../../../../lib/supabaseClient';
import { getErrorMessage } from '../../../../lib/errors';
import { formatMoney, formatDateTime, CHANNEL_LABELS, OUTCOME_LABELS } from '../../../../lib/utils';
import { formatDurationBetween, getDefaultResolutionSummary } from './rescueHelpers';

export default function HistoryCaseCard({ item, business, onChanged }) {
  const [messageExpanded, setMessageExpanded] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(item.resolution_note || '');
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState('');

  useEffect(() => {
    setNoteDraft(item.resolution_note || '');
  }, [item.resolution_note]);

  async function saveResolutionNote(e) {
    e.preventDefault();
    if (savingNote) return;
    setSavingNote(true);
    setNoteError('');
    try {
      const { error: err } = await supabase
        .from('rescue_cases')
        .update({ resolution_note: noteDraft.trim() || null })
        .eq('id', item.id);
      if (err) throw err;
      setEditingNote(false);
      await onChanged?.();
    } catch (err) {
      setNoteError(getErrorMessage(err, 'No pudimos guardar la nota del caso.'));
    } finally {
      setSavingNote(false);
    }
  }

  const isDismissed = item.status === 'dismissed';
  const isRecovered = !isDismissed && item.outcome === 'recovered';
  const isDeclined = !isDismissed && item.outcome === 'declined';

  const stampVariant = isRecovered ? 'teal' : isDismissed ? 'ink' : isDeclined ? 'red' : 'amber';
  const stampLabel = isDismissed ? 'Descartado' : OUTCOME_LABELS[item.outcome] || 'Cerrado';
  const leftAccent = isRecovered
    ? 'border-l-teal'
    : isDismissed
      ? 'border-l-ink'
      : isDeclined
        ? 'border-l-alert-red'
        : 'border-l-amber';

  const hasContactTime = !!item.first_contacted_at;
  const withinSla = hasContactTime && item.sla_due_at
    ? new Date(item.first_contacted_at).getTime() <= new Date(item.sla_due_at).getTime()
    : null;
  const firstResponseDelay = formatDurationBetween(item.created_at, item.first_contacted_at);
  const totalResolutionDelay = formatDurationBetween(item.created_at, item.resolved_at);

  const branchName = item.response?.branch?.name;
  const tags = Array.isArray(item.response?.tags) ? item.response.tags : [];
  const comment = item.response?.comment?.trim();
  const contact = item.contact;
  const usedChannel = item.contact_channel || contact?.preferred_channel;
  const sentMessage = item.message_sent?.trim();
  const isLongMessage = !!sentMessage && (sentMessage.length > 210 || sentMessage.split('\n').length > 3);
  const recoveredAmount = Number(item.recovered_value) || 0;

  return (
    <article className={`bg-paper border border-line-gray border-l-4 ${leftAccent} shadow-hard-line p-4 sm:p-5 space-y-4 min-w-0 animate-fadeIn`}>
      {/* Cabecera: estado, estrellas, SLA, sucursal y monto recuperado */}
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Stamp variant={stampVariant}>{stampLabel}</Stamp>
            <StarsText value={item.stars_snapshot} className="text-base" />
            {withinSla !== null && (
              <span
                className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${withinSla
                  ? 'border-teal/40 bg-teal/10 text-teal'
                  : 'border-alert-red/40 bg-alert-red/10 text-alert-red'
                  }`}
              >
                <Clock size={11} className="shrink-0" />
                {withinSla ? 'En SLA' : 'Fuera de SLA'}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] text-muted">
            {branchName && (
              <span className="inline-flex items-center gap-1 text-ink font-medium">
                <MapPin size={12} className="text-teal shrink-0" />
                {branchName}
              </span>
            )}
            <span>Ingresó: {formatDateTime(item.created_at)}</span>
          </div>
        </div>

        <div className="text-left sm:text-right shrink-0">
          {recoveredAmount > 0 ? (
            <div>
              <div className="font-mono font-bold text-base text-teal leading-tight">
                +{formatMoney(recoveredAmount, business.currency)}
              </div>
              <div className="font-mono text-[9.5px] uppercase tracking-wider text-muted">
                Recuperado est.
              </div>
            </div>
          ) : isDismissed ? (
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
              No impacta métricas
            </span>
          ) : null}
        </div>
      </div>

      {/* Qué ocurrió: comentario, etiquetas y datos del cliente */}
      <div className="space-y-2.5 pt-3 border-t border-dashed border-line-gray">
        <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
          <MessageSquareText size={12} className="shrink-0" />
          De qué se trató el caso
        </div>

        <p className="text-sm sm:text-[15px] font-medium text-ink leading-relaxed break-words">
          {comment ? `“${comment}”` : <span className="text-muted italic font-normal">El cliente no dejó comentario escrito.</span>}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <span key={tag} className="font-mono text-[11px] text-ink/80 bg-paper-dim border border-line-gray px-2 py-0.5">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted pt-0.5 break-words">
          <User size={12} className="shrink-0 text-ink/70" />
          {contact ? (
            <>
              <strong className="text-ink">{contact.full_name}</strong>
              {contact.preferred_channel && (
                <span>· Prefería {CHANNEL_LABELS[contact.preferred_channel] || contact.preferred_channel}</span>
              )}
              {contact.phone && <span>· +{String(contact.phone).replace(/^\+/, '')}</span>}
              {contact.email && <span className="break-all">· {contact.email}</span>}
            </>
          ) : (
            <span className="italic">Datos de contacto no disponibles</span>
          )}
        </div>
      </div>

      {/* Cómo se solucionó + trazabilidad + mensaje enviado */}
      <div className="bg-paper-dim/70 border border-line-gray p-3.5 space-y-3.5 min-w-0">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
              {isRecovered ? (
                <CheckCircle2 size={13} className="text-teal shrink-0" />
              ) : (
                <AlertCircle size={13} className={isDeclined ? 'text-alert-red shrink-0' : 'text-amber-ink shrink-0'} />
              )}
              {isDismissed ? 'Motivo / cierre' : 'Cómo se solucionó'}
            </div>
            {!editingNote && (
              <button
                type="button"
                onClick={() => { setNoteDraft(item.resolution_note || ''); setNoteError(''); setEditingNote(true); }}
                className="inline-flex items-center gap-1 font-mono text-[10.5px] font-bold text-teal hover:underline cursor-pointer"
              >
                <Pencil size={11} className="shrink-0" />
                {item.resolution_note ? 'Editar nota' : 'Agregar detalle'}
              </button>
            )}
          </div>

          {editingNote ? (
            <form onSubmit={saveResolutionNote} className="space-y-2.5 pt-1">
              <Field
                as="textarea"
                id={`history-note-${item.id}`}
                rows={2}
                maxLength={1000}
                placeholder="Contá brevemente cómo se resolvió (ej: le invitamos un café, se reintegró el pedido, se corrigió el error...)"
                value={noteDraft}
                onChange={e => setNoteDraft(e.target.value)}
              />
              {noteError && <Alert variant="error">{noteError}</Alert>}
              <div className="flex flex-wrap gap-2">
                <HardButton type="submit" size="sm" variant="teal" disabled={savingNote}>
                  {savingNote ? 'GUARDANDO...' : 'GUARDAR DETALLE'}
                </HardButton>
                <HardButton
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={savingNote}
                  onClick={() => { setEditingNote(false); setNoteDraft(item.resolution_note || ''); setNoteError(''); }}
                >
                  Cancelar
                </HardButton>
              </div>
            </form>
          ) : item.resolution_note ? (
            <p className={`text-sm text-ink leading-relaxed whitespace-pre-wrap break-words bg-paper border border-line-gray border-l-[3px] ${leftAccent} px-3 py-2`}>
              {item.resolution_note}
            </p>
          ) : (
            <p className="text-xs text-muted leading-relaxed">
              {getDefaultResolutionSummary(item)}
            </p>
          )}
        </div>

        {/* Línea de tiempo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2.5 border-t border-dashed border-line-gray">
          <div className="bg-paper border border-line-gray px-3 py-2 min-w-0">
            <div className="font-mono text-[9.5px] uppercase tracking-wider text-muted">1. Ingresó</div>
            <div className="font-mono text-xs font-bold text-ink mt-0.5">{formatDateTime(item.created_at)}</div>
            <div className="font-mono text-[10.5px] text-muted mt-0.5">
              Calificación: {item.stars_snapshot}★
            </div>
          </div>

          <div className="bg-paper border border-line-gray px-3 py-2 min-w-0">
            <div className="font-mono text-[9.5px] uppercase tracking-wider text-muted">2. Primer contacto</div>
            {hasContactTime ? (
              <>
                <div className="font-mono text-xs font-bold text-ink mt-0.5">
                  {formatDateTime(item.first_contacted_at)}
                </div>
                <div className="font-mono text-[10.5px] text-muted mt-0.5 break-words">
                  {usedChannel ? `Por ${CHANNEL_LABELS[usedChannel] || usedChannel}` : 'Contactado'}
                  {firstResponseDelay ? ` · en ${firstResponseDelay}` : ''}
                </div>
              </>
            ) : (
              <div className="font-mono text-xs text-muted mt-0.5">Sin contacto registrado</div>
            )}
          </div>

          <div className="bg-paper border border-line-gray px-3 py-2 min-w-0">
            <div className="font-mono text-[9.5px] uppercase tracking-wider text-muted">3. Cierre</div>
            <div className="font-mono text-xs font-bold text-ink mt-0.5">
              {item.resolved_at ? formatDateTime(item.resolved_at) : isDismissed ? 'Descartado' : '—'}
            </div>
            <div className="font-mono text-[10.5px] text-muted mt-0.5 break-words">
              {item.resolver?.full_name ? `Por ${item.resolver.full_name}` : stampLabel}
              {totalResolutionDelay ? ` · total ${totalResolutionDelay}` : ''}
            </div>
          </div>
        </div>

        {/* Mensaje enviado */}
        {sentMessage && (
          <div className="pt-2.5 border-t border-dashed border-line-gray space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted inline-flex items-center gap-1.5">
                <Send size={11} className="shrink-0 text-teal" />
                Mensaje enviado{usedChannel ? ` por ${CHANNEL_LABELS[usedChannel] || usedChannel}` : ''}
              </span>
              {isLongMessage && (
                <button
                  type="button"
                  onClick={() => setMessageExpanded(v => !v)}
                  className="inline-flex items-center gap-1 font-mono text-[10.5px] text-teal font-bold hover:underline cursor-pointer"
                >
                  {messageExpanded ? (
                    <>Ocultar <ChevronUp size={12} /></>
                  ) : (
                    <>Ver completo <ChevronDown size={12} /></>
                  )}
                </button>
              )}
            </div>
            <p
              className={`text-xs text-ink/90 leading-relaxed whitespace-pre-wrap break-words bg-paper border border-line-gray px-3 py-2 ${isLongMessage && !messageExpanded ? 'line-clamp-3' : ''}`}
            >
              {sentMessage}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
