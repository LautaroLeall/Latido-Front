import React, { useState } from 'react';
import { ExternalLink, MessageCircle, Nfc, QrCode } from 'lucide-react';
import Stamp from '../../../components/ui/Stamp';
import HardButton from '../../../components/ui/HardButton';
import Alert from '../../../components/ui/Alert';
import BusinessLogo from '../../../components/branding/BusinessLogo';
import BranchNameEditor from '../../../components/ui/BranchNameEditor';
import { supabase } from '../../../lib/supabaseClient';
import { getErrorMessage } from '../../../lib/errors';
import { buildFeedbackUrl } from '../../../lib/utils';
import { buildWhatsAppUrl } from '../../../lib/contact';

export default function QrCard({ qr, business, branches, isAdmin, onChanged, onOpenAccount }) {
  const url = buildFeedbackUrl(qr.token);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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

  async function toggleActive() {
    setBusy(true);
    setError('');
    try {
      const { error: err } = await supabase.rpc('set_qr_active', { p_qr_id: qr.id, p_active: !qr.active });
      if (err) throw err;
      await onChanged();
    } catch (err) {
      setError(getErrorMessage(err, 'No pudimos cambiar el estado del soporte.'));
    } finally {
      setBusy(false);
    }
  }

  const branchLabel = qr.branch?.name || 'Sucursal';
  const kitOrderMsg = qr.active
    ? `Hola, soy de ${business.name} (${branchLabel}) y quiero encargar otro soporte físico QR + NFC de Latido.`
    : `Hola, soy de ${business.name} (${branchLabel}) y necesito reponer un soporte físico QR + NFC desactivado.`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[232px_1fr] gap-5 items-start bg-paper p-4 sm:p-5 border border-line-gray shadow-hard-line animate-fadeIn">
      {/* Ficha ilustrativa del soporte físico (sin QR escaneable ni descargable) */}
      <div className={`bg-paper-dim border-2 border-ink p-4 text-center shadow-hard-line ${qr.active ? '' : 'opacity-55 grayscale'}`}>
        <BusinessLogo name={business.name} logoUrl={business.logo_url} size={48} className="mx-auto mb-2" />
        <h3 className="font-bold leading-tight break-words">{business.name}</h3>
        <p className="font-mono text-[10px] text-muted uppercase tracking-wider mt-1 mb-3 break-words">
          {branchLabel}
        </p>

        <div className="bg-ink text-paper px-3 py-4 border border-ink shadow-hard-amber space-y-2">
          <div className="flex items-center justify-center gap-3 text-amber">
            <QrCode size={26} strokeWidth={1.75} aria-hidden="true" />
            <span className="h-5 w-px bg-paper/25" aria-hidden="true" />
            <Nfc size={26} strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-paper">
            Soporte físico QR + NFC
          </div>
          <div className="font-mono text-[10px] text-paper/70">
            {qr.active ? 'Configurado por Latido' : 'Soporte desactivado'}
          </div>
        </div>

        {isAdmin && !business.logo_url && onOpenAccount && (
          <button
            type="button"
            onClick={onOpenAccount}
            className="mt-3 font-mono text-[10px] text-teal underline cursor-pointer"
          >
            + Configurar logo del formulario
          </button>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h2 className="text-lg font-bold min-w-0">
            <BranchNameEditor
              branchId={qr.branch?.id}
              name={branchLabel}
              canEdit={isAdmin}
              onSaved={onChanged}
              textClassName="text-lg font-bold text-ink"
            />
          </h2>
          <Stamp variant={qr.active ? 'teal' : 'red'}>{qr.active ? 'Operativo' : 'Desactivado'}</Stamp>
          {qr.active && (
            <Stamp variant="ink">
              {qr.nfc_status === 'programmed' ? 'Kit configurado' : 'QR + NFC'}
            </Stamp>
          )}
        </div>

        <p className="text-xs text-muted leading-relaxed">
          <strong>Soporte llave en mano:</strong> tu kit físico de Latido incluye el soporte, tu logo, el <strong>código QR</strong> y el <strong>chip NFC</strong> ya configurados de fábrica. Si cambiás preguntas, logo o destino (Latido / Google), este soporte se actualiza al instante sin cambiar nada físico.
        </p>

        <div className="flex flex-wrap gap-2 mt-4">
          <HardButton size="sm" as="a" href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={13} /> {business.review_destination === 'google' ? 'Probar redirección' : 'Probar ticket'}
          </HardButton>
          <HardButton
            size="sm"
            variant="secondary"
            as="a"
            href={buildWhatsAppUrl(kitOrderMsg)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={13} /> {qr.active ? 'Pedir otro soporte' : 'Pedir reposición'}
          </HardButton>
        </div>

        {isAdmin && branches.length > 1 && (
          <label className="block mt-4 font-mono text-[11px] uppercase tracking-wider text-muted">
            Usar este soporte en la sucursal
            <select
              value={qr.branch?.id || ''}
              disabled={busy}
              onChange={e => moveTo(e.target.value)}
              className="mt-1.5 block w-full sm:max-w-[320px] min-h-[44px] bg-paper border-[1.5px] border-ink px-3 py-2 text-base sm:text-sm rounded-none normal-case tracking-normal text-ink cursor-pointer focus:border-teal outline-none"
            >
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <span className="normal-case tracking-normal text-[11px] block mt-1">
              El QR y el chip NFC de tu soporte físico se actualizan solos: no hay que regrabar nada.
            </span>
          </label>
        )}

        {isAdmin && (
          <div className="mt-4 pt-3 border-t border-dashed border-line-gray">
            <button
              type="button"
              onClick={toggleActive}
              disabled={busy}
              className={`font-mono text-xs underline cursor-pointer disabled:opacity-50 ${qr.active ? 'text-muted hover:text-alert-red' : 'text-teal font-bold'}`}
            >
              {busy ? 'Procesando...' : qr.active ? 'Desactivar este soporte (perdido o robado)' : 'Reactivar este soporte'}
            </button>
          </div>
        )}

        {error && <Alert variant="error" className="mt-3">{error}</Alert>}
      </div>
    </div>
  );
}
