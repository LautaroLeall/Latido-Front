import React, { useEffect, useState } from 'react';
import Stamp from '../../../components/ui/Stamp';
import HardButton from '../../../components/ui/HardButton';
import Alert from '../../../components/ui/Alert';
import Field from '../../../components/ui/Field';
import BranchNameEditor from '../../../components/ui/BranchNameEditor';
import { EmptyState, SectionLabel } from '../components/PanelBits';
import { useQrCodes } from '../useAdminData';
import { supabase } from '../../../lib/supabaseClient';
import { getErrorMessage } from '../../../lib/errors';
import { buildWhatsAppUrl } from '../../../lib/contact';
import { validateBranchName } from '../../../lib/validators';
import QrCard from './QrCard';

export default function QrTab({ business, isAdmin, onOpenDestination, onOpenAccount }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { items, loading, error } = useQrCodes(business.id, refreshKey);
  const [branches, setBranches] = useState([]);
  const [supports, setSupports] = useState(null);
  const [branchName, setBranchName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [assigning, setAssigning] = useState(null);
  const [assignError, setAssignError] = useState('');

  const reload = async () => setRefreshKey(k => k + 1);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase.from('branches').select('id, name').eq('business_id', business.id).order('created_at', { ascending: true }),
      supabase.rpc('get_my_supports')
    ])
      .then(([b, s]) => {
        if (cancelled) return;
        if (!b.error) setBranches(b.data || []);
        setSupports(s.error ? null : s.data);
      })
      .catch(() => {
        if (!cancelled) setSupports(null);
      });
    return () => { cancelled = true; };
  }, [business.id, refreshKey]);

  const free = supports ? Math.max(0, supports.limit - supports.used) : null;
  const branchesWithoutQr = branches.filter(b => !items.some(q => q.active && q.branch?.id === b.id));

  async function handleCreate(e) {
    e.preventDefault();
    if (creating) return;
    setCreateError('');
    const branchRes = validateBranchName(branchName);
    if (!branchRes.valid) {
      setCreateError(branchRes.error);
      return;
    }
    setCreating(true);
    try {
      const params = { p_branch_name: branchRes.value };
      if (free === 0) params.p_with_qr = false;
      const { error: err } = await supabase.rpc('create_branch_with_qr', params);
      if (err) throw err;
      setBranchName('');
      await reload();
    } catch (err) {
      setCreateError(getErrorMessage(err, 'No pudimos crear la sucursal.'));
    } finally {
      setCreating(false);
    }
  }

  async function assignSupport(branchId) {
    setAssigning(branchId);
    setAssignError('');
    try {
      const { error: err } = await supabase.rpc('add_qr_to_branch', { p_branch_id: branchId });
      if (err) throw err;
      await reload();
    } catch (err) {
      setAssignError(getErrorMessage(err, 'No pudimos asignar el soporte.'));
    } finally {
      setAssigning(null);
    }
  }

  const usedPct = supports && supports.limit > 0 ? Math.min(100, Math.round((supports.used / supports.limit) * 100)) : 0;
  const destinationSummary =
    business.review_destination === 'google'
      ? { label: 'Solo Google (redirección directa)', detail: 'Al escanear, el cliente va directo a tu ficha de Google Maps.', variant: 'amber' }
      : business.review_destination === 'both'
        ? { label: 'Ambas (primero Latido → después ofrece Google)', detail: 'El cliente opina en Latido y luego elige si quiere dejar reseña en Google.', variant: 'teal' }
        : { label: 'Solo tu panel (Latido)', detail: 'Al escanear, el cliente completa únicamente tu ticket privado.', variant: 'ink' };

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{getErrorMessage(error, 'No pudimos cargar tus QR.')}</Alert>}

      {/* Destino activo de todos los QR/NFC del negocio */}
      <div className="bg-paper-dim border border-line-gray px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <Stamp variant={destinationSummary.variant}>Destino activo</Stamp>
          <div className="text-xs min-w-0">
            <strong className="text-ink">{destinationSummary.label}</strong>
            <span className="text-muted"> — {destinationSummary.detail}</span>
          </div>
        </div>
        {isAdmin && onOpenDestination && (
          <HardButton size="sm" variant="secondary" onClick={onOpenDestination}>
            Cambiar destino
          </HardButton>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
        {supports && (
          <div className="bg-paper border border-line-gray p-5 shadow-hard-line flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs uppercase tracking-wider text-muted">
                  {supports.plan_name} · soportes activos
                </span>
                <strong className="font-mono text-base">{supports.used} de {supports.limit}</strong>
              </div>
              <div className="h-3 bg-paper-dim border border-line-gray">
                <div className={`h-full transition-all ${free === 0 ? 'bg-amber' : 'bg-teal'}`} style={{ width: `${usedPct}%` }} />
              </div>
              <p className="text-xs text-muted mt-2.5 leading-relaxed">
                {free === 0
                  ? 'Usaste todos los soportes de tu plan actual. Escribinos para pasar a un plan con más soportes.'
                  : `Te quedan ${free} ${free === 1 ? 'soporte libre' : 'soportes libres'}. Podés usarlos en cualquier sucursal de tu negocio.`}
              </p>
            </div>
            {free === 0 && (
              <div className="mt-3">
                <HardButton
                  as="a"
                  size="sm"
                  variant="teal"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={buildWhatsAppUrl(`Hola, soy de ${business.name} (${supports.plan_name}) y quiero sumar más soportes QR + NFC.`)}
                >
                  Pedir más soportes por WhatsApp
                </HardButton>
              </div>
            )}
          </div>
        )}

        {isAdmin && (
          <form onSubmit={handleCreate} className="bg-paper border border-dashed border-ink p-5 flex flex-col justify-between">
            <div>
              <h3 className="font-bold mb-1">Nueva sucursal</h3>
              <p className="text-xs text-muted mb-3 leading-relaxed">
                {free === 0
                  ? 'No te quedan soportes libres: la sucursal se crea sin soporte y después podés moverle uno que ya tengas.'
                  : 'Se crea la sucursal y reservás un soporte de tu plan para que el equipo de Latido te arme y entregue el kit físico (QR + NFC) ya configurado.'}
              </p>
            </div>
            <div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                <Field
                  id="new-branch"
                  className="flex-1"
                  maxLength={60}
                  placeholder="Ej: Sucursal Norte"
                  value={branchName}
                  onChange={e => setBranchName(e.target.value)}
                />
                <HardButton type="submit" disabled={creating} className="sm:mt-0 whitespace-nowrap">
                  {creating ? 'CREANDO...' : free === 0 ? 'CREAR SUCURSAL' : 'CREAR + SOPORTE'}
                </HardButton>
              </div>
              {createError && <Alert variant="error" className="mt-3">{createError}</Alert>}
            </div>
          </form>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
          <div className="h-64 bg-paper-dim border border-line-gray animate-pulse" />
          <div className="h-64 bg-paper-dim border border-line-gray animate-pulse" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="Todavía no tenés QR">Creá una sucursal para generar el primero.</EmptyState>
      ) : (
        <div className="space-y-4">
          <SectionLabel>{items.length} {items.length === 1 ? 'punto de contacto' : 'puntos de contacto'}</SectionLabel>
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
            {items.map(qr => (
              <QrCard
                key={qr.id}
                qr={qr}
                business={business}
                branches={branches}
                isAdmin={isAdmin}
                onChanged={reload}
                onOpenAccount={onOpenAccount}
              />
            ))}
          </div>
        </div>
      )}

      {isAdmin && branchesWithoutQr.length > 0 && items.length > 0 && (
        <div className="bg-paper border border-dashed border-ink p-5">
          <SectionLabel>Sucursales sin soporte asignado</SectionLabel>
          <ul className="divide-y divide-dashed divide-line-gray">
            {branchesWithoutQr.map(b => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                <BranchNameEditor
                  branchId={b.id}
                  name={b.name}
                  canEdit={isAdmin}
                  onSaved={reload}
                  textClassName="text-sm font-medium text-ink"
                />
                <HardButton
                  size="sm"
                  variant="secondary"
                  disabled={assigning === b.id || free === 0}
                  onClick={() => assignSupport(b.id)}
                >
                  {assigning === b.id ? 'ASIGNANDO...' : free === 0 ? 'Sin soportes libres' : 'Asignar un soporte'}
                </HardButton>
              </li>
            ))}
          </ul>
          {assignError && <Alert variant="error" className="mt-3">{assignError}</Alert>}
        </div>
      )}
    </div>
  );
}
