import React, { useState } from 'react';
import HardButton from '../../components/ui/HardButton';
import Alert from '../../components/ui/Alert';
import Stamp from '../../components/ui/Stamp';
import { supabase } from '../../lib/supabaseClient';
import { getErrorMessage } from '../../lib/errors';
import { validateBusinessName, validateNumberRange } from '../../lib/validators';

const EMPTY_NEW = { code: '', name: '', supports: '1', price_monthly: '0', is_custom: false };

function toForm(plan) {
  return {
    name: plan.name,
    supports: plan.supports ?? '',
    price_monthly: plan.price_monthly ?? '',
    is_custom: plan.is_custom,
    highlighted: plan.highlighted,
    active: plan.active,
    sort_order: plan.sort_order
  };
}

function validate(f) {
  const nameRes = validateBusinessName(f.name, { min: 2, max: 40, label: 'El nombre del plan' });
  if (!nameRes.valid) return nameRes.error;
  if (!f.is_custom) {
    const s = validateNumberRange(f.supports, { min: 1, max: 1000, integer: true, label: 'Los soportes' });
    if (!s.valid) return s.error;
    const p = validateNumberRange(f.price_monthly, { min: 0, max: 100000000, label: 'El precio mensual' });
    if (!p.valid) return p.error;
  }
  if (f.sort_order !== undefined && f.sort_order !== '') {
    const ord = validateNumberRange(f.sort_order, { min: -1000, max: 10000, integer: true, label: 'El orden' });
    if (!ord.valid) return ord.error;
  }
  return '';
}

function toPayload(f) {
  return {
    name: f.name.trim(),
    is_custom: !!f.is_custom,
    supports: f.is_custom && f.supports === '' ? null : Number(f.supports),
    price_monthly: f.is_custom && f.price_monthly === '' ? null : Number(f.price_monthly),
    highlighted: !!f.highlighted,
    active: f.active !== false,
    sort_order: Number(f.sort_order) || 0
  };
}

function PlanRow({ plan, onChanged }) {
  const [form, setForm] = useState(() => toForm(plan));
  const [status, setStatus] = useState({ saving: false, error: '', ok: false });
  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(plan));

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [k]: v }));
    setStatus(s => ({ ...s, ok: false }));
  };

  async function save() {
    const msg = validate(form);
    if (msg) return setStatus({ saving: false, ok: false, error: msg });
    setStatus({ saving: true, error: '', ok: false });
    try {
      const { error } = await supabase.from('plans').update(toPayload(form)).eq('id', plan.id);
      if (error) throw error;
      await onChanged();
      setStatus({ saving: false, error: '', ok: true });
    } catch (err) {
      setStatus({ saving: false, ok: false, error: getErrorMessage(err, 'No pudimos guardar el plan.') });
    }
  }

  const cell = 'bg-paper text-ink border-[1.5px] border-line-gray px-2.5 py-2 min-h-[42px] sm:min-h-[38px] text-base sm:text-sm rounded-none w-full min-w-0 focus:border-teal outline-none';

  return (
    <div className={`border border-line-gray p-4 bg-paper ${form.active ? '' : 'opacity-70'}`}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <code className="font-mono text-[11px] bg-paper-dim px-1.5 py-0.5">{plan.code}</code>
        {plan.is_custom && <Stamp variant="amber">A medida</Stamp>}
        {!form.active && <Stamp variant="ink">Oculto</Stamp>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
        <label className="sm:col-span-2 font-mono text-[10px] uppercase text-muted min-w-0">Nombre
          <input className={cell} value={form.name} maxLength={40} onChange={set('name')} />
        </label>
        <label className="font-mono text-[10px] uppercase text-muted min-w-0">Soportes
          <input className={cell} type="number" inputMode="numeric" min="1" value={form.supports} disabled={form.is_custom}
            placeholder={form.is_custom ? '—' : ''} onChange={set('supports')} />
        </label>
        <label className="font-mono text-[10px] uppercase text-muted min-w-0">Precio / mes (ARS)
          <input className={cell} type="number" inputMode="numeric" min="0" step="1000" value={form.price_monthly} disabled={form.is_custom}
            placeholder={form.is_custom ? 'WhatsApp' : ''} onChange={set('price_monthly')} />
        </label>
        <label className="font-mono text-[10px] uppercase text-muted min-w-0">Orden
          <input className={cell} type="number" inputMode="numeric" value={form.sort_order} onChange={set('sort_order')} />
        </label>
        <div className="flex sm:flex-col gap-3 sm:gap-1 font-mono text-xs sm:text-[11px]">
          <label className="flex items-center gap-1.5 cursor-pointer py-1"><input type="checkbox" checked={form.active} onChange={set('active')} className="w-4 h-4 accent-teal" /> Visible</label>
          <label className="flex items-center gap-1.5 cursor-pointer py-1"><input type="checkbox" checked={form.highlighted} onChange={set('highlighted')} className="w-4 h-4 accent-teal" /> Destacado</label>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <HardButton size="sm" onClick={save} disabled={!dirty || status.saving}>
          {status.saving ? 'GUARDANDO...' : 'Guardar'}
        </HardButton>
        {dirty && <button type="button" onClick={() => setForm(toForm(plan))} className="font-mono text-xs underline text-muted cursor-pointer">Deshacer</button>}
        {status.ok && !dirty && <span className="font-mono text-xs text-teal font-bold">✓ Guardado</span>}
      </div>
      {status.error && <Alert variant="error" className="mt-3">{status.error}</Alert>}
    </div>
  );
}

