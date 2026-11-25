import React from 'react';
import { QrCode } from 'lucide-react';
import BranchNameEditor from '../../../components/ui/BranchNameEditor';
import { formatRelative } from '../../../lib/utils';
import SuperQrKitRow from './SuperQrKitRow';

export default function BranchesKitsSection({ branches, qrList, business, kitsRpcReady, onReload }) {
  if (!branches.length) return null;

  return (
    <section className="bg-paper border border-line-gray p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted font-bold">
          <QrCode size={14} className="text-teal" /> Sucursales y kits físicos ({branches.length})
        </div>
        <span className="font-mono text-[10px] text-muted">Uso interno · QR + NTAG213</span>
      </div>

      <div className="divide-y divide-dashed divide-line-gray">
        {branches.map((br) => {
          const branchQrs = qrList.filter(q => q.branch_id === br.branch_id);
          return (
            <div key={br.branch_id} className="py-3 first:pt-0 last:pb-0 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-ink">
                    <BranchNameEditor
                      branchId={br.branch_id}
                      name={br.name}
                      canEdit
                      onSaved={onReload}
                      textClassName="font-bold text-sm text-ink"
                    />
                  </div>
                  <div className="font-mono text-[11px] text-muted mt-0.5 flex flex-wrap gap-x-2.5">
                    <span>Soportes activos: <strong className="text-ink">{br.qr_active}/{br.qr_total}</strong></span>
                  </div>
                </div>
                <div className="font-mono text-right text-[11px]">
                  <div>
                    <strong>{br.responses_30d}</strong> op. (30d) ·{' '}
                    <strong className="text-amber-ink">{br.avg_stars_30d ? `★ ${br.avg_stars_30d}` : '—'}</strong>
                  </div>
                  <div className="text-[10px] text-muted">
                    {br.last_response_at ? `Última ${formatRelative(br.last_response_at)}` : 'Sin opiniones aún'}
                  </div>
                </div>
              </div>
              {branchQrs.map((qr) => (
                <SuperQrKitRow
                  key={qr.id}
                  qr={qr}
                  businessName={business.name}
                  branchName={br.name}
                  logoUrl={business.logo_url}
                  kitsRpcReady={kitsRpcReady}
                  onUpdated={onReload}
                />
              ))}
            </div>
          );
        })}
      </div>

      <p className="font-mono text-[10.5px] text-muted pt-2 border-t border-dashed border-line-gray leading-relaxed">
        Armado de kit: imprimí la lámina HD o el QR (PNG) junto al logo del local y grabá su URL en el chip <strong>NTAG213</strong> con <strong>NFC Tools</strong> (Escribir → Agregar registro → URL).
      </p>
    </section>
  );
}
