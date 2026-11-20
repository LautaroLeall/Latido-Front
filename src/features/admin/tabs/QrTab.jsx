import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import Stamp from '../../../components/ui/Stamp';
import HardButton from '../../../components/ui/HardButton';
import Alert from '../../../components/ui/Alert';
import Field from '../../../components/ui/Field';
import BusinessLogo from '../../../components/branding/BusinessLogo';
import { EmptyState, SectionLabel } from '../components/PanelBits';
import { useQrCodes } from '../useAdminData';
import { supabase } from '../../../lib/supabaseClient';
import { getErrorMessage } from '../../../lib/errors';
import { buildFeedbackUrl } from '../../../lib/utils';
import { buildWhatsAppUrl } from '../../../lib/contact';
import { validateBranchName } from '../../../lib/validators';

const NFC_LABELS = {
  pending: { text: 'NFC pendiente', variant: 'amber' },
  programmed: { text: 'NFC grabado', variant: 'teal' },
  inactive: { text: 'NFC inactivo', variant: 'ink' }
};

function QrCard({ qr, business, branches, isAdmin, onChanged, onOpenAccount }) {
  const url = buildFeedbackUrl(qr.token);
  const canvasWrapRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const nfc = NFC_LABELS[qr.nfc_status] || NFC_LABELS.pending;

  async function moveTo(branchId) {
    if (!branchId || branchId === qr.branch?.id) return;
    setBusy(true);
    setError('');
    try {
      const { error: err } = await supabase.rpc('move_qr_to_branch', { p_qr_id: qr.id, p_branch_id: branchId });
      if (err) throw err;
      await onChanged();
    } catch (err) {
      setError(getErrorMessage(err, 'No pudimos mover el soporte.'));
    } finally {
      setBusy(false);
    }
  }

  async function copyUrl() {
    setError('');
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('No se pudo copiar automáticamente. Seleccioná la URL y copiala a mano.');
    }
  }

  function downloadPng() {
    const canvas = canvasWrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    const safeName = `${business.name}-${qr.branch?.name || 'qr'}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.download = `latido-${safeName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  async function toggleActive() {
    setBusy(true);
    setError('');
    try {
      const { error: err } = await supabase.rpc('set_qr_active', { p_qr_id: qr.id, p_active: !qr.active });
      if (err) throw err;
      await onChanged();
    } catch (err) {
      setError(getErrorMessage(err, 'No pudimos cambiar el estado del QR.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-5 items-start bg-paper p-5 border border-line-gray shadow-hard-line animate-fadeIn">
      {/* Lámina (vista previa de lo que se imprime) */}
      <div className={`bg-paper-dim border-2 border-ink p-4 text-center shadow-hard-line ${qr.active ? '' : 'opacity-50 grayscale'}`}>
        <BusinessLogo name={business.name} logoUrl={business.logo_url} size={48} className="mx-auto mb-2" />
        <h3 className="font-bold leading-tight break-words">{business.name}</h3>
        <p className="font-mono text-[11px] text-muted mb-3">Escaneá o acercá tu celular</p>
        <div className="bg-paper inline-block p-2 border border-line-gray">
          <QRCodeSVG value={url} size={144} level="M" fgColor="#1A1D29" bgColor="#FAF8F3" />
        </div>
        <div className="font-mono text-[10px] text-muted mt-3 uppercase tracking-wider break-words">
          {qr.branch?.name} · opiná en 30 segundos
        </div>
        {isAdmin && !business.logo_url && onOpenAccount && (
          <button
            type="button"
            onClick={onOpenAccount}
            className="mt-2 font-mono text-[10px] text-teal underline cursor-pointer"
          >
            + Poner tu logo en esta lámina
          </button>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h2 className="text-lg font-bold break-words">{qr.branch?.name || 'Sucursal'}</h2>
          <Stamp variant={qr.active ? 'teal' : 'red'}>{qr.active ? 'Operativo' : 'Desactivado'}</Stamp>
          <Stamp variant={nfc.variant}>{nfc.text}</Stamp>
        </div>

        <div className="font-mono text-xs space-y-1.5">
          <div className="text-muted uppercase tracking-wider">URL del ticket (QR y chip NFC)</div>
          <code className="block bg-paper-dim px-2.5 py-2 break-all select-all border border-line-gray">{url}</code>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <HardButton size="sm" onClick={downloadPng} disabled={!qr.active}>Descargar QR (PNG)</HardButton>
          <HardButton size="sm" variant="secondary" onClick={copyUrl}>{copied ? '✓ Copiada' : 'Copiar URL'}</HardButton>
          <HardButton size="sm" variant="secondary" as="a" href={url} target="_blank" rel="noopener noreferrer">
            {business.review_destination === 'google' ? 'Probar redirección' : 'Probar ticket'}
          </HardButton>
        </div>

        <p className="text-xs text-muted mt-4 leading-relaxed">
          <strong>NFC:</strong> grabá esta misma URL en un chip NTAG213 con la app gratuita “NFC Tools”
          (Escribir → Agregar registro → URL). Así el cliente solo acerca el celular.
        </p>

        {isAdmin && branches.length > 1 && (
          <label className="block mt-4 font-mono text-[11px] uppercase tracking-wider text-muted">
            Usar este soporte en la sucursal
            <select value={qr.branch?.id || ''} disabled={busy} onChange={e => moveTo(e.target.value)}
              className="mt-1 block w-full max-w-[300px] bg-paper border-[1.5px] border-ink p-2 text-sm rounded-none normal-case tracking-normal text-ink">
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <span className="normal-case tracking-normal text-[11px] block mt-1">
              La URL y el chip NFC no cambian: no hay que regrabar nada.
            </span>
          </label>
        )}

        {isAdmin && (
          <div className="mt-4 pt-3 border-t border-dashed border-line-gray">
            <button type="button" onClick={toggleActive} disabled={busy}
              className={`font-mono text-xs underline cursor-pointer disabled:opacity-50 ${qr.active ? 'text-muted hover:text-alert-red' : 'text-teal font-bold'}`}>
              {busy ? 'Procesando...' : qr.active ? 'Desactivar este QR (lámina perdida o robada)' : 'Reactivar este QR'}
            </button>
          </div>
        )}

        {error && <Alert variant="error" className="mt-3">{error}</Alert>}
      </div>

      {/* Canvas oculto de alta resolución para la descarga */}
      <div ref={canvasWrapRef} className="hidden" aria-hidden="true">
        <QRCodeCanvas value={url} size={1024} level="M" marginSize={4} fgColor="#1A1D29" bgColor="#FFFFFF" />
      </div>
    </div>
  );
}

export default function QrTab({ business, isAdmin, onOpenDestination, onOpenAccount }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { items, loading, error } = useQrCodes(business.id, refreshKey);
  const [branches, setBranches] = useState([]);
  const [supports, setSupports] = useState(null); // { limit, used, plan_name }
  const [branchName, setBranchName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [assigning, setAssigning] = useState(null);
  const [assignError, setAssignError] = useState('');

  const reload = async () => setRefreshKey(k => k + 1);

  // Sucursales y uso de soportes del plan
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase.from('branches').select('id, name').eq('business_id', business.id).order('created_at', { ascending: true }),
      supabase.rpc('get_my_supports')
    ]).then(([b, s]) => {
      if (cancelled) return;
      if (!b.error) setBranches(b.data || []);
      setSupports(s.error ? null : s.data);
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
                <HardButton as="a" size="sm" variant="teal" target="_blank" rel="noopener noreferrer"
                  href={buildWhatsAppUrl(`Hola, soy de ${business.name} (${supports.plan_name}) y quiero sumar más soportes QR + NFC.`)}>
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
                  ? 'No te quedan soportes libres: la sucursal se crea sin soporte y después le movés o asignás uno.'
                  : 'Se crea con un soporte nuevo (QR + NFC) para comparar los resultados de cada local.'}
              </p>
            </div>
            <div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                <Field id="new-branch" className="flex-1" maxLength={60} placeholder="Ej: Sucursal Norte"
                  value={branchName} onChange={e => setBranchName(e.target.value)} />
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
              <QrCard key={qr.id} qr={qr} business={business} branches={branches} isAdmin={isAdmin} onChanged={reload} onOpenAccount={onOpenAccount} />
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
                <span className="text-sm font-medium">{b.name}</span>
                <HardButton size="sm" variant="secondary" disabled={assigning === b.id || free === 0}
                  onClick={() => assignSupport(b.id)}>
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
