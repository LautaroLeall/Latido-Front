import React, { useEffect, useState } from 'react';
import Stamp from '../../../components/ui/Stamp';
import HardButton from '../../../components/ui/HardButton';
import Alert from '../../../components/ui/Alert';
import Field from '../../../components/ui/Field';
import { StatCard, StarsText, EmptyState, SectionLabel } from '../components/PanelBits';
import { supabase } from '../../../lib/supabaseClient';
import { getErrorMessage } from '../../../lib/errors';
import {
  fillTemplate, getContactUrl, openExternalInNewTab, getFirstName, formatMoney, formatRelative, formatDateTime,
  CHANNEL_LABELS, OUTCOME_LABELS
} from '../../../lib/utils';
import {
  validateEmail, validateNumberRange, validatePersonName, validatePhone, validateRescueMessage
} from '../../../lib/validators';

/* ────────────────────────────────────────────────────────────────────────────
 * Tarjeta de un caso activo
 * ──────────────────────────────────────────────────────────────────────────── */
function ActiveCaseCard({ item, business, getTemplate, now, onChanged }) {
  const contact = item.contact;
  const initialChannel = item.contact_channel || contact?.preferred_channel || 'whatsapp';
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

  const phoneCheck = validatePhone(contact?.phone || '', { required: false });
  const emailCheck = validateEmail(contact?.email || '', { required: false });
  const hasValidPhone = !!contact?.phone && phoneCheck.valid;
  const hasValidEmail = !!contact?.email && emailCheck.valid;

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
    <article className={`bg-paper p-5 animate-fadeIn border-2 ${contacted ? 'border-teal shadow-hard-teal' : 'border-alert-red shadow-hard-red'}`}>
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
          {contact.phone && <> · +{contact.phone}</>}
          {contact.email && <> · {contact.email}</>}
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
            <HardButton size="sm" variant="teal" disabled={busy}
              onClick={() => update({ status: 'contacted', message_sent: message, contact_channel: channel })}>
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
        <div className="p-3 border border-line-gray">
          <p className="font-bold text-sm mb-2">¿Cómo resultó el rescate?</p>
          <Field as="textarea" id={`note-${item.id}`} rows={2} maxLength={1000}
            placeholder="Nota interna opcional (ej: le invitamos un café)"
            value={note} onChange={e => setNote(e.target.value)} className="mb-3" />
          <div className="flex flex-wrap gap-2">
            <HardButton size="sm" variant="teal" disabled={busy}
              onClick={() => update({ status: 'resolved', outcome: 'recovered', resolution_note: note || null })}>
              Rescatado (+{formatMoney(item.avg_ticket_snapshot, business.currency)})
            </HardButton>
            <HardButton size="sm" variant="secondary" disabled={busy}
              onClick={() => update({ status: 'resolved', outcome: 'no_response', resolution_note: note || null })}>
              Sin respuesta
            </HardButton>
            <HardButton size="sm" variant="danger" disabled={busy}
              onClick={() => update({ status: 'resolved', outcome: 'declined', resolution_note: note || null })}>
              No quiso compensación
            </HardButton>
          </div>
        </div>
      )}

      {/* Descartar (spam, error, cliente conocido...) */}
      {item.status === 'open' && (
        <div className="mt-3 text-right">
          {confirmDismiss ? (
            <span className="inline-flex flex-wrap items-center gap-2 font-mono text-xs">
              ¿Descartar este caso? No cuenta en las métricas.
              <HardButton size="sm" variant="danger" disabled={busy} onClick={() => update({ status: 'dismissed' })}>Sí, descartar</HardButton>
              <HardButton size="sm" variant="secondary" disabled={busy} onClick={() => setConfirmDismiss(false)}>Cancelar</HardButton>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmDismiss(true)}
              className="font-mono text-xs text-muted underline hover:text-alert-red cursor-pointer">
              Descartar caso
            </button>
          )}
        </div>
      )}

      {error && <Alert variant="error" className="mt-3">{error}</Alert>}
    </article>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Historial
 * ──────────────────────────────────────────────────────────────────────────── */
