import React from 'react';
import { Plus, X, RotateCcw, Sparkles } from 'lucide-react';
import Field from '../../../components/ui/Field';
import HardButton from '../../../components/ui/HardButton';
import Alert from '../../../components/ui/Alert';
import { SURVEY_PRESETS } from '../../../lib/surveyConfig';
import { MAX_TAGS, useSurveyEditor } from './survey/useSurveyEditor';
import SurveyTicketPreview from './survey/SurveyTicketPreview';

export default function SurveyEditor({ business, isAdmin }) {
  const ed = useSurveyEditor(business.id, isAdmin);

  if (ed.loading) {
    return <div className="h-64 bg-paper-dim border border-line-gray animate-pulse" />;
  }

  if (ed.migrationMissing) {
    return (
      <Alert variant="warning" title="Migración pendiente">
        Para personalizar las preguntas del formulario, aplicá la migración <code>010_encuesta_y_gestion_completa.sql</code> en Supabase SQL Editor.
      </Alert>
    );
  }

  const disabled = !isAdmin || ed.status.saving;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
      <form onSubmit={ed.handleSave} className="bg-paper border border-line-gray p-4 sm:p-5 shadow-hard-line space-y-6 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-line-gray">
          <div>
            <h2 className="text-lg font-bold">Preguntas del formulario (ticket)</h2>
            <p className="text-xs text-muted mt-0.5">
              Personalizá lo que ven tus clientes cuando escanean el QR o acercan el celular al chip NFC.
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={ed.handleReset}
              disabled={ed.status.saving}
              className="inline-flex items-center gap-1.5 font-mono text-xs text-muted hover:text-ink underline cursor-pointer"
            >
              <RotateCcw size={13} /> Restaurar predeterminadas
            </button>
          )}
        </div>

        {!isAdmin && <Alert variant="info">Solo el administrador del negocio puede modificar el formulario.</Alert>}

        {isAdmin && (
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
              <Sparkles size={12} className="text-teal" /> Plantillas rápidas por rubro
            </div>
            <div className="flex flex-wrap gap-2">
              {SURVEY_PRESETS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => ed.applyPreset(p)}
                  className="font-mono text-xs px-2.5 py-1.5 bg-paper-dim border border-line-gray hover:border-ink hover:bg-paper cursor-pointer transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 1. Pregunta principal */}
        <div className="space-y-2">
          <div className="font-mono text-[11px] uppercase tracking-wider text-teal font-bold">
            1. Pregunta principal (calificación 1 a 5 estrellas)
          </div>
          <Field
            id="sq-stars"
            value={ed.starsQuestion}
            onChange={e => ed.setStarsQuestion(e.target.value)}
            maxLength={160}
            disabled={disabled}
            placeholder="Ej: ¿Cómo fue tu experiencia hoy?"
            required
          />
        </div>

        {/* 2. Aspectos / etiquetas */}
        <div className="pt-4 border-t border-dashed border-line-gray space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="font-mono text-[11px] uppercase tracking-wider text-teal font-bold">
              2. Aspectos clicables (etiquetas)
            </div>
            <label className="inline-flex items-center gap-2 font-mono text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={ed.tagsEnabled}
                disabled={disabled}
                onChange={e => ed.setTagsEnabled(e.target.checked)}
              />
              Mostrar en el ticket
            </label>
          </div>

          {ed.tagsEnabled && (
            <>
              <Field
                id="sq-tags-q"
                label="Pregunta sobre aspectos"
                value={ed.tagsQuestion}
                onChange={e => ed.setTagsQuestion(e.target.value)}
                maxLength={160}
                disabled={disabled}
                placeholder="Ej: ¿Qué aspecto querés destacar o mejorar?"
              />

              <div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
                  Opciones ({ed.tags.length}/{MAX_TAGS})
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {ed.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 bg-paper-dim border border-ink">
                      <span>{tag}</span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => ed.removeTag(tag)}
                          aria-label={`Quitar ${tag}`}
                          className="text-muted hover:text-alert-red cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </span>
                  ))}
                  {ed.tags.length === 0 && (
                    <span className="font-mono text-xs text-muted italic">Sin opciones todavía. Agregá una abajo.</span>
                  )}
                </div>

                {isAdmin && ed.tags.length < MAX_TAGS && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={ed.newTag}
                      maxLength={30}
                      onChange={e => ed.setNewTag(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); ed.addTag(); } }}
                      placeholder="Ej: Estacionamiento, Música, Delivery..."
                      className="flex-1 min-w-0 min-h-[44px] bg-paper text-ink border-[1.5px] border-ink px-3 py-2 text-base sm:text-sm rounded-none outline-none focus:border-teal"
                    />
                    <HardButton size="sm" variant="secondary" onClick={ed.addTag} className="sm:min-h-[44px] shrink-0">
                      <Plus size={14} /> Agregar
                    </HardButton>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 3. Comentario libre */}
        <div className="pt-4 border-t border-dashed border-line-gray space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="font-mono text-[11px] uppercase tracking-wider text-teal font-bold">
              3. Campo de comentario libre
            </div>
            <label className="inline-flex items-center gap-2 font-mono text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={ed.commentEnabled}
                disabled={disabled}
                onChange={e => ed.setCommentEnabled(e.target.checked)}
              />
              Mostrar en el ticket
            </label>
          </div>

          {ed.commentEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field
                id="sq-comment-q"
                label="Título del campo"
                value={ed.commentQuestion}
                onChange={e => ed.setCommentQuestion(e.target.value)}
                maxLength={160}
                disabled={disabled}
                placeholder="Comentario (opcional)"
              />
              <Field
                id="sq-comment-ph"
                label="Texto de ayuda dentro del recuadro"
                value={ed.commentPlaceholder}
                onChange={e => ed.setCommentPlaceholder(e.target.value)}
                maxLength={160}
                disabled={disabled}
                placeholder="Contanos algo más si querés..."
              />
            </div>
          )}
        </div>

        {ed.status.error && <Alert variant="error">{ed.status.error}</Alert>}
        {ed.status.ok && <Alert variant="success">{ed.status.ok}</Alert>}

        {isAdmin && (
          <HardButton type="submit" disabled={ed.status.saving}>
            {ed.status.saving ? 'GUARDANDO...' : 'GUARDAR PREGUNTAS'}
          </HardButton>
        )}
      </form>

      <SurveyTicketPreview
        business={business}
        starsQuestion={ed.starsQuestion}
        tagsEnabled={ed.tagsEnabled}
        tagsQuestion={ed.tagsQuestion}
        tags={ed.tags}
        commentEnabled={ed.commentEnabled}
        commentQuestion={ed.commentQuestion}
        commentPlaceholder={ed.commentPlaceholder}
      />
    </div>
  );
}
