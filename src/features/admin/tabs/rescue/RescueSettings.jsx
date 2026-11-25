import React, { useEffect, useState } from 'react';
import HardButton from '../../../../components/ui/HardButton';
import Alert from '../../../../components/ui/Alert';
import Field from '../../../../components/ui/Field';
import { supabase } from '../../../../lib/supabaseClient';
import { getErrorMessage } from '../../../../lib/errors';
import { validateNumberRange, validatePersonName } from '../../../../lib/validators';
import RecoveredValueGuide from './RecoveredValueGuide';

export default function RescueSettings({ business, isAdmin, onSaved }) {
  const [form, setForm] = useState({
    rescue_enabled: business.rescue_enabled,
    avg_ticket_value: String(business.avg_ticket_value ?? 0),
    rescue_sla_minutes: String(business.rescue_sla_minutes ?? 60),
    rescue_threshold: String(business.rescue_threshold ?? 2),
    manager_name: business.manager_name || ''
  });
  const [status, setStatus] = useState({ saving: false, error: '', ok: false });

  useEffect(() => {
    setForm({
      rescue_enabled: business.rescue_enabled,
      avg_ticket_value: String(business.avg_ticket_value ?? 0),
      rescue_sla_minutes: String(business.rescue_sla_minutes ?? 60),
      rescue_threshold: String(business.rescue_threshold ?? 2),
      manager_name: business.manager_name || ''
    });
  }, [
    business.rescue_enabled,
    business.avg_ticket_value,
    business.rescue_sla_minutes,
    business.rescue_threshold,
    business.manager_name
  ]);

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
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,520px)_minmax(0,440px)] gap-6 items-start">
      <form onSubmit={handleSave} className="w-full bg-paper border border-line-gray p-4 sm:p-5 shadow-hard-line space-y-4">
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

        <Field
          id="ticket"
          type="number"
          min="0"
          step="100"
          inputMode="numeric"
          label={`Ticket promedio estimado (${business.currency || 'ARS'})`}
          hint="Monto promedio que gasta un cliente por visita. Si queda en 0, las ventas recuperadas mostrarán $ 0. Los casos ya abiertos conservan el valor anterior."
          value={form.avg_ticket_value}
          onChange={update('avg_ticket_value')}
          disabled={disabled}
        />

        <Field
          id="manager"
          label="Firma de los mensajes"
          maxLength={60}
          hint="Reemplaza {encargado} en las plantillas (ej: Sofía)."
          value={form.manager_name}
          onChange={update('manager_name')}
          disabled={disabled}
        />

        {status.error && <Alert variant="error">{status.error}</Alert>}
        {status.ok && <Alert variant="success">Ajustes guardados.</Alert>}

        {isAdmin && (
          <HardButton type="submit" disabled={status.saving}>
            {status.saving ? 'GUARDANDO...' : 'GUARDAR AJUSTES'}
          </HardButton>
        )}
      </form>

      <RecoveredValueGuide currency={business.currency} avgTicket={business.avg_ticket_value} />
    </div>
  );
}