function HistoryList({ items, business, isAdmin, onChanged }) {
  const [erasing, setErasing] = useState(null);
  const [error, setError] = useState('');

  async function eraseContact(contactId) {
    setError('');
    try {
      const { error: err } = await supabase.from('response_contacts').delete().eq('id', contactId);
      if (err) throw err;
      setErasing(null);
      await onChanged();
    } catch (err) {
      setError(getErrorMessage(err, 'No pudimos eliminar los datos.'));
    }
  }

  if (items.length === 0) return <EmptyState title="Todavía no hay casos cerrados" />;

  return (
    <div className="bg-paper border border-line-gray divide-y divide-dashed divide-line-gray">
      {error && <Alert variant="error" className="m-3">{error}</Alert>}
      {items.map(item => (
        <div key={item.id} className="p-4 flex flex-wrap justify-between items-start gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Stamp variant={item.outcome === 'recovered' ? 'teal' : item.status === 'dismissed' ? 'ink' : 'amber'}>
                {item.status === 'dismissed' ? 'Descartado' : OUTCOME_LABELS[item.outcome] || item.outcome}
              </Stamp>
              <StarsText value={item.stars_snapshot} className="text-sm" />
              <span className="font-mono text-xs text-muted">{formatDateTime(item.created_at)}</span>
            </div>
            <div className="font-mono text-xs text-muted mt-1.5">
              {item.contact ? item.contact.full_name : <em>Datos personales eliminados</em>}
              {item.resolution_note && <> · “{item.resolution_note}”</>}
            </div>
            {isAdmin && item.contact && (
              erasing === item.id ? (
                <span className="inline-flex flex-wrap items-center gap-2 mt-2 font-mono text-xs">
                  ¿Eliminar nombre, email y teléfono? La opinión anónima se conserva.
                  <HardButton size="sm" variant="danger" onClick={() => eraseContact(item.contact.id)}>Eliminar</HardButton>
                  <HardButton size="sm" variant="secondary" onClick={() => setErasing(null)}>Cancelar</HardButton>
                </span>
              ) : (
                <button type="button" onClick={() => setErasing(item.id)}
                  className="block mt-1 font-mono text-[11px] text-muted underline hover:text-alert-red cursor-pointer">
                  Eliminar datos personales (Ley 25.326)
                </button>
              )
            )}
          </div>
          <span className="font-mono font-bold text-sm text-teal">
            {Number(item.recovered_value) > 0 ? formatMoney(item.recovered_value, business.currency) : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Ajustes del Modo Rescate
 * ──────────────────────────────────────────────────────────────────────────── */
function RescueSettings({ business, isAdmin, onSaved }) {
  const [form, setForm] = useState({
    rescue_enabled: business.rescue_enabled,
    avg_ticket_value: String(business.avg_ticket_value ?? 0),
    rescue_sla_minutes: String(business.rescue_sla_minutes ?? 60),
    rescue_threshold: String(business.rescue_threshold ?? 2),
    manager_name: business.manager_name || ''
  });
  const [status, setStatus] = useState({ saving: false, error: '', ok: false });

  const update = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [key]: value }));
    setStatus(s => ({ ...s, ok: false }));
  };

  async function handleSave(e) {
    e.preventDefault();
    const ticketRes = validateNumberRange(form.avg_ticket_value, {
      min: 0,
      max: 100000000,
      label: 'El ticket promedio'
    });
    if (!ticketRes.valid) {
      return setStatus({ saving: false, ok: false, error: ticketRes.error });
    }
    const slaRes = validateNumberRange(form.rescue_sla_minutes, {
      min: 5,
      max: 1440,
      integer: true,
      label: 'El tiempo límite (SLA)'
    });
    if (!slaRes.valid) {
      return setStatus({ saving: false, ok: false, error: slaRes.error });
    }
    const mgrRes = validatePersonName(form.manager_name, {
      required: false,
      min: 2,
      max: 60,
      label: 'La firma de los mensajes'
    });
    if (!mgrRes.valid) {
      return setStatus({ saving: false, ok: false, error: mgrRes.error });
    }

    setStatus({ saving: true, error: '', ok: false });
    try {
      const { error } = await supabase.from('businesses').update({
        rescue_enabled: form.rescue_enabled,
        avg_ticket_value: Math.round(ticketRes.value),
        rescue_sla_minutes: slaRes.value,
        rescue_threshold: Number(form.rescue_threshold),
        manager_name: mgrRes.value || null
      }).eq('id', business.id);
      if (error) throw error;
      await onSaved();
      setStatus({ saving: false, error: '', ok: true });
    } catch (err) {
      setStatus({ saving: false, ok: false, error: getErrorMessage(err, 'No pudimos guardar los ajustes.') });
    }
  }

  const disabled = !isAdmin || status.saving;

  return (
    <form onSubmit={handleSave} className="max-w-[520px] bg-paper border border-line-gray p-5 space-y-4">
      {!isAdmin && <Alert variant="info">Solo el administrador puede modificar estos ajustes.</Alert>}

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={form.rescue_enabled} onChange={update('rescue_enabled')} disabled={disabled} className="mt-1 w-4 h-4" />
        <span>
          <strong className="block text-sm">Modo Rescate activado</strong>
          <span className="text-xs text-muted">Abre un caso con reloj cuando un cliente insatisfecho deja su contacto.</span>
        </span>
      </label>

      <Field id="threshold" as="select" label="Activar con calificaciones de" value={form.rescue_threshold} onChange={update('rescue_threshold')} disabled={disabled}>
        <option value="1">1 estrella</option>
        <option value="2">2 estrellas o menos (recomendado)</option>
        <option value="3">3 estrellas o menos</option>
      </Field>

      <Field id="sla" as="select" label="Tiempo para el primer contacto (SLA)" value={form.rescue_sla_minutes} onChange={update('rescue_sla_minutes')} disabled={disabled}>
        <option value="15">15 minutos</option>
        <option value="30">30 minutos</option>
        <option value="60">60 minutos (recomendado)</option>
        <option value="120">2 horas</option>
        <option value="240">4 horas</option>
        <option value="1440">24 horas</option>
        {![15, 30, 60, 120, 240, 1440].includes(Number(form.rescue_sla_minutes)) && (
          <option value={form.rescue_sla_minutes}>{form.rescue_sla_minutes} minutos</option>
        )}
      </Field>

      <Field id="ticket" type="number" min="0" step="100" inputMode="numeric"
        label={`Ticket promedio estimado (${business.currency || 'ARS'})`}
        hint="Se usa para estimar las ventas recuperadas. Los casos ya abiertos conservan el valor anterior."
        value={form.avg_ticket_value} onChange={update('avg_ticket_value')} disabled={disabled} />

      <Field id="manager" label="Firma de los mensajes" maxLength={60}
        hint="Reemplaza {encargado} en las plantillas (ej: Sofía)."
        value={form.manager_name} onChange={update('manager_name')} disabled={disabled} />

      {status.error && <Alert variant="error">{status.error}</Alert>}
      {status.ok && <Alert variant="success">Ajustes guardados.</Alert>}

      {isAdmin && (
        <HardButton type="submit" disabled={status.saving}>
          {status.saving ? 'GUARDANDO...' : 'GUARDAR AJUSTES'}
        </HardButton>
      )}
    </form>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Pestaña principal
 * ──────────────────────────────────────────────────────────────────────────── */
export default function RescueTab({ business, rescue, getTemplate, now, isAdmin, onBusinessSaved }) {
  const [subtab, setSubtab] = useState('activos');
  const { active, history, metrics, loading, error, reload } = rescue;
  const currency = business.currency;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Casos abiertos" value={active.length} tone={active.length ? 'red' : 'ink'} loading={loading} />
        <StatCard label="Clientes rescatados" value={metrics?.recovered ?? 0} tone="teal" loading={loading} />
        <StatCard label="Ventas recuperadas" badge="ESTIMADO" value={formatMoney(metrics?.recoveredValue, currency)} tone="teal" loading={loading} />
        <StatCard label="Tasa de rescate" value={`${metrics?.rescueRate ?? 0}%`} loading={loading} />
      </div>

      {!business.rescue_enabled && (
        <Alert variant="warning" title="Modo Rescate pausado">
          No se están abriendo casos nuevos. Activalo desde “Ajustes”.
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'activos', label: `Casos activos${active.length ? ` (${active.length})` : ''}` },
          { id: 'historial', label: 'Historial' },
          { id: 'ajustes', label: 'Ajustes' }
        ].map(s => (
          <HardButton key={s.id} size="sm" variant={subtab === s.id ? 'primary' : 'secondary'}
            onClick={() => setSubtab(s.id)} aria-pressed={subtab === s.id}>
            {s.label}
          </HardButton>
        ))}
      </div>

      {error && subtab !== 'ajustes' && (
        <Alert variant="error">{getErrorMessage(error, 'No pudimos cargar los casos de rescate.')}</Alert>
      )}

      {subtab === 'activos' && (
        loading ? (
          <div className="h-40 bg-paper-dim border border-line-gray animate-pulse" />
        ) : active.length === 0 ? (
          <EmptyState title="Sin casos activos">
            Cuando un cliente insatisfecho deje su contacto, aparece acá con su reloj.
          </EmptyState>
        ) : (
          <div className="space-y-4">
            <SectionLabel>Ordenados por vencimiento del SLA</SectionLabel>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {active.map(item => (
                <ActiveCaseCard key={item.id} item={item} business={business}
                  getTemplate={getTemplate} now={now} onChanged={reload} />
              ))}
            </div>
          </div>
        )
      )}

      {subtab === 'historial' && (
        <HistoryList items={history} business={business} isAdmin={isAdmin} onChanged={reload} />
      )}

      {subtab === 'ajustes' && (
        <RescueSettings business={business} isAdmin={isAdmin} onSaved={onBusinessSaved} />
      )}
    </div>
  );
}
