import React, { useEffect, useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { getErrorMessage } from '../../lib/errors';
import { validateBranchName } from '../../lib/validators';

/**
 * Editor inline del nombre de una sucursal (usado por Admin del negocio y Super Admin).
 * No modifica la URL del QR ni el chip NFC: el cambio impacta al instante en el ticket y láminas.
 */
export default function BranchNameEditor({
  branchId,
  name,
  canEdit = false,
  onSaved,
  textClassName = 'font-bold text-ink',
  inputClassName = 'w-48 sm:w-56'
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(name || '');
  }, [name]);

  async function handleSave() {
    if (saving || !branchId) return;
    setError('');
    const check = validateBranchName(draft);
    if (!check.valid) {
      setError(check.error);
      return;
    }
    if (check.value === (name || '').trim()) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const { data, error: err } = await supabase
        .from('branches')
        .update({ name: check.value })
        .eq('id', branchId)
        .select('id')
        .maybeSingle();

      if (err) throw err;
      if (!data) {
        throw new Error('No tenés permisos para renombrar esta sucursal (verificá que esté aplicada la migración 016 en Supabase).');
      }
      setEditing(false);
      await onSaved?.(check.value);
    } catch (err) {
      setError(getErrorMessage(err, 'No pudimos actualizar el nombre de la sucursal.'));
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-1.5 min-w-0 max-w-full">
        <span className={`${textClassName} break-words`}>{name || 'Sucursal'}</span>
        {canEdit && branchId && (
          <button
            type="button"
            title="Editar nombre de la sucursal"
            aria-label={`Editar nombre de la sucursal ${name || ''}`}
            onClick={() => { setDraft(name || ''); setError(''); setEditing(true); }}
            className="p-1 text-muted hover:text-teal transition-colors cursor-pointer shrink-0"
          >
            <Pencil size={13} />
          </button>
        )}
      </span>
    );
  }

  return (
    <div className="inline-flex flex-col gap-1 max-w-full">
      <div className="flex flex-wrap items-center gap-1.5">
        <input
          type="text"
          value={draft}
          maxLength={60}
          disabled={saving}
          onChange={(e) => { setDraft(e.target.value); if (error) setError(''); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
            if (e.key === 'Escape') { setEditing(false); setDraft(name || ''); setError(''); }
          }}
          autoFocus
          aria-label="Nuevo nombre de la sucursal"
          className={`bg-paper text-ink border-[1.5px] border-ink px-2.5 py-1 min-h-[38px] text-base sm:text-sm rounded-none outline-none focus:border-teal max-w-full ${inputClassName}`}
        />
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          aria-label="Guardar nombre de sucursal"
          className="min-h-[38px] min-w-[38px] px-2 bg-teal text-paper border-[1.5px] border-teal inline-flex items-center justify-center cursor-pointer hover:brightness-105 disabled:opacity-50"
        >
          <Check size={15} />
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => { setEditing(false); setDraft(name || ''); setError(''); }}
          aria-label="Cancelar edición de sucursal"
          className="min-h-[38px] min-w-[38px] px-2 bg-paper text-muted border-[1.5px] border-line-gray inline-flex items-center justify-center cursor-pointer hover:border-ink hover:text-ink disabled:opacity-50"
        >
          <X size={15} />
        </button>
      </div>
      {error && <p className="font-mono text-[11px] text-alert-red">{error}</p>}
    </div>
  );
}
