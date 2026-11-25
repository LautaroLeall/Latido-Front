import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { getErrorMessage } from '../../../../lib/errors';
import { DEFAULT_SURVEY, DEFAULT_TAGS, resolveSurveyConfig } from '../../../../lib/surveyConfig';
import { validateSurveyTag, validateSurveyText } from '../../../../lib/validators';

export const MAX_TAGS = 12;

export function useSurveyEditor(businessId, isAdmin) {
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

  const clearOk = () => setStatus(s => ({ ...s, ok: '' }));

  const load = useCallback(async (isCancelled = () => false) => {
    setLoading(true);
    setMigrationMissing(false);
    setStatus({ saving: false, error: '', ok: '' });

    try {
      const { data, error } = await supabase
        .from('survey_questions')
        .select('id, type, question_text, options, placeholder, active, order_index')
        .eq('business_id', businessId)
        .order('order_index', { ascending: true });

      if (isCancelled()) return;

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
    } catch (err) {
      if (isCancelled()) return;
      setStatus({ saving: false, error: getErrorMessage(err, 'No pudimos cargar las preguntas.'), ok: '' });
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    let cancelled = false;
    load(() => cancelled);
    return () => { cancelled = true; };
  }, [load]);

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
    clearOk();
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
    if (!starsRes.valid) return setStatus({ saving: false, error: starsRes.error, ok: '' });

    const tagsQRes = validateSurveyText(tagsQuestion || '¿Qué aspecto querés destacar o mejorar?', { required: true, min: 2, max: 160, label: 'La pregunta de aspectos' });
    if (tagsEnabled && !tagsQRes.valid) return setStatus({ saving: false, error: tagsQRes.error, ok: '' });

    const cleanTags = tags.map(t => t.trim().slice(0, 30)).filter(Boolean);
    if (tagsEnabled && cleanTags.length === 0) {
      return setStatus({ saving: false, error: 'Agregá al menos un aspecto o desactivá la sección de aspectos.', ok: '' });
    }
    for (const t of cleanTags) {
      const tr = validateSurveyTag(t);
      if (!tr.valid) return setStatus({ saving: false, error: `Aspecto inválido ("${t}"): ${tr.error}`, ok: '' });
    }

    const commentQRes = validateSurveyText(commentQuestion || DEFAULT_SURVEY.commentQuestion, { required: true, min: 2, max: 160, label: 'El título del comentario' });
    if (commentEnabled && !commentQRes.valid) return setStatus({ saving: false, error: commentQRes.error, ok: '' });

    const placeholderRes = validateSurveyText(commentPlaceholder || DEFAULT_SURVEY.commentPlaceholder, { required: false, min: 2, max: 160, label: 'El texto de ayuda' });
    if (commentEnabled && !placeholderRes.valid) return setStatus({ saving: false, error: placeholderRes.error, ok: '' });

    setStatus({ saving: true, error: '', ok: '' });
    try {
      const specs = [
        { key: 'stars', type: 'stars', order_index: 1, question_text: starsRes.value, options: [], placeholder: null, active: true },
        { key: 'tags', type: 'tags', order_index: 2, question_text: tagsQRes.value, options: cleanTags, placeholder: null, active: tagsEnabled },
        { key: 'text', type: 'text', order_index: 3, question_text: commentQRes.value, options: [], placeholder: placeholderRes.value || DEFAULT_SURVEY.commentPlaceholder, active: commentEnabled }
      ];

      const results = await Promise.all(
        specs.map(async (spec) => {
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
            return [spec.key, existingId];
          }
          const { data, error } = await supabase
            .from('survey_questions')
            .insert({
              business_id: businessId,
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
          return [spec.key, data.id];
        })
      );

      setRowIds(Object.fromEntries(results));
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
      const { error } = await supabase.from('survey_questions').delete().eq('business_id', businessId);
      if (error) throw error;
      await load();
      setStatus({ saving: false, error: '', ok: 'Se restauraron las preguntas predeterminadas.' });
    } catch (err) {
      setStatus({ saving: false, error: getErrorMessage(err, 'No pudimos restaurar las preguntas.'), ok: '' });
    }
  }

  return {
    loading,
    migrationMissing,
    starsQuestion,
    setStarsQuestion: (v) => { setStarsQuestion(v); clearOk(); },
    tagsEnabled,
    setTagsEnabled: (v) => { setTagsEnabled(v); clearOk(); },
    tagsQuestion,
    setTagsQuestion: (v) => { setTagsQuestion(v); clearOk(); },
    tags,
    newTag,
    setNewTag,
    commentEnabled,
    setCommentEnabled: (v) => { setCommentEnabled(v); clearOk(); },
    commentQuestion,
    setCommentQuestion: (v) => { setCommentQuestion(v); clearOk(); },
    commentPlaceholder,
    setCommentPlaceholder: (v) => { setCommentPlaceholder(v); clearOk(); },
    status,
    addTag,
    removeTag,
    applyPreset,
    handleSave,
    handleReset
  };
}
