import React, { useEffect, useState } from 'react';
import Stamp from '../../../../components/ui/Stamp';
import HardButton from '../../../../components/ui/HardButton';
import Alert from '../../../../components/ui/Alert';
import Field from '../../../../components/ui/Field';
import { StarsText } from '../../components/PanelBits';
import { supabase } from '../../../../lib/supabaseClient';
import { getErrorMessage } from '../../../../lib/errors';
import {
  fillTemplate, getContactUrl, openExternalInNewTab, getFirstName, formatMoney, formatRelative, formatDateTime,
  CHANNEL_LABELS
} from '../../../../lib/utils';
import { validateEmail, validatePhone, validateRescueMessage } from '../../../../lib/validators';

export default function ActiveCaseCard({ item, business, getTemplate, now, onChanged }) {
  const contact = item.contact;
  const phoneCheck = validatePhone(contact?.phone || '', { required: false });
  const emailCheck = validateEmail(contact?.email || '', { required: false });
  const hasValidPhone = !!contact?.phone && phoneCheck.valid;
  const hasValidEmail = !!contact?.email && emailCheck.valid;

  const preferredChannel = item.contact_channel || contact?.preferred_channel || 'whatsapp';
  const initialChannel =
    preferredChannel === 'email' && !hasValidEmail && hasValidPhone
      ? 'whatsapp'
      : preferredChannel !== 'email' && !hasValidPhone && hasValidEmail
        ? 'email'
        : preferredChannel;
  const [channel, setChannel] = useState(initialChannel);
  const template = getTemplate(item.stars_snapshot, channel);
  const vars = {
    nombre: getFirstName(contact?.full_name),
    encargado: business.manager_name || '',
    negocio: business.name,
    sucursal: item.response?.branch?.name || '',
    aspectos: item.response?.tags?.join(', ') || '',
    estrellas: String(item.stars_snapshot ?? '')
  };

  const [message, setMessage] = useState(() => item.message_sent || fillTemplate(template?.body, vars));
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [confirmDismiss, setConfirmDismiss] = useState(false);
  const [dismissNote, setDismissNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Si la plantilla llegó después del primer render o cambió el canal sin haber editado, completar el mensaje
  const [touched, setTouched] = useState(false);
  const templateId = template?.id;
  useEffect(() => {
    if (!touched && templateId && !item.message_sent) {
      setMessage(fillTemplate(template.body, vars));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, channel]);

  const dueMs = new Date(item.sla_due_at).getTime() - now;
  const remainingMin = Math.ceil(dueMs / 60000);
  const overdue = dueMs <= 0;
  const contacted = item.status === 'contacted';

  async function update(patch) {
    setBusy(true);
    setError('');
    try {
      const { error: err } = await supabase.from('rescue_cases').update(patch).eq('id', item.id);
      if (err) throw err;
      await onChanged();
    } catch (err) {
      setError(getErrorMessage(err, 'No pudimos actualizar el caso.'));
    } finally {
      setBusy(false);
    }
  }

  function handleOpenChannel(targetChannel = channel) {
    setError('');
    if (targetChannel !== 'call') {
      const msgCheck = validateRescueMessage(message);
      if (!msgCheck.valid) {
        setError(msgCheck.error);
        return;
      }
    }

    if (targetChannel === 'whatsapp' || targetChannel === 'call') {
      if (!hasValidPhone) {
        setError('El número de teléfono del cliente no es válido para abrir WhatsApp o llamada.');
        return;
      }
    } else if (targetChannel === 'email' || targetChannel === 'gmail') {
      if (!hasValidEmail) {
        setError('La dirección de email del cliente no es válida.');
        return;
      }
    }

    const cleanMsg = message.trim();
    const url = getContactUrl(targetChannel, contact || {}, cleanMsg, {
      subject: fillTemplate(template?.subject || 'Sobre tu visita a {negocio}', vars)
    });
    if (!url) {
      setError('El cliente no dejó un dato válido para este canal.');
      return;
    }

    const opened = openExternalInNewTab(url);
    if (!opened) {
      setError('Tu navegador bloqueó la pestaña nueva. Copiá el mensaje y abrilo manualmente.');
      return;
    }
    setAwaitingConfirm(true);
  }

  async function handleCopyMessage() {
    const msgCheck = validateRescueMessage(message);
    if (!msgCheck.valid) {
      setError(msgCheck.error);
      return;
    }
    try {
      await navigator.clipboard.writeText(msgCheck.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('No pudimos copiar al portapapeles. Seleccioná el texto manualmente.');
    }
  }

  function handleManualContacted() {
    setError('');
    if (channel !== 'call') {
      const msgCheck = validateRescueMessage(message);
      if (!msgCheck.valid) {
        setError(msgCheck.error);
        return;
      }
    }
    update({ status: 'contacted', message_sent: message.trim() || null, contact_channel: channel });
  }

  const channelButtonLabel = channel === 'email' ? 'Abrir correo' : channel === 'call' ? 'Llamar' : 'Abrir WhatsApp';

  return (
    <article className={`bg-paper p-4 sm:p-5 min-w-0 animate-fadeIn border-2 ${contacted ? 'border-teal shadow-hard-teal' : 'border-alert-red shadow-hard-red'}`}>
      <div className="flex justify-between items-start flex-wrap gap-2">
        <div>
          <StarsText value={item.stars_snapshot} className="text-lg" />
          <div className="font-mono text-xs text-muted mt-1">
            {item.response?.branch?.name ? `${item.response.branch.name} · ` : ''}
            {formatRelative(item.created_at, now)}
          </div>
        </div>
        {contacted ? (
          <Stamp variant="teal">Contactado</Stamp>
        ) : (
          <Stamp variant="red">{overdue ? 'SLA VENCIDO' : `Rescatar · ${remainingMin} min`}</Stamp>
        )}
      </div>

      <p className="text-base font-medium my-3 break-words">
        {item.response?.comment ? `“${item.response.comment}”` : <span className="text-muted italic">Sin comentario</span>}
      </p>
      {item.response?.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 -mt-1 mb-3">
          {item.response.tags.map(t => <span key={t} className="font-mono text-xs text-muted">#{t}</span>)}
        </div>
      )}

      {contact ? (
        <div className="font-mono text-xs text-muted mb-4 break-words">
          Cliente: <strong className="text-ink">{contact.full_name}</strong> · Prefiere{' '}
          <strong className="text-ink">{CHANNEL_LABELS[channel]}</strong>
          {contact.phone && <> · +{String(contact.phone).replace(/^\+/, '')}</>}
          {contact.email && <> · <span className="break-all">{contact.email}</span></>}
        </div>
      ) : (
        <Alert variant="warning" className="mb-4">
          Los datos de contacto de este cliente fueron eliminados. Solo podés descartar el caso.
        </Alert>
      )}

      {/* Paso 1: mensaje editable + abrir canal (siempre en otra pestaña) */}
      {item.status === 'open' && contact && !awaitingConfirm && (
        <div className="space-y-3">
          {(hasValidPhone && hasValidEmail) && (
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
              <span className="text-muted uppercase mr-1">Canal:</span>
              {['whatsapp', 'email', 'call'].map(ch => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => { setChannel(ch); setError(''); }}
                  className={`px-2 py-0.5 border cursor-pointer ${channel === ch ? 'border-teal bg-teal/10 text-teal font-bold' : 'border-line-gray text-muted hover:border-ink'}`}
                >
                  {CHANNEL_LABELS[ch]}
                </button>
              ))}
            </div>
          )}

          <Field
            as="textarea"
            id={`msg-${item.id}`}
            label={`Mensaje sugerido · plantilla ${Math.min(item.stars_snapshot, 3)}★ (editable)`}
            rows={4}
            value={message}
            onChange={e => { setMessage(e.target.value); setTouched(true); if (error) setError(''); }}
            maxLength={4000}
          />
          <div className="flex flex-wrap gap-2">
            <HardButton size="sm" onClick={() => handleOpenChannel(channel)} disabled={busy}>
              {channelButtonLabel}
            </HardButton>
            {channel === 'email' && hasValidEmail && (
              <HardButton size="sm" variant="teal" onClick={() => handleOpenChannel('gmail')} disabled={busy}>
                Abrir en Gmail
              </HardButton>
            )}
            <HardButton size="sm" variant="secondary" onClick={handleCopyMessage} disabled={busy}>
              {copied ? '✓ Copiado' : 'Copiar mensaje'}
            </HardButton>
            <HardButton size="sm" variant="secondary" disabled={busy} onClick={handleManualContacted}>
              Ya lo contacté por otro medio
            </HardButton>
          </div>
          <p className="font-mono text-[10px] text-muted">
            Se abre siempre en una pestaña nueva para que no pierdas tu panel de Latido.
          </p>
        </div>
      )}

      {/* Paso 2: confirmar envío */}
      {awaitingConfirm && item.status === 'open' && (
        <div className="p-3 border border-dashed border-amber bg-amber/10">
          <p className="font-bold text-sm mb-2">¿Enviaste el mensaje?</p>
          <div className="flex flex-wrap gap-2">
            <HardButton
              size="sm"
              variant="teal"
              disabled={busy}
              onClick={async () => {
                await update({ status: 'contacted', message_sent: message.trim() || null, contact_channel: channel });
                setAwaitingConfirm(false);
              }}
            >
              Sí, enviado
            </HardButton>
            <HardButton size="sm" variant="secondary" disabled={busy} onClick={() => setAwaitingConfirm(false)}>
              Todavía no
            </HardButton>
          </div>
        </div>
      )}

      {/* Paso 3: resultado */}
      {contacted && (
        <div className="p-3.5 border border-line-gray bg-paper-dim/50 space-y-3">
          {item.first_contacted_at && (
            <div className="font-mono text-[11px] text-teal flex flex-wrap items-center gap-x-2 gap-y-1 pb-2 border-b border-dashed border-line-gray">
              <span className="font-bold">
                ✓ Contactado{item.contact_channel ? ` por ${CHANNEL_LABELS[item.contact_channel]}` : ''}
              </span>
              <span className="text-muted">· {formatDateTime(item.first_contacted_at)}</span>
            </div>
          )}
          <div>
            <p className="font-bold text-sm mb-2">¿Cómo resultó el rescate?</p>
            <Field
              as="textarea"
              id={`note-${item.id}`}
              label="¿Cómo se solucionó? (opcional · queda en el historial)"
              rows={2}
              maxLength={1000}
              placeholder="Ej: Le invitamos un café en su próxima visita, se reintegró el pedido, se habló con el encargado..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <HardButton
              size="sm"
              variant="teal"
              disabled={busy}
              onClick={() => update({ status: 'resolved', outcome: 'recovered', resolution_note: note.trim() || null })}
            >
              Rescatado (+{formatMoney(item.avg_ticket_snapshot, business.currency)})
            </HardButton>
            <HardButton
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => update({ status: 'resolved', outcome: 'no_response', resolution_note: note.trim() || null })}
            >
              Sin respuesta
            </HardButton>
            <HardButton
              size="sm"
              variant="danger"
              disabled={busy}
              onClick={() => update({ status: 'resolved', outcome: 'declined', resolution_note: note.trim() || null })}
            >
              No quiso compensación
            </HardButton>
          </div>
        </div>
      )}

      {/* Descartar (spam, error, cliente conocido...) */}
      {item.status === 'open' && (
        <div className="mt-3">
          {confirmDismiss ? (
            <div className="p-3 border border-dashed border-alert-red/60 bg-alert-red/5 space-y-2.5 text-left">
              <p className="font-mono text-xs text-ink font-bold">
                ¿Descartar este caso? No cuenta en las métricas.
              </p>
              <Field
                id={`dismiss-note-${item.id}`}
                label="Motivo del descarte (opcional)"
                maxLength={300}
                placeholder="Ej: Prueba interna, spam, reclamo duplicado..."
                value={dismissNote}
                onChange={e => setDismissNote(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <HardButton
                  size="sm"
                  variant="danger"
                  disabled={busy}
                  onClick={() => update({ status: 'dismissed', resolution_note: dismissNote.trim() || null })}
                >
                  Sí, descartar
                </HardButton>
                <HardButton
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => { setConfirmDismiss(false); setDismissNote(''); }}
                >
                  Cancelar
                </HardButton>
              </div>
            </div>
          ) : (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setConfirmDismiss(true)}
                className="font-mono text-xs text-muted underline hover:text-alert-red cursor-pointer"
              >
                Descartar caso
              </button>
            </div>
          )}
        </div>
      )}

      {error && <Alert variant="error" className="mt-3">{error}</Alert>}
    </article>
  );
}
