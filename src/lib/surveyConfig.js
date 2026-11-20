/**
 * Configuración predeterminada y resolución de preguntas del ticket de opinión.
 * Si el negocio todavía no personalizó sus preguntas (`survey_questions` vacío),
 * se muestran los valores estándar de Latido.
 */

export const DEFAULT_TAGS = ['Rapidez', 'Atención', 'Precio', 'Limpieza', 'Ambiente', 'Calidad'];

export const DEFAULT_SURVEY = {
  starsQuestion: '¿Cómo fue tu experiencia hoy?',
  tagsEnabled: true,
  tagsQuestion: '', // vacío = usa el texto adaptativo ("¿Qué falló?" / "¿Qué destacás?")
  tags: DEFAULT_TAGS,
  commentEnabled: true,
  commentQuestion: 'Comentario (opcional)',
  commentPlaceholder: 'Contanos algo más si querés...'
};

export const SURVEY_PRESETS = [
  {
    id: 'general',
    label: 'General',
    starsQuestion: '¿Cómo fue tu experiencia hoy?',
    tagsQuestion: '¿Qué aspecto querés destacar o mejorar?',
    tags: ['Rapidez', 'Atención', 'Precio', 'Limpieza', 'Ambiente', 'Calidad'],
    commentQuestion: 'Comentario (opcional)',
    commentPlaceholder: 'Contanos algo más si querés...'
  },
  {
    id: 'gastronomia',
    label: 'Gastronomía',
    starsQuestion: '¿Cómo estuvo tu visita hoy?',
    tagsQuestion: '¿Qué te pareció lo más importante?',
    tags: ['Comida / Café', 'Atención', 'Rapidez', 'Precio', 'Limpieza', 'Ambiente'],
    commentQuestion: '¿Alguna sugerencia para la cocina o el salón?',
    commentPlaceholder: 'Ej: el café estuvo increíble, tardó un poco el pedido...'
  },
  {
    id: 'gimnasio',
    label: 'Gimnasio',
    starsQuestion: '¿Cómo estuvo tu entrenamiento hoy?',
    tagsQuestion: '¿Qué aspectos querés calificar?',
    tags: ['Máquinas', 'Limpieza', 'Profesores', 'Horarios', 'Vestuarios', 'Ambiente'],
    commentQuestion: '¿Qué podemos mejorar en el gimnasio?',
    commentPlaceholder: 'Ej: mantenimiento de equipos, música, clases...'
  },
  {
    id: 'comercio',
    label: 'Comercio / Local',
    starsQuestion: '¿Cómo fue tu experiencia de compra?',
    tagsQuestion: '¿Qué destacás o qué falló?',
    tags: ['Atención', 'Variedad', 'Precios', 'Calidad', 'Tiempo en caja', 'Orden'],
    commentQuestion: 'Comentario o sugerencia (opcional)',
    commentPlaceholder: 'Contanos si encontraste todo lo que buscabas...'
  },
  {
    id: 'salud',
    label: 'Salud / Estética',
    starsQuestion: '¿Cómo te sentiste atendido hoy?',
    tagsQuestion: '¿Qué aspectos querés señalar?',
    tags: ['Puntualidad', 'Trato', 'Instalaciones', 'Limpieza', 'Claridad', 'Turnos'],
    commentQuestion: 'Comentarios adicionales (opcional)',
    commentPlaceholder: 'Tu opinión nos ayuda a cuidar mejor cada turno...'
  }
];

export function resolveSurveyConfig(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { isCustom: false, ...DEFAULT_SURVEY };
  }

  const byType = {};
  for (const row of rows) {
    if (row && row.type && !byType[row.type]) {
      byType[row.type] = row;
    }
  }

  const starsRow = byType.stars;
  const tagsRow = byType.tags;
  const textRow = byType.text;

  const customTags = Array.isArray(tagsRow?.options)
    ? tagsRow.options.map(t => String(t).trim()).filter(Boolean)
    : [];

  return {
    isCustom: true,
    starsQuestion: starsRow?.question_text?.trim() || DEFAULT_SURVEY.starsQuestion,
    tagsEnabled: tagsRow ? tagsRow.active !== false && customTags.length > 0 : true,
    tagsQuestion: tagsRow?.question_text?.trim() || '',
    tags: tagsRow ? (customTags.length ? customTags : DEFAULT_TAGS) : DEFAULT_TAGS,
    commentEnabled: textRow ? textRow.active !== false : true,
    commentQuestion: textRow?.question_text?.trim() || DEFAULT_SURVEY.commentQuestion,
    commentPlaceholder: textRow?.placeholder?.trim() || DEFAULT_SURVEY.commentPlaceholder
  };
}
