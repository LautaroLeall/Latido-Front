import React from 'react';
import TicketCard from '../../../../components/ui/TicketCard';
import BusinessLogo from '../../../../components/branding/BusinessLogo';
import { DEFAULT_SURVEY } from '../../../../lib/surveyConfig';

export default function SurveyTicketPreview({
  business,
  starsQuestion,
  tagsEnabled,
  tagsQuestion,
  tags,
  commentEnabled,
  commentQuestion,
  commentPlaceholder
}) {
  return (
    <div className="xl:sticky xl:top-6">
      <div className="font-mono text-[11px] uppercase tracking-wider text-muted mb-2">
        Vista previa del ticket del cliente
      </div>
      <TicketCard bodyClassName="px-5 py-4">
        <div className="flex justify-between font-mono text-muted text-[10px] mb-2.5">
          <span>TICKET DE OPINIÓN</span>
          <span>HOY</span>
        </div>
        <div className="flex items-center gap-2.5">
          <BusinessLogo name={business.name} logoUrl={business.logo_url} size={38} />
          <div className="min-w-0">
            <div className="font-bold text-base leading-tight truncate">{business.name}</div>
            <div className="font-mono text-[11px] text-muted">Sucursal</div>
          </div>
        </div>

        <div className="border-t-[1.5px] border-dashed border-line-gray my-3.5" />

        <div className="text-sm font-semibold">{starsQuestion || DEFAULT_SURVEY.starsQuestion}</div>
        <div className="flex gap-1 my-2 text-amber text-2xl leading-none select-none" aria-hidden="true">
          ★★★★☆
        </div>

        {tagsEnabled && (
          <div className="my-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted mb-1.5">
              {tagsQuestion || '¿Qué destacás?'} (opcional)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t, idx) => (
                <span key={t} className={`font-mono text-[11px] px-2 py-0.5 border ${idx === 0 ? 'border-teal text-teal bg-teal/10' : 'border-line-gray text-muted'}`}>
                  {idx === 0 ? '✓ ' : '+ '}{t}
                </span>
              ))}
            </div>
          </div>
        )}

        {commentEnabled && (
          <div className="mt-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted mb-1">
              {commentQuestion || DEFAULT_SURVEY.commentQuestion}
            </div>
            <div className="border border-ink bg-paper p-2 text-xs text-muted min-h-[54px]">
              {commentPlaceholder || DEFAULT_SURVEY.commentPlaceholder}
            </div>
          </div>
        )}

        <div className="mt-4 bg-ink text-paper text-center font-mono font-bold text-xs py-2.5 uppercase tracking-wider">
          ENVIAR OPINIÓN
        </div>
      </TicketCard>
    </div>
  );
}
