import React, { useEffect, useRef, useState } from 'react';
import {
  Check, CheckCircle2, Copy, Download, ExternalLink, FileImage,
  MessageCircle, Nfc, PackageCheck, Power, Radio, Pencil
} from 'lucide-react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import BusinessLogo from '../../../components/branding/BusinessLogo';
import Stamp from '../../../components/ui/Stamp';
import HardButton from '../../../components/ui/HardButton';
import Alert from '../../../components/ui/Alert';
import Field from '../../../components/ui/Field';
import BranchNameEditor from '../../../components/ui/BranchNameEditor';
import { supabase } from '../../../lib/supabaseClient';
import { getErrorMessage } from '../../../lib/errors';
import { buildFeedbackUrl, buildKitUrl, formatDateTime, formatRelative } from '../../../lib/utils';
import { downloadPrintableKitPoster, downloadQrOnlyPng } from '../../../lib/kitPoster';
import { buildReadyWhatsAppText, getKitStage, STAGE_META } from './kitStages';

export default function KitCard({ kit, migrationMissing, onChanged, onOpenBusiness }) {
  const url = buildKitUrl(kit.token);
  const testUrl = buildFeedbackUrl(kit.token);
  const canvasWrapRef = useRef(null);
  const stage = getKitStage(kit);
  const meta = STAGE_META[stage];

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [downloadingPoster, setDownloadingPoster] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(kit.kit_notes || '');

  useEffect(() => {
    setNotesDraft(kit.kit_notes || '');
  }, [kit.kit_notes]);

  async function runUpdate(params) {
    if (migrationMissing) return;
    setBusy(true);
    setError('');
    try {
      const { error: err } = await supabase.rpc('super_update_kit', {
        p_qr_id: kit.qr_id,
        ...params
      });
      if (err) throw err;
      setEditingNotes(false);
      await onChanged();
    } catch (err) {
      setError(getErrorMessage(err, 'No pudimos actualizar el estado del soporte.'));
    } finally {
      setBusy(false);
    }
  }

  async function copyUrl() {
    setError('');
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2200);
    } catch {
      setError('No pudimos copiar automáticamente. Seleccioná la URL y copiala a mano.');
    }
  }

  function handleDownloadQr() {
    const canvas = canvasWrapRef.current?.querySelector('canvas');
    downloadQrOnlyPng(canvas, kit.business_name, kit.branch_name);
  }

  async function handleDownloadPoster() {
    const canvas = canvasWrapRef.current?.querySelector('canvas');
    if (!canvas || downloadingPoster) return;
    setDownloadingPoster(true);
    try {
      await downloadPrintableKitPoster({
        qrCanvas: canvas,
        businessName: kit.business_name,
        branchName: kit.branch_name,
        logoUrl: kit.business_logo_url
      });
    } finally {
      setDownloadingPoster(false);
    }
  }

  const readyWaHref = `https://wa.me/?text=${encodeURIComponent(buildReadyWhatsAppText(kit, url))}`;
  const scansTotal = Number(kit.responses_total || 0);
  const scans30d = Number(kit.responses_30d || 0);

  return (
    <article className={`bg-paper border border-line-gray border-l-4 ${meta.border} shadow-hard-line p-4 sm:p-5 min-w-0 animate-fadeIn`}>
      <div className="grid grid-cols-1 lg:grid-cols-[224px_1fr] gap-5 items-start">
        {/* Columna izquierda: maqueta del soporte físico + descargas de producción */}
        <div className="space-y-2.5">
          <div className={`bg-paper-dim border-2 border-ink p-3.5 text-center shadow-hard-line ${stage === 'inactive' ? 'opacity-55 grayscale' : ''}`}>
            <BusinessLogo name={kit.business_name} logoUrl={kit.business_logo_url} size={42} className="mx-auto mb-2" />
            <div className="font-bold text-sm leading-tight break-words">{kit.business_name}</div>
            <div className="font-mono text-[10px] text-muted mt-0.5 mb-2.5 truncate">{kit.branch_name}</div>
            <div className="bg-paper inline-block p-1.5 border border-line-gray">
              <QRCodeSVG value={url} size={126} level="M" fgColor="#1A1D29" bgColor="#FAF8F3" />
            </div>
            <div className="mt-2.5 bg-ink text-paper px-2 py-1 font-mono text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Radio size={11} className="text-amber shrink-0" />
              <span>QR + Chip NFC</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
            <HardButton size="sm" variant="primary" className="w-full" onClick={handleDownloadPoster} disabled={downloadingPoster}>
              <FileImage size={13} /> {downloadingPoster ? 'Generando...' : 'Lámina HD (10×15)'}
            </HardButton>
            <HardButton size="sm" variant="secondary" className="w-full" onClick={handleDownloadQr}>
              <Download size={13} /> Solo QR (1024px)
            </HardButton>
          </div>
        </div>

        {/* Columna derecha: estado, stepper 3 pasos, herramientas NFC y entrega */}
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenBusiness?.(kit.business_id)}
                  className="text-lg font-bold tracking-tight text-left hover:text-teal hover:underline cursor-pointer break-words"
                >
                  {kit.business_name}
                </button>
                <Stamp variant={meta.stampVariant}>{meta.short}</Stamp>
                {kit.business_active === false && <Stamp variant="red">Negocio suspendido</Stamp>}
              </div>
              <div className="font-mono text-xs text-muted flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <BranchNameEditor
                  branchId={kit.branch_id}
                  name={kit.branch_name}
                  canEdit
                  onSaved={onChanged}
                  textClassName="font-bold text-ink font-mono text-xs"
                />
                <span>· {kit.plan_name}</span>
                {kit.owner_name && <span>· {kit.owner_name}</span>}
                <span>· creado {formatDateTime(kit.created_at)}</span>
              </div>
            </div>

            <div className="bg-paper-dim border border-line-gray px-3 py-1.5 font-mono text-[11px] text-right shrink-0">
              <div>
                <strong className={scans30d > 0 ? 'text-teal' : 'text-ink'}>{scans30d}</strong> op. (30d)
                <span className="text-muted"> · {scansTotal} total</span>
              </div>
              <div className="text-[10px] text-muted">
                {kit.last_response_at ? `Último uso ${formatRelative(kit.last_response_at)}` : 'Sin escaneos todavía'}
              </div>
            </div>
          </div>

          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]" aria-label="Progreso del soporte físico">
            {[
              { n: 1, title: '1. QR generado', done: true, detail: 'URL única activa' },
              {
                n: 2,
                title: '2. Chip NFC grabado',
                done: kit.nfc_status === 'programmed' || !!kit.delivered_at,
                detail: kit.nfc_status === 'programmed' || kit.delivered_at ? 'NTAG213 listo' : 'Pendiente grabar'
              },
              {
                n: 3,
                title: '3. Entregado al local',
                done: !!kit.delivered_at,
                detail: kit.delivered_at ? formatDateTime(kit.delivered_at) : 'Falta entregar'
              }
            ].map((s) => (
              <li
                key={s.n}
                className={`px-3 py-2 border flex items-start gap-2 ${s.done
                  ? 'border-teal/50 bg-teal/5 text-ink'
                  : 'border-dashed border-line-gray bg-paper-dim/60 text-muted'
                  }`}
              >
                <CheckCircle2 size={14} className={`mt-0.5 shrink-0 ${s.done ? 'text-teal' : 'text-line-gray'}`} />
                <div className="min-w-0">
                  <div className={`font-bold text-[10.5px] uppercase tracking-wider ${s.done ? 'text-ink' : 'text-muted'}`}>
                    {s.title}
                  </div>
                  <div className="text-[10px] text-muted truncate">{s.detail}</div>
                </div>
              </li>
            ))}
          </ol>

          <div className="bg-paper-dim border border-line-gray p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink inline-flex items-center gap-1.5">
                <Nfc size={13} className="text-teal shrink-0" />
                URL para grabar en chip NTAG213
              </span>
              <span className="font-mono text-[10px] text-muted">
                NFC Tools → Escribir → Agregar registro → URL
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <code className="flex-1 min-w-0 bg-paper px-2.5 py-2 border border-line-gray font-mono text-xs break-all select-all">
                {url}
              </code>
              <div className="flex flex-wrap gap-1.5 shrink-0">
                <HardButton size="sm" variant="secondary" onClick={copyUrl}>
                  {copiedUrl ? <><Check size={13} /> Copiada</> : <><Copy size={13} /> Copiar URL</>}
                </HardButton>
                <HardButton size="sm" variant="secondary" as="a" href={testUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={13} /> Probar
                </HardButton>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold">
                Nota interna de armado / entrega
              </span>
              {!migrationMissing && !editingNotes && (
                <button
                  type="button"
                  onClick={() => { setNotesDraft(kit.kit_notes || ''); setEditingNotes(true); }}
                  className="inline-flex items-center gap-1 font-mono text-[10.5px] font-bold text-teal hover:underline cursor-pointer"
                >
                  <Pencil size={11} /> {kit.kit_notes ? 'Editar nota' : 'Agregar nota'}
                </button>
              )}
            </div>

            {editingNotes ? (
              <div className="space-y-2">
                <Field
                  id={`kit-notes-${kit.qr_id}`}
                  maxLength={300}
                  placeholder="Ej: Acrílico negro 10×15, chip NTAG213 probado en iPhone y Android, entregado en mostrador..."
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <HardButton
                    size="sm"
                    variant="teal"
                    disabled={busy}
                    onClick={() => runUpdate(notesDraft.trim() ? { p_kit_notes: notesDraft.trim() } : { p_clear_notes: true })}
                  >
                    {busy ? 'GUARDANDO...' : 'Guardar nota'}
                  </HardButton>
                  <HardButton size="sm" variant="secondary" disabled={busy} onClick={() => setEditingNotes(false)}>
                    Cancelar
                  </HardButton>
                </div>
              </div>
            ) : kit.kit_notes ? (
              <p className="text-xs text-ink bg-paper-dim/60 border-l-[3px] border-l-amber px-3 py-2 break-words">
                {kit.kit_notes}
              </p>
            ) : (
              <p className="text-xs text-muted italic">Sin notas de armado todavía.</p>
            )}
          </div>

          <div className="pt-3 border-t border-dashed border-line-gray flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {!migrationMissing && stage === 'prepare' && (
                <>
                  <HardButton size="sm" variant="teal" disabled={busy} onClick={() => runUpdate({ p_nfc_status: 'programmed' })}>
                    <Check size={14} /> Marcar NFC grabado
                  </HardButton>
                  <HardButton size="sm" variant="secondary" disabled={busy} onClick={() => runUpdate({ p_nfc_status: 'programmed', p_delivered: true })}>
                    <PackageCheck size={14} /> Listo y entregado
                  </HardButton>
                </>
              )}

              {!migrationMissing && stage === 'ready' && (
                <>
                  <HardButton size="sm" variant="teal" disabled={busy} onClick={() => runUpdate({ p_delivered: true })}>
                    <PackageCheck size={14} /> Marcar entregado
                  </HardButton>
                  <HardButton as="a" size="sm" variant="primary" href={readyWaHref} target="_blank" rel="noopener noreferrer">
                    <MessageCircle size={14} /> Avisar por WhatsApp
                  </HardButton>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => runUpdate({ p_nfc_status: 'pending' })}
                    className="font-mono text-[11px] text-muted underline hover:text-ink cursor-pointer px-1"
                  >
                    Volver a pendiente
                  </button>
                </>
              )}

              {!migrationMissing && stage === 'delivered' && (
                <>
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-teal">
                    <PackageCheck size={15} /> Entregado el {formatDateTime(kit.delivered_at)}
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => runUpdate({ p_delivered: false })}
                    className="font-mono text-[11px] text-muted underline hover:text-ink cursor-pointer px-1"
                  >
                    Desmarcar entrega
                  </button>
                </>
              )}

              {!migrationMissing && stage === 'inactive' && kit.business_active !== false && (
                <HardButton size="sm" variant="teal" disabled={busy} onClick={() => runUpdate({ p_active: true })}>
                  <Power size={13} /> Reactivar soporte
                </HardButton>
              )}
            </div>

            {!migrationMissing && kit.active && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (!window.confirm(`¿Desactivar el soporte de "${kit.business_name} · ${kit.branch_name}"? Su QR y NFC dejarán de funcionar al instante.`)) return;
                  runUpdate({ p_active: false, p_nfc_status: 'inactive' });
                }}
                className="font-mono text-[11px] text-muted underline hover:text-alert-red cursor-pointer disabled:opacity-50"
              >
                Desactivar soporte
              </button>
            )}
          </div>

          {error && <Alert variant="error">{error}</Alert>}
        </div>
      </div>

      <div ref={canvasWrapRef} className="hidden" aria-hidden="true">
        <QRCodeCanvas value={url} size={1024} level="M" marginSize={4} fgColor="#1A1D29" bgColor="#FFFFFF" />
      </div>
    </article>
  );
}
