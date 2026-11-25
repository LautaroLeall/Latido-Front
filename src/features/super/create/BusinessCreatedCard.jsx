import React, { useRef, useState } from 'react';
import { Mail, MessageCircle, Copy, Check, Download, FileImage, QrCode, Nfc } from 'lucide-react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import HardButton from '../../../components/ui/HardButton';
import Stamp from '../../../components/ui/Stamp';
import Alert from '../../../components/ui/Alert';
import { downloadPrintableKitPoster, downloadQrOnlyPng } from '../../../lib/kitPoster';
import { buildGmailUrl, buildMailUrl } from '../../../lib/contact';
import { buildHandoffText } from './createBusinessHelpers';

export default function BusinessCreatedCard({ created, onReset, onClose, onOpenKits }) {
  const [copied, setCopied] = useState(false);
  const [copiedNfcUrl, setCopiedNfcUrl] = useState(false);
  const [downloadingPoster, setDownloadingPoster] = useState(false);
  const [copyError, setCopyError] = useState('');
  const qrCanvasRef = useRef(null);

  const handoffText = buildHandoffText(created);
  const subject = `Tus accesos a Latido · ${created.businessName}`;
  const waHref = created.ownerPhone
    ? `https://wa.me/${created.ownerPhone}?text=${encodeURIComponent(handoffText)}`
    : `https://wa.me/?text=${encodeURIComponent(handoffText)}`;
  const gmailHref = buildGmailUrl(subject, handoffText, created.email);
  const mailHref = buildMailUrl(subject, handoffText, created.email);

  async function copyCredentials() {
    setCopyError('');
    try {
      await navigator.clipboard.writeText(handoffText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyError('No pudimos copiar al portapapeles. Seleccioná los datos manualmente.');
    }
  }

  async function copyTicketUrl() {
    setCopyError('');
    try {
      await navigator.clipboard.writeText(created.ticketUrl);
      setCopiedNfcUrl(true);
      setTimeout(() => setCopiedNfcUrl(false), 2200);
    } catch {
      setCopyError('No pudimos copiar la URL. Seleccionala manualmente.');
    }
  }

  function downloadKitQr() {
    const canvas = qrCanvasRef.current?.querySelector('canvas');
    if (!canvas) return;
    downloadQrOnlyPng(canvas, created.businessName, created.branchName);
  }

  async function downloadKitPoster() {
    const canvas = qrCanvasRef.current?.querySelector('canvas');
    if (!canvas || downloadingPoster) return;
    setDownloadingPoster(true);
    try {
      await downloadPrintableKitPoster({
        qrCanvas: canvas,
        businessName: created.businessName,
        branchName: created.branchName,
        logoUrl: null
      });
    } finally {
      setDownloadingPoster(false);
    }
  }

  return (
    <div className="border-[1.5px] border-teal bg-paper p-5 shadow-[4px_4px_0_#1F6F64]">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-dashed border-line-gray">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Stamp variant="teal">NEGOCIO CREADO</Stamp>
          <h3 className="font-bold text-lg">{created.businessName}</h3>
        </div>
        <span className="font-mono text-xs text-muted">
          {created.planName} ({created.supportsLabel}) · {created.branchName}
        </span>
      </div>

      <p className="text-sm text-ink/80 mb-4">
        La cuenta ya está confirmada y lista para iniciar sesión en <code className="font-mono bg-paper-dim px-1">/login</code>.
        Enviá la invitación con las credenciales ahora: se abre siempre en una pestaña nueva para que no salgas del panel.
      </p>

      <dl className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 bg-paper-dim border border-line-gray p-4 font-mono text-xs mb-5">
        <div>
          <dt className="text-muted uppercase text-[10px]">Acceso al panel</dt>
          <dd className="mt-0.5 break-all">{created.loginUrl}</dd>
        </div>
        <div>
          <dt className="text-muted uppercase text-[10px]">Email ({created.ownerName})</dt>
          <dd className="mt-0.5 font-bold break-all">{created.email}</dd>
        </div>
        <div>
          <dt className="text-muted uppercase text-[10px]">Contraseña inicial</dt>
          <dd className="mt-0.5 font-bold text-amber-ink select-all">{created.password}</dd>
        </div>
        <div>
          <dt className="text-muted uppercase text-[10px]">Primer soporte (QR / NFC)</dt>
          <dd className="mt-0.5 break-all">
            <a href={created.ticketUrl} target="_blank" rel="noopener noreferrer" className="text-teal underline">
              {created.ticketUrl}
            </a>
          </dd>
        </div>
      </dl>

      {/* Herramienta interna Latido para armar el soporte físico */}
      <div className="bg-paper-dim border-[1.5px] border-dashed border-ink p-4 mb-5">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="bg-paper p-2 border border-line-gray shrink-0">
            <QRCodeSVG value={created.ticketUrl} size={96} level="M" fgColor="#1A1D29" bgColor="#FAF8F3" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-teal inline-flex items-center gap-1.5">
              <QrCode size={13} /> Preparación del kit físico (uso interno Latido)
            </span>
            <p className="text-xs text-ink/85 leading-relaxed">
              Armá el soporte del cliente con su logo, pegá este QR y grabá esta misma URL en el chip <strong>NTAG213</strong> con <strong>NFC Tools</strong> (<em>Escribir → Agregar registro → URL</em>) para entregárselo listo para usar.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <HardButton size="sm" variant="primary" onClick={downloadKitPoster} disabled={downloadingPoster}>
                <FileImage size={14} /> {downloadingPoster ? 'Generando...' : 'Lámina HD (10×15)'}
              </HardButton>
              <HardButton size="sm" variant="secondary" onClick={downloadKitQr}>
                <Download size={14} /> Solo QR (1024px)
              </HardButton>
              <HardButton size="sm" variant="secondary" onClick={copyTicketUrl}>
                {copiedNfcUrl ? <><Check size={14} /> URL copiada</> : <><Copy size={14} /> Copiar URL para NFC</>}
              </HardButton>
              {onOpenKits && (
                <HardButton size="sm" variant="teal" onClick={onOpenKits}>
                  <Nfc size={14} /> Ir a Kits y NFC
                </HardButton>
              )}
            </div>
          </div>
        </div>
        <div ref={qrCanvasRef} className="hidden" aria-hidden="true">
          <QRCodeCanvas value={created.ticketUrl} size={1024} level="M" marginSize={4} fgColor="#1A1D29" bgColor="#FFFFFF" />
        </div>
      </div>

      {copyError && <Alert variant="error" className="mb-4">{copyError}</Alert>}

      <div className="flex flex-wrap gap-2">
        <HardButton as="a" size="sm" variant="teal" href={waHref} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={14} /> Enviar por WhatsApp
        </HardButton>
        <HardButton as="a" size="sm" variant="primary" href={gmailHref} target="_blank" rel="noopener noreferrer">
          <Mail size={14} /> Enviar por Gmail
        </HardButton>
        <HardButton as="a" size="sm" variant="secondary" href={mailHref} target="_blank" rel="noopener noreferrer">
          <Mail size={14} /> Abrir app de correo
        </HardButton>
        <HardButton size="sm" variant="secondary" onClick={copyCredentials}>
          {copied ? <><Check size={14} /> Datos copiados</> : <><Copy size={14} /> Copiar invitación</>}
        </HardButton>
        <HardButton size="sm" variant="secondary" onClick={onReset}>
          + Crear otro negocio
        </HardButton>
        {onClose && (
          <HardButton size="sm" variant="secondary" onClick={onClose}>
            Ver negocios
          </HardButton>
        )}
      </div>
    </div>
  );
}
