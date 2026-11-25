import React, { useRef, useState } from 'react';
import { Building2, ExternalLink, ImagePlus, Trash2 } from 'lucide-react';
import Stamp from '../../../components/ui/Stamp';
import { getErrorMessage } from '../../../lib/errors';
import { formatDateTime, formatMoney, formatRelative } from '../../../lib/utils';
import { removeBusinessLogo, uploadBusinessLogo } from '../../../lib/logoUpload';
import { DEST_LABELS } from './diagnosticsHelpers';

export default function BusinessConfigSection({ business, businessId, onReload }) {
  const logoInputRef = useRef(null);
  const [logoStatus, setLogoStatus] = useState({ busy: false, error: '', ok: '' });

  const b = business;
  const destInfo = DEST_LABELS[b.review_destination] || DEST_LABELS.panel;

  async function handleLogoSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !businessId) return;
    setLogoStatus({ busy: true, error: '', ok: '' });
    try {
      await uploadBusinessLogo(businessId, file);
      await onReload();
      setLogoStatus({ busy: false, error: '', ok: 'Logo cargado. Ya se ve en el ticket digital y en la lámina HD.' });
    } catch (err) {
      setLogoStatus({ busy: false, error: getErrorMessage(err, 'No pudimos subir el logo.'), ok: '' });
    }
  }

  async function handleRemoveLogo() {
    if (!businessId) return;
    setLogoStatus({ busy: true, error: '', ok: '' });
    try {
      await removeBusinessLogo(businessId);
      await onReload();
      setLogoStatus({ busy: false, error: '', ok: 'Logo quitado. El local volvió a sus iniciales.' });
    } catch (err) {
      setLogoStatus({ busy: false, error: getErrorMessage(err, 'No pudimos quitar el logo.'), ok: '' });
    }
  }

  return (
    <section className="bg-paper border border-line-gray p-4 space-y-2.5">
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted font-bold">
        <Building2 size={14} className="text-teal" /> Configuración del local
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
        <div className="bg-paper-dim/70 border border-line-gray p-2.5">
          <dt className="text-[10px] uppercase text-muted">Destino de reseñas</dt>
          <dd className="mt-1 flex items-center gap-2 flex-wrap">
            <Stamp variant={destInfo.variant}>{destInfo.label}</Stamp>
            {b.has_google_url && b.google_review_url && (
              <a
                href={b.google_review_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal underline inline-flex items-center gap-1"
              >
                Ver link Google <ExternalLink size={11} />
              </a>
            )}
          </dd>
        </div>

        <div className="bg-paper-dim/70 border border-line-gray p-2.5 space-y-2">
          <dt className="text-[10px] uppercase text-muted">Logo del formulario y lámina HD</dt>
          <dd className="text-ink">
            <div>
              {b.logo_url ? 'Logo propio activo' : 'Sin logo (usa iniciales)'} ·{' '}
              {b.has_custom_survey ? 'Encuesta personalizada' : 'Preguntas por defecto'}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleLogoSelected}
                className="hidden"
                aria-label="Subir logo del negocio"
              />
              <button
                type="button"
                disabled={logoStatus.busy}
                onClick={() => logoInputRef.current?.click()}
                className="inline-flex items-center gap-1 font-mono text-[10.5px] font-bold uppercase tracking-wider px-2 py-1 border border-teal bg-teal/10 text-teal hover:bg-teal hover:text-paper transition-colors cursor-pointer disabled:opacity-50"
              >
                <ImagePlus size={11} />
                {logoStatus.busy ? 'Subiendo...' : b.logo_url ? 'Cambiar logo' : 'Subir logo'}
              </button>
              {b.logo_url && (
                <button
                  type="button"
                  disabled={logoStatus.busy}
                  onClick={handleRemoveLogo}
                  className="inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-wider px-2 py-1 border border-alert-red/60 text-alert-red hover:bg-alert-red/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 size={11} /> Quitar
                </button>
              )}
            </div>
            {logoStatus.error && <p className="text-[11px] text-alert-red mt-1.5">{logoStatus.error}</p>}
            {logoStatus.ok && <p className="text-[11px] text-teal mt-1.5">{logoStatus.ok}</p>}
          </dd>
        </div>

        <div className="bg-paper-dim/70 border border-line-gray p-2.5">
          <dt className="text-[10px] uppercase text-muted">Ticket promedio y firma</dt>
          <dd className="mt-1 text-ink">
            {formatMoney(b.avg_ticket_value, b.currency)} · Firma: {b.manager_name || 'Sin definir'}
          </dd>
        </div>

        <div className="bg-paper-dim/70 border border-line-gray p-2.5">
          <dt className="text-[10px] uppercase text-muted">Último acceso del dueño</dt>
          <dd className="mt-1 text-ink">
            {b.owner_last_sign_in_at
              ? `${formatRelative(b.owner_last_sign_in_at)} (${formatDateTime(b.owner_last_sign_in_at)})`
              : 'Todavía nunca ingresó al panel'}
          </dd>
        </div>
      </dl>
    </section>
  );
}
