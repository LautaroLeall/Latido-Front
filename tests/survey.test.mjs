// Pruebas unitarias de configuración de encuesta y utilidades de plantilla/monograma.
import { DEFAULT_SURVEY, SURVEY_PRESETS, resolveSurveyConfig } from '../src/lib/surveyConfig.js';
import { fillTemplate, getMonogram } from '../src/lib/utils.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => {
  if (cond) { pass++; console.log('  ✔', msg); }
  else { fail++; console.log('  ✘ FALLA:', msg); }
};

console.log('\n[1] Encuesta predeterminada y personalizada');
const def = resolveSurveyConfig([]);
ok(!def.isCustom && def.starsQuestion === DEFAULT_SURVEY.starsQuestion && def.tags.length === 6, 'Sin filas → devuelve defaults de Latido');

const custom = resolveSurveyConfig([
  { type: 'stars', question_text: '¿Cómo estuvo tu café?', active: true },
  { type: 'tags', question_text: '¿Qué destacás?', options: ['Café', 'Música'], active: true },
  { type: 'text', question_text: 'Sugerencia', placeholder: 'Escribí...', active: false }
]);
ok(custom.isCustom && custom.starsQuestion === '¿Cómo estuvo tu café?', 'Resuelve pregunta principal personalizada');
ok(custom.tagsEnabled && custom.tags.length === 2 && custom.tags[0] === 'Café', 'Resuelve etiquetas personalizadas');
ok(!custom.commentEnabled, 'Respeta bloque de comentario oculto (active=false)');
ok(SURVEY_PRESETS.length >= 4 && SURVEY_PRESETS.every(p => p.tags.length >= 4), 'Plantillas por rubro completas');

console.log('\n[2] Monograma y plantillas');
ok(getMonogram('Cafetería del Sol') === 'CS', 'Monograma ignora conectores ("Cafetería del Sol" → CS)');
ok(getMonogram('Levels') === 'LE', 'Monograma de una palabra ("Levels" → LE)');
ok(getMonogram('') === 'LT', 'Sin nombre → LT');
const filled = fillTemplate('Hola {nombre},\nSoy {encargado} de {negocio} ({sucursal}).', {
  nombre: 'Martín', encargado: 'Sofía', negocio: 'Café Sol', sucursal: 'Centro'
});
ok(filled.includes('\n') && filled.includes('Martín') && filled.includes('Centro'), 'fillTemplate conserva saltos de línea y reemplaza variables');

console.log(`\n══════ RESULTADO SURVEY & UTILS: ${pass} OK · ${fail} FALLAS ══════\n`);
process.exit(fail ? 1 : 0);
