import React, { useEffect, useMemo, useState } from 'react';
import HardButton from '../../../components/ui/HardButton';
import Alert from '../../../components/ui/Alert';
import Field from '../../../components/ui/Field';
import { supabase } from '../../../lib/supabaseClient';
import { getErrorMessage } from '../../../lib/errors';
import { validateBranchName } from '../../../lib/validators';

/**
 * Formulario rápido para que el Super Admin emita un nuevo kit QR + NFC para cualquier negocio.
 */
export default function NewKitPanel({ businesses, onCreated, onClose }) {
  const activeBusinesses = useMemo(() => businesses.filter(b => b.active), [businesses]);
  const [businessId, setBusinessId] = useState(activeBusinesses[0]?.business_id || '');
  const [branches, setBranches] = useState([]);
  const [mode, setMode] = useState('new'); // 'new' | 'existing'
  const [branchId, setBranchId] = useState('');
  const [branchName, setBranchName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedBiz = activeBusinesses.find(b => b.business_id === businessId) || null;
  const hasFreeSlot = selectedBiz ? Number(selectedBiz.qr_active) < Number(selectedBiz.supports_limit) : false;

  useEffect(() => {
    if (!businessId) {
      setBranches([]);
      return;
    }
    let cancelled = false;
    supabase
      .from('branches')
      .select('id, name')
      .eq('business_id', businessId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        const list = data || [];
        setBranches(list);
        setBranchId(list[0]?.id || '');
      })
      .catch(() => {
        if (!cancelled) setBranches([]);
      });
    return () => { cancelled = true; };
  }, [businessId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving || !businessId) return;
    setError('');

    let cleanName = null;
    if (mode === 'new') {
      const check = validateBranchName(branchName);
      if (!check.valid) {
        setError(check.error);
        return;
      }
      cleanName = check.value;
    } else if (!branchId) {
      setError('Elegí una sucursal existente o creá una nueva.');
      return;
    }

    setSaving(true);
    try {
      const { error: err } = await supabase.rpc('super_create_kit', {
        p_business_id: businessId,
        p_branch_id: mode === 'existing' ? branchId : null,
        p_branch_name: mode === 'new' ? cleanName : null,
        p_kit_notes: notes.trim() || null
      });
      if (err) throw err;
      setBranchName('');
      setNotes('');
      await onCreated();
      onClose?.();
    } catch (err) {
      setError(getErrorMessage(err, 'No pudimos generar el nuevo soporte.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-paper border-[1.5px] border-ink p-4 sm:p-5 shadow-hard-line space-y-4 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-dashed border-line-gray">
        <div>
          <h3 className="font-bold text-base">Emitir nuevo soporte QR + NFC</h3>
          <p className="text-xs text-muted mt-0.5">
            Genera una URL única para armar el soporte físico (QR + chip NTAG213) antes de entregárselo al negocio.
          </p>
        </div>
        <button type="button" onClick={onClose} className="font-mono text-xs text-muted underline hover:text-ink cursor-pointer">
          Cerrar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          id="kit-biz"
          as="select"
          label="Negocio"
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
        >
          {activeBusinesses.map(b => (
            <option key={b.business_id} value={b.business_id}>
              {b.name} ({b.qr_active}/{b.supports_limit} soportes)
            </option>
          ))}
        </Field>

        <div className="space-y-1.5">
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-muted">Destino del soporte</div>
          <div className="flex gap-2">
            <HardButton type="button" size="sm" variant={mode === 'new' ? 'primary' : 'secondary'} onClick={() => setMode('new')}>
              Nueva sucursal
            </HardButton>
            {branches.length > 0 && (
              <HardButton type="button" size="sm" variant={mode === 'existing' ? 'primary' : 'secondary'} onClick={() => setMode('existing')}>
                Sucursal existente
              </HardButton>
            )}
          </div>
        </div>
      </div>

      {selectedBiz && !hasFreeSlot && (
        <Alert variant="warning">
          <strong>{selectedBiz.name}</strong> ya usa {selectedBiz.qr_active}/{selectedBiz.supports_limit} soportes de su plan ({selectedBiz.plan_name}).
          Subí su plan o sus soportes en la pestaña <strong>Negocios</strong> antes de emitir otro kit.
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mode === 'new' ? (
          <Field
            id="kit-new-branch"
            label="Nombre de la nueva sucursal o ubicación"
            maxLength={60}
            placeholder="Ej: Sucursal Norte, Barra Principal, Caja 2"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
          />
        ) : (
          <Field
            id="kit-existing-branch"
            as="select"
            label="Sucursal existente"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            {branches.map(br => <option key={br.id} value={br.id}>{br.name}</option>)}
          </Field>
        )}

        <Field
          id="kit-initial-note"
          label="Nota de armado (opcional)"
          maxLength={300}
          placeholder="Ej: Acrílico 10×15 con logo blanco, entregar el viernes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-wrap gap-2">
        <HardButton type="submit" variant="teal" disabled={saving || !businessId || !hasFreeSlot}>
          {saving ? 'GENERANDO...' : 'GENERAR SOPORTE Y PASAR A COLA'}
        </HardButton>
        <HardButton type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </HardButton>
      </div>
    </form>
  );
}
