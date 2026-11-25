import React, { useRef, useState } from 'react';
import { Check, Copy, Download, ExternalLink, FileImage, PackageCheck } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import Stamp from '../../../components/ui/Stamp';
import { supabase } from '../../../lib/supabaseClient';
import { getErrorMessage } from '../../../lib/errors';
import { buildFeedbackUrl, buildKitUrl } from '../../../lib/utils';
import { downloadPrintableKitPoster, downloadQrOnlyPng } from '../../../lib/kitPoster';

export default function SuperQrKitRow({ qr, businessName, branchName, logoUrl, kitsRpcReady, onUpdated }) {
  const url = buildKitUrl(qr.token);
  const testUrl = buildFeedbackUrl(qr.token);
  const canvasWrapRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [downloadingPoster, setDownloadingPoster] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silencioso si el navegador bloquea portapapeles
    }
  }

  function downloadPng() {
    const canvas = canvasWrapRef.current?.querySelector('canvas');
    downloadQrOnlyPng(canvas, businessName, branchName);
  }

  async function downloadPoster() {
    const canvas = canvasWrapRef.current?.querySelector('canvas');
    if (!canvas || downloadingPoster) return;
    setDownloadingPoster(true);
    try {
      await downloadPrintableKitPoster({ qrCanvas: canvas, businessName, branchName, logoUrl });
    } finally {
      setDownloadingPoster(false);
    }
  }

  async function updateKit(params) {
    setBusy(true);
    setErrMsg('');
    try {
      const { error: err } = await supabase.rpc('super_update_kit', { p_qr_id: qr.id, ...params });
      if (err) throw err;
      await onUpdated?.();
    } catch (err) {
      setErrMsg(getErrorMessage(err, 'No pudimos actualizar el kit.'));
    } finally {
      setBusy(false);
    }
  }

  const isDelivered = !!qr.delivered_at;
  const isProgrammed = qr.nfc_status === 'programmed' || isDelivered;

  return (
    <div className="mt-2 bg-paper-dim border border-line-gray p-2.5 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <code className="font-mono text-[10.5px] text-ink/85 break-all select-all min-w-0 flex-1">{url}</code>
        <div className="flex flex-wrap items-center gap-1 shrink-0">
          {!qr.active ? (
            <Stamp variant="red">Inactivo</Stamp>
          ) : isDelivered ? (
            <Stamp variant="teal">Entregado</Stamp>
          ) : isProgrammed ? (
            <Stamp variant="teal">NFC listo</Stamp>
          ) : (
            <Stamp variant="amber">Por armar</Stamp>
          )}
        </div>
      </div>

      {qr.kit_notes && (
        <p className="text-[11px] text-muted border-l-2 border-l-amber pl-2 break-words">{qr.kit_notes}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={downloadPoster}
          disabled={downloadingPoster}
          className="inline-flex items-center gap-1 font-mono text-[10.5px] font-bold uppercase tracking-wider px-2 py-1 border border-ink bg-ink text-paper hover:brightness-110 transition-colors cursor-pointer disabled:opacity-50"
        >
          <FileImage size={11} /> {downloadingPoster ? 'Generando...' : 'Lámina HD'}
        </button>
        <button
          type="button"
          onClick={downloadPng}
          className="inline-flex items-center gap-1 font-mono text-[10.5px] font-bold uppercase tracking-wider px-2 py-1 border border-teal bg-teal/10 text-teal hover:bg-teal hover:text-paper transition-colors cursor-pointer"
        >
          <Download size={11} /> Solo QR
        </button>
        <button
          type="button"
          onClick={copyUrl}
          className="inline-flex items-center gap-1 font-mono text-[10.5px] font-bold uppercase tracking-wider px-2 py-1 border border-ink bg-paper hover:bg-ink hover:text-paper transition-colors cursor-pointer"
        >
          {copied ? <><Check size={11} /> Copiada</> : <><Copy size={11} /> URL NFC</>}
        </button>
        <a
          href={testUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-wider px-2 py-1 border border-line-gray bg-paper text-muted hover:border-ink hover:text-ink transition-colors"
        >
          <ExternalLink size={11} /> Probar
        </a>
        {kitsRpcReady && qr.active && !isProgrammed && (
          <button
            type="button"
            disabled={busy}
            onClick={() => updateKit({ p_nfc_status: 'programmed' })}
            className="inline-flex items-center gap-1 font-mono text-[10.5px] font-bold uppercase tracking-wider px-2 py-1 border border-teal bg-teal text-paper hover:brightness-105 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Check size={11} /> NFC grabado
          </button>
        )}
        {kitsRpcReady && qr.active && isProgrammed && !isDelivered && (
          <button
            type="button"
            disabled={busy}
            onClick={() => updateKit({ p_delivered: true })}
            className="inline-flex items-center gap-1 font-mono text-[10.5px] font-bold uppercase tracking-wider px-2 py-1 border border-teal bg-teal text-paper hover:brightness-105 transition-colors cursor-pointer disabled:opacity-50"
          >
            <PackageCheck size={11} /> Marcar entregado
          </button>
        )}
      </div>

      {errMsg && <p className="text-[11px] text-alert-red font-mono">{errMsg}</p>}

      <div ref={canvasWrapRef} className="hidden" aria-hidden="true">
        <QRCodeCanvas value={url} size={1024} level="M" marginSize={4} fgColor="#1A1D29" bgColor="#FFFFFF" />
      </div>
    </div>
  );
}
