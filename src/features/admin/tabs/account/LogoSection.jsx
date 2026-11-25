import React, { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import HardButton from '../../../../components/ui/HardButton';
import Alert from '../../../../components/ui/Alert';
import Stamp from '../../../../components/ui/Stamp';
import BusinessLogo from '../../../../components/branding/BusinessLogo';
import { getMonogram } from '../../../../lib/utils';
import { uploadBusinessLogo, removeBusinessLogo } from '../../../../lib/logoUpload';

export default function LogoSection({ business, isAdmin, onSaved }) {
  const logoInputRef = useRef(null);
  const [logoStatus, setLogoStatus] = useState({ busy: false, error: '', ok: '' });

  async function handleLogoSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !isAdmin || logoStatus.busy) return;

    setLogoStatus({ busy: true, error: '', ok: '' });
    try {
      await uploadBusinessLogo(business.id, file);
      await onSaved();
      setLogoStatus({
        busy: false,
        error: '',
        ok: 'Logo actualizado. Ya aparece en tu panel y en el ticket digital que ven tus clientes.'
      });
    } catch (err) {
      setLogoStatus({ busy: false, error: err?.message || 'No pudimos subir el logo.', ok: '' });
    }
  }

  async function handleRemoveLogo() {
    if (!isAdmin || !business.logo_url || logoStatus.busy) return;
    if (!window.confirm('¿Quitar el logo y volver a mostrar las iniciales de tu negocio?')) return;

    setLogoStatus({ busy: true, error: '', ok: '' });
    try {
      await removeBusinessLogo(business.id);
      await onSaved();
      setLogoStatus({
        busy: false,
        error: '',
        ok: `Logo quitado. Se muestran nuevamente las iniciales (${getMonogram(business.name)}).`
      });
    } catch (err) {
      setLogoStatus({ busy: false, error: err?.message || 'No pudimos quitar el logo.', ok: '' });
    }
  }

  return (
    <section className="bg-paper border-[1.5px] border-ink p-4 sm:p-5 shadow-hard-line">
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1 w-full">
          <BusinessLogo name={business.name} logoUrl={business.logo_url} size={72} />
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold">Logo del formulario y panel</h2>
              <Stamp variant={business.logo_url ? 'teal' : 'amber'}>
                {business.logo_url ? 'Logo activo' : `Usando iniciales (${getMonogram(business.name)})`}
              </Stamp>
            </div>
            <p className="text-xs text-muted leading-relaxed max-w-2xl">
              {business.logo_url
                ? 'Tu logo se muestra automáticamente en el ticket digital que ven tus clientes, la pantalla de Google y este panel.'
                : 'Subí el logo de tu marca para personalizar el ticket digital que ven tus clientes y este panel. Si preferís no subir uno, seguimos mostrando tus iniciales.'}
            </p>
            <p className="font-mono text-[11px] text-muted">
              PNG, JPG o WebP · mínimo 64×64 px · máx. 5 MB (se optimiza automáticamente).
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleLogoSelected}
              className="hidden"
              aria-label="Seleccionar archivo de logo"
            />
            <HardButton
              size="sm"
              variant={business.logo_url ? 'secondary' : 'teal'}
              disabled={logoStatus.busy}
              onClick={() => logoInputRef.current?.click()}
            >
              <ImagePlus size={14} />
              {logoStatus.busy ? 'SUBIENDO...' : business.logo_url ? 'Cambiar logo' : 'Subir logo'}
            </HardButton>
            {business.logo_url && (
              <HardButton
                size="sm"
                variant="danger"
                disabled={logoStatus.busy}
                onClick={handleRemoveLogo}
              >
                <Trash2 size={14} /> Quitar logo
              </HardButton>
            )}
          </div>
        )}
      </div>

      {!isAdmin && (
        <p className="font-mono text-[11px] text-muted mt-3">
          Solo el administrador del negocio puede cargar o cambiar el logo.
        </p>
      )}
      {logoStatus.error && <Alert variant="error" className="mt-3">{logoStatus.error}</Alert>}
      {logoStatus.ok && <Alert variant="success" className="mt-3">{logoStatus.ok}</Alert>}
    </section>
  );
}