export default function PlansManager({ plans, onChanged }) {
  const [form, setForm] = useState(EMPTY_NEW);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState({ saving: false, error: '' });

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function create(e) {
    e.preventDefault();
    const code = form.code.trim().toLowerCase();
    if (!/^[a-z0-9_-]{2,30}$/.test(code)) return setStatus({ saving: false, error: 'El código usa solo minúsculas, números, - o _ (2 a 30 caracteres).' });
    const msg = validate(form);
    if (msg) return setStatus({ saving: false, error: msg });
    setStatus({ saving: true, error: '' });
    try {
      const nextOrder = (plans.reduce((m, p) => Math.max(m, p.sort_order || 0), 0)) + 10;
      const { error } = await supabase.from('plans').insert({ code, ...toPayload(form), sort_order: nextOrder });
      if (error) throw error;
      setForm(EMPTY_NEW);
      setOpen(false);
      await onChanged();
      setStatus({ saving: false, error: '' });
    } catch (err) {
      const text = err?.code === '23505' ? 'Ya existe un plan con ese código.' : getErrorMessage(err, 'No pudimos crear el plan.');
      setStatus({ saving: false, error: text });
    }
  }

  return (
    <div className="space-y-4">
      <Alert variant="info">
        Los cambios se ven al instante en la landing. Un <strong>soporte</strong> es un kit físico QR + NFC; el negocio lo
        puede usar en cualquier sucursal propia. En un plan “a medida” cargás los soportes de cada negocio desde la pestaña Negocios.
      </Alert>

      {plans.map(p => <PlanRow key={`${p.id}-${p.updated_at}`} plan={p} onChanged={onChanged} />)}

      {open ? (
        <form onSubmit={create} className="border border-dashed border-ink p-4 bg-paper space-y-3">
          <h3 className="font-bold">Nuevo plan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <label className="font-mono text-[10px] uppercase text-muted min-w-0">Código
              <input className="bg-paper text-ink border-[1.5px] border-line-gray px-2.5 py-2 min-h-[42px] sm:min-h-[38px] text-base sm:text-sm rounded-none w-full min-w-0 focus:border-teal outline-none" value={form.code} onChange={set('code')} placeholder="ej: pro10" />
            </label>
            <label className="font-mono text-[10px] uppercase text-muted min-w-0">Nombre
              <input className="bg-paper text-ink border-[1.5px] border-line-gray px-2.5 py-2 min-h-[42px] sm:min-h-[38px] text-base sm:text-sm rounded-none w-full min-w-0 focus:border-teal outline-none" value={form.name} maxLength={40} onChange={set('name')} />
            </label>
            <label className="font-mono text-[10px] uppercase text-muted min-w-0">Soportes
              <input className="bg-paper text-ink border-[1.5px] border-line-gray px-2.5 py-2 min-h-[42px] sm:min-h-[38px] text-base sm:text-sm rounded-none w-full min-w-0 focus:border-teal outline-none" type="number" inputMode="numeric" min="1" value={form.supports} disabled={form.is_custom} onChange={set('supports')} />
            </label>
            <label className="font-mono text-[10px] uppercase text-muted min-w-0">Precio / mes
              <input className="bg-paper text-ink border-[1.5px] border-line-gray px-2.5 py-2 min-h-[42px] sm:min-h-[38px] text-base sm:text-sm rounded-none w-full min-w-0 focus:border-teal outline-none" type="number" inputMode="numeric" min="0" value={form.price_monthly} disabled={form.is_custom} onChange={set('price_monthly')} />
            </label>
          </div>
          <label className="flex items-center gap-2 font-mono text-xs cursor-pointer">
            <input type="checkbox" checked={form.is_custom} onChange={set('is_custom')} /> Plan a medida (el precio se habla por WhatsApp)
          </label>
          {status.error && <Alert variant="error">{status.error}</Alert>}
          <div className="flex gap-2">
            <HardButton type="submit" size="sm" disabled={status.saving}>{status.saving ? 'CREANDO...' : 'Crear plan'}</HardButton>
            <HardButton size="sm" variant="secondary" onClick={() => { setOpen(false); setStatus({ saving: false, error: '' }); }}>Cancelar</HardButton>
          </div>
        </form>
      ) : (
        <HardButton size="sm" variant="secondary" onClick={() => setOpen(true)}>+ Nuevo plan</HardButton>
      )}
    </div>
  );
}
