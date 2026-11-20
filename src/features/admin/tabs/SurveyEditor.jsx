import React, { useCallback, useEffect, useState } from 'react';
import { Plus, X, RotateCcw, Sparkles } from 'lucide-react';
import Field from '../../../components/ui/Field';
import HardButton from '../../../components/ui/HardButton';
import Alert from '../../../components/ui/Alert';
import TicketCard from '../../../components/ui/TicketCard';
import BusinessLogo from '../../../components/branding/BusinessLogo';
import { supabase } from '../../../lib/supabaseClient';
import { getErrorMessage } from '../../../lib/errors';
import { DEFAULT_SURVEY, DEFAULT_TAGS, SURVEY_PRESETS, resolveSurveyConfig } from '../../../lib/surveyConfig';
import { validateSurveyTag, validateSurveyText } from '../../../lib/validators';

const MAX_TAGS = 12;

export default function SurveyEditor({ business, isAdmin }) {
  const [loading, setLoading] = useState(true);
  const [migrationMissing, setMigrationMissing] = useState(false);
  const [rowIds, setRowIds] = useState({ stars: null, tags: null, text: null });

  const [starsQuestion, setStarsQuestion] = useState(DEFAULT_SURVEY.starsQuestion);
  const [tagsEnabled, setTagsEnabled] = useState(true);
  const [tagsQuestion, setTagsQuestion] = useState('¿Qué aspecto querés destacar o mejorar?');
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [newTag, setNewTag] = useState('');

  const [commentEnabled, setCommentEnabled] = useState(true);
  const [commentQuestion, setCommentQuestion] = useState(DEFAULT_SURVEY.commentQuestion);
  const [commentPlaceholder, setCommentPlaceholder] = useState(DEFAULT_SURVEY.commentPlaceholder);

  const [status, setStatus] = useState({ saving: false, error: '', ok: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setMigrationMissing(false);
    setStatus({ saving: false, error: '', ok: '' });

    const { data, error } = await supabase
      .from('survey_questions')
      .select('id, type, question_text, options, placeholder, active, order_index')
      .eq('business_id', business.id)
      .order('order_index', { ascending: true });

    if (error) {
      if (error.code === '42703' || /options|placeholder|active/i.test(error.message || '')) {
        setMigrationMissing(true);
      } else {
        setStatus({ saving: false, error: getErrorMessage(error, 'No pudimos cargar las preguntas.'), ok: '' });
      }
      setLoading(false);
      return;
    }

    const rows = data || [];
    const byType = {};
    for (const r of rows) {
      if (!byType[r.type]) byType[r.type] = r;
    }
    setRowIds({
      stars: byType.stars?.id || null,
      tags: byType.tags?.id || null,
      text: byType.text?.id || null
    });

    if (rows.length > 0) {
      const cfg = resolveSurveyConfig(rows);
      setStarsQuestion(cfg.starsQuestion);
      setTagsEnabled(byType.tags ? byType.tags.active !== false : true);
      setTagsQuestion(byType.tags?.question_text || '¿Qué aspecto querés destacar o mejorar?');
      setTags(byType.tags?.options?.length ? byType.tags.options : DEFAULT_TAGS);
      setCommentEnabled(byType.text ? byType.text.active !== false : true);
      setCommentQuestion(cfg.commentQuestion);
      setCommentPlaceholder(cfg.commentPlaceholder);
    } else {
      setStarsQuestion(DEFAULT_SURVEY.starsQuestion);
      setTagsEnabled(true);
      setTagsQuestion('¿Qué aspecto querés destacar o mejorar?');
      setTags(DEFAULT_TAGS);
      setCommentEnabled(true);
      setCommentQuestion(DEFAULT_SURVEY.commentQuestion);
      setCommentPlaceholder(DEFAULT_SURVEY.commentPlaceholder);
    }
    setLoading(false);
  }, [business.id]);

  useEffect(() => { load(); }, [load]);

  function addTag() {
    const tagRes = validateSurveyTag(newTag);
    if (!tagRes.valid) {
      setStatus({ saving: false, error: tagRes.error, ok: '' });
      return;
    }
    if (tags.length >= MAX_TAGS) {
      setStatus({ saving: false, error: `Podés tener hasta ${MAX_TAGS} aspectos en el formulario.`, ok: '' });
      return;
    }
    if (tags.some(t => t.toLowerCase() === tagRes.value.toLowerCase())) {
      setStatus({ saving: false, error: 'Ese aspecto ya está en la lista.', ok: '' });
      return;
    }
    setTags(prev => [...prev, tagRes.value]);
    setNewTag('');
    setStatus(s => ({ ...s, error: '', ok: '' }));
  }

  function removeTag(tag) {
    setTags(prev => prev.filter(t => t !== tag));
    setStatus(s => ({ ...s, ok: '' }));
  }

  function applyPreset(preset) {
    setStarsQuestion(preset.starsQuestion);
    setTagsEnabled(true);
    setTagsQuestion(preset.tagsQuestion);
    setTags([...preset.tags]);
    setCommentEnabled(true);
    setCommentQuestion(preset.commentQuestion);
    setCommentPlaceholder(preset.commentPlaceholder);
    setStatus({ saving: false, error: '', ok: '' });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!isAdmin || status.saving) return;

    const starsRes = validateSurveyText(starsQuestion, { required: true, min: 2, max: 160, label: 'La pregunta principal' });
    if (!starsRes.valid) {
      return setStatus({ saving: false, error: starsRes.error, ok: '' });
    }
    const tagsQRes = validateSurveyText(tagsQuestion || '¿Qué aspecto querés destacar o mejorar?', { required: true, min: 2, max: 160, label: 'La pregunta de aspectos' });
    if (tagsEnabled && !tagsQRes.valid) {
      return setStatus({ saving: false, error: tagsQRes.error, ok: '' });
    }
    const cleanTags = tags.map(t => t.trim().slice(0, 30)).filter(Boolean);
    if (tagsEnabled && cleanTags.length === 0) {
      return setStatus({ saving: false, error: 'Agregá al menos un aspecto o desactivá la sección de aspectos.', ok: '' });
    }
    for (const t of cleanTags) {
      const tr = validateSurveyTag(t);
      if (!tr.valid) return setStatus({ saving: false, error: `Aspecto inválido ("${t}"): ${tr.error}`, ok: '' });
    }
    const commentQRes = validateSurveyText(commentQuestion || DEFAULT_SURVEY.commentQuestion, { required: true, min: 2, max: 160, label: 'El título del comentario' });
    if (commentEnabled && !commentQRes.valid) {
      return setStatus({ saving: false, error: commentQRes.error, ok: '' });
    }
    const placeholderRes = validateSurveyText(commentPlaceholder || DEFAULT_SURVEY.commentPlaceholder, { required: false, min: 2, max: 160, label: 'El texto de ayuda' });
    if (commentEnabled && !placeholderRes.valid) {
      return setStatus({ saving: false, error: placeholderRes.error, ok: '' });
    }

    const cleanStars = starsRes.value;
    const cleanTagsQ = tagsQRes.value;
    const cleanCommentQ = commentQRes.value;
    const cleanPlaceholder = placeholderRes.value || DEFAULT_SURVEY.commentPlaceholder;

    setStatus({ saving: true, error: '', ok: '' });
    try {
      const specs = [
        {
          key: 'stars',
          type: 'stars',
          order_index: 1,
          question_text: cleanStars,
          options: [],
          placeholder: null,
          active: true
        },
        {
          key: 'tags',
          type: 'tags',
          order_index: 2,
          question_text: cleanTagsQ,
          options: cleanTags,
          placeholder: null,
          active: tagsEnabled
        },
        {
          key: 'text',
          type: 'text',
          order_index: 3,
          question_text: cleanCommentQ,
          options: [],
          placeholder: cleanPlaceholder,
          active: commentEnabled
        }
      ];

      const nextIds = { ...rowIds };
      for (const spec of specs) {
        const existingId = rowIds[spec.key];
        if (existingId) {
          const { error } = await supabase
            .from('survey_questions')
            .update({
              question_text: spec.question_text,
              options: spec.options,
              placeholder: spec.placeholder,
              active: spec.active,
              order_index: spec.order_index
            })
            .eq('id', existingId);
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from('survey_questions')
            .insert({
              business_id: business.id,
              type: spec.type,
              question_text: spec.question_text,
              options: spec.options,
              placeholder: spec.placeholder,
              active: spec.active,
              order_index: spec.order_index
            })
            .select('id')
            .single();
          if (error) throw error;
          nextIds[spec.key] = data.id;
        }
      }

      setRowIds(nextIds);
      setStatus({
        saving: false,
        error: '',
        ok: 'Preguntas guardadas. Los clientes ya ven tu formulario actualizado al escanear el QR o NFC.'
      });
    } catch (err) {
      setStatus({ saving: false, error: getErrorMessage(err, 'No pudimos guardar las preguntas.'), ok: '' });
    }
  }

  async function handleReset() {
    if (!isAdmin || status.saving) return;
    if (!window.confirm('¿Restaurar las preguntas predeterminadas de Latido?')) return;
    setStatus({ saving: true, error: '', ok: '' });
    try {
      const { error } = await supabase.from('survey_questions').delete().eq('business_id', business.id);
      if (error) throw error;
      await load();
      setStatus({ saving: false, error: '', ok: 'Se restauraron las preguntas predeterminadas.' });
    } catch (err) {
      setStatus({ saving: false, error: getErrorMessage(err, 'No pudimos restaurar las preguntas.'), ok: '' });
    }
  }

  if (loading) {
    return <div className="h-64 bg-paper-dim border border-line-gray animate-pulse" />;
  }

  if (migrationMissing) {
    return (
      <Alert variant="warning" title="Migración pendiente">
        Para personalizar las preguntas del formulario, aplicá la migración <code>010_encuesta_y_gestion_completa.sql</code> en Supabase SQL Editor.
      </Alert>
    );
  }

  const disabled = !isAdmin || status.saving;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
      <form onSubmit={handleSave} className="bg-paper border border-line-gray p-5 shadow-hard-line space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-line-gray">
          <div>
            <h2 className="text-lg font-bold">Preguntas del formulario (ticket)</h2>
            <p className="text-xs text-muted mt-0.5">
              Personalizá lo que ven tus clientes cuando escanean el QR o acercan el celular al chip NFC.
            </p>
          </div>
          {isAdmin && (
            <button type="button" onClick={handleReset} disabled={status.saving}
              className="inline-flex items-center gap-1.5 font-mono text-xs text-muted hover:text-ink underline cursor-pointer">
              <RotateCcw size={13} /> Restaurar predeterminadas
            </button>
          )}
        </div>

        {!isAdmin && <Alert variant="info">Solo el administrador del negocio puede modificar el formulario.</Alert>}

        {/* Plantillas por rubro */}
        {isAdmin && (
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
              <Sparkles size={12} className="text-teal" /> Plantillas rápidas por rubro
            </div>
            <div className="flex flex-wrap gap-2">
              {SURVEY_PRESETS.map(p => (
                <button key={p.id} type="button" onClick={() => applyPreset(p)}
                  className="font-mono text-xs px-2.5 py-1.5 bg-paper-dim border border-line-gray hover:border-ink hover:bg-paper cursor-pointer transition-colors">
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
            value={starsQuestion}
            onChange={e => { setStarsQuestion(e.target.value); setStatus(s => ({ ...s, ok: '' })); }}
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
              <input type="checkbox" checked={tagsEnabled} disabled={disabled}
                onChange={e => { setTagsEnabled(e.target.checked); setStatus(s => ({ ...s, ok: '' })); }} />
              Mostrar en el ticket
            </label>
          </div>

          {tagsEnabled && (
            <>
              <Field
                id="sq-tags-q"
                label="Pregunta sobre aspectos"
                value={tagsQuestion}
                onChange={e => { setTagsQuestion(e.target.value); setStatus(s => ({ ...s, ok: '' })); }}
                maxLength={160}
                disabled={disabled}
                placeholder="Ej: ¿Qué aspecto querés destacar o mejorar?"
              />

              <div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
                  Opciones ({tags.length}/{MAX_TAGS})
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 bg-paper-dim border border-ink">
                      <span>{tag}</span>
                      {isAdmin && (
                        <button type="button" onClick={() => removeTag(tag)} aria-label={`Quitar ${tag}`}
                          className="text-muted hover:text-alert-red cursor-pointer">
                          <X size={13} />
                        </button>
                      )}
                    </span>
                  ))}
                  {tags.length === 0 && (
                    <span className="font-mono text-xs text-muted italic">Sin opciones todavía. Agregá una abajo.</span>
                  )}
                </div>

                {isAdmin && tags.length < MAX_TAGS && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      maxLength={30}
                      onChange={e => setNewTag(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      placeholder="Ej: Estacionamiento, Música, Delivery..."
                      className="flex-1 bg-paper border-[1.5px] border-ink px-2.5 py-2 text-sm rounded-none outline-none focus:border-teal"
                    />
                    <HardButton size="sm" variant="secondary" onClick={addTag}>
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
              <input type="checkbox" checked={commentEnabled} disabled={disabled}
                onChange={e => { setCommentEnabled(e.target.checked); setStatus(s => ({ ...s, ok: '' })); }} />
              Mostrar en el ticket
            </label>
          </div>

          {commentEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field
                id="sq-comment-q"
                label="Título del campo"
                value={commentQuestion}
                onChange={e => { setCommentQuestion(e.target.value); setStatus(s => ({ ...s, ok: '' })); }}
                maxLength={160}
                disabled={disabled}
                placeholder="Comentario (opcional)"
              />
              <Field
                id="sq-comment-ph"
                label="Texto de ayuda dentro del recuadro"
                value={commentPlaceholder}
                onChange={e => { setCommentPlaceholder(e.target.value); setStatus(s => ({ ...s, ok: '' })); }}
                maxLength={160}
                disabled={disabled}
                placeholder="Contanos algo más si querés..."
              />
            </div>
          )}
        </div>

        {status.error && <Alert variant="error">{status.error}</Alert>}
        {status.ok && <Alert variant="success">{status.ok}</Alert>}

        {isAdmin && (
          <HardButton type="submit" disabled={status.saving}>
            {status.saving ? 'GUARDANDO...' : 'GUARDAR PREGUNTAS'}
          </HardButton>
        )}
      </form>

      {/* Vista previa en vivo del ticket */}
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
    </div>
  );
}
