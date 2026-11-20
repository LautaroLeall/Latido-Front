// Pruebas unitarias de validaciones de datos reales de LATIDO.
import {
  validateEmail,
  validatePersonName,
  validateBusinessName,
  validateBranchName,
  validatePhone,
  normalizeWhatsAppDigits,
  validatePassword,
  validateGoogleReviewUrl,
  validateRescueMessage,
  validateSurveyText,
  validateSurveyTag,
  validateNumberRange
} from '../src/lib/validators.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => {
  if (cond) { pass++; console.log('  ✔', msg); }
  else { fail++; console.log('  ✘ FALLA:', msg); }
};

console.log('\n[1] Email');
ok(validateEmail('lautaroleal4@gmail.com').valid, 'Email válido estándar');
ok(validateEmail('  SOFIA.PEREZ+cafe@Empresa.com.ar  ').value === 'sofia.perez+cafe@empresa.com.ar', 'Normaliza espacios y mayúsculas');
ok(!validateEmail('sin-arroba.com').valid, 'Rechaza sin @');
ok(!validateEmail('juan@gmail').valid, 'Rechaza sin TLD');
ok(!validateEmail('juan@gmail.c').valid, 'Rechaza TLD de 1 letra');
ok(!validateEmail('juan..perez@gmail.com').valid, 'Rechaza puntos dobles');
ok(!validateEmail('juan perez@gmail.com').valid, 'Rechaza espacios internos');
ok(validateEmail('', { required: false }).valid, 'Opcional vacío pasa');

console.log('\n[2] Nombre de persona');
ok(validatePersonName('Martín Gómez', { requireTwoWords: true }).valid, 'Nombre y apellido con tilde');
ok(validatePersonName("María José O'Connor", { requireTwoWords: true }).valid, 'Con apóstrofe y tildes');
ok(validatePersonName('Peña Núñez', { requireTwoWords: true }).valid, 'Con ñ');
ok(!validatePersonName('Juan123', { requireTwoWords: false }).valid, 'Rechaza números en nombre');
ok(!validatePersonName('Martín', { requireTwoWords: true }).valid, 'Exige apellido cuando requireTwoWords');
ok(!validatePersonName('@@@ ###', { requireTwoWords: true }).valid, 'Rechaza símbolos');
ok(!validatePersonName('aaaaaaaaa').valid, 'Rechaza letras repetidas spam');
ok(!validatePersonName('a b', { requireTwoWords: true }).valid, 'Rechaza iniciales sueltas');

console.log('\n[3] Nombre de negocio y sucursal');
ok(validateBusinessName('Cafetería del Sol').valid, 'Negocio clásico');
ok(validateBusinessName('Café 24 & Co.').valid, 'Negocio con número y &');
ok(!validateBusinessName('123456').valid, 'Rechaza solo números');
ok(!validateBusinessName('---').valid, 'Rechaza solo símbolos');
ok(!validateBusinessName('<script>alert(1)</script>').valid, 'Rechaza HTML');
ok(!validateBusinessName('https://spam.com').valid, 'Rechaza URL como nombre');
ok(validateBranchName('Sucursal Norte 2').valid, 'Sucursal válida');

console.log('\n[4] Teléfono y WhatsApp AR');
ok(validatePhone('3815551234', { required: true }).whatsappDigits === '5493815551234', 'Local AR 10 dígitos -> 549...');
ok(validatePhone('0381 15 555-1234', { required: true }).whatsappDigits === '5493815551234', 'Con 0 y 15 -> 549...');
ok(validatePhone('+54 9 381 555 1234', { required: true }).whatsappDigits === '5493815551234', 'Con +54 9 -> 549...');
ok(validatePhone('+54 381 555 1234', { required: true }).whatsappDigits === '5493815551234', 'Con +54 sin 9 -> 549...');
ok(validatePhone('+1 415 555 2671', { required: true }).whatsappDigits === '14155552671', 'Internacional (+1) respetado');
ok(!validatePhone('381abc1234', { required: true }).valid, 'Rechaza letras en teléfono');
ok(!validatePhone('0000000000', { required: true }).valid, 'Rechaza 0000000000');
ok(!validatePhone('1111111111', { required: true }).valid, 'Rechaza 1111111111');
ok(!validatePhone('1234567890', { required: true }).valid, 'Rechaza 1234567890');
ok(!validatePhone('12345', { required: true }).valid, 'Rechaza muy corto');
ok(normalizeWhatsAppDigits('') === '', 'Vacío -> vacío');

console.log('\n[5] Contraseña');
ok(validatePassword('Lautaro02').valid, 'Contraseña válida (letras + números)');
ok(validatePassword('Lat-7kP4-mX92').valid, 'Contraseña generada');
ok(!validatePassword('12345678').valid, 'Rechaza solo números / débil');
ok(!validatePassword('abcdefgh').valid, 'Rechaza sin números');
ok(!validatePassword('Abc123').valid, 'Rechaza < 8 caracteres');
ok(!validatePassword(' Lautaro02 ').valid, 'Rechaza espacios al inicio/fin');
ok(!validatePassword('Password1').valid, 'Rechaza password1 común');

console.log('\n[6] Link de Google Maps / Reseñas');
ok(validateGoogleReviewUrl('https://g.page/r/CfX12345678/review').valid, 'g.page válido');
ok(validateGoogleReviewUrl('https://maps.app.goo.gl/abc123XYZ').valid, 'maps.app.goo.gl válido');
ok(validateGoogleReviewUrl('https://search.google.com/local/writereview?placeid=ChIJ123').valid, 'search.google.com válido');
ok(validateGoogleReviewUrl('https://www.google.com.ar/maps/place/Cafe').valid, 'google.com.ar válido');
ok(!validateGoogleReviewUrl('http://g.page/r/123/review').valid, 'Rechaza http:// inseguro');
ok(!validateGoogleReviewUrl('https://instagram.com/milocal').valid, 'Rechaza Instagram');
ok(!validateGoogleReviewUrl('https://facebook.com/milocal').valid, 'Rechaza Facebook');
ok(!validateGoogleReviewUrl('javascript:alert(1)').valid, 'Rechaza javascript:');
ok(!validateGoogleReviewUrl('g.page/r/123').valid, 'Rechaza sin protocolo');

console.log('\n[7] Mensaje de rescate y encuesta');
ok(validateRescueMessage('Hola Martín, disculpá la demora. Te invitamos un café.').valid, 'Mensaje válido');
ok(!validateRescueMessage('   ').valid, 'Rechaza vacío');
ok(!validateRescueMessage('....').valid, 'Rechaza sin letras');
ok(!validateRescueMessage('Hola {nombre}, soy {encargado}').valid, 'Rechaza variables sin reemplazar');
ok(validateSurveyText('¿Cómo fue tu experiencia hoy?').valid, 'Pregunta válida');
ok(!validateSurveyText('<b>Hola</b>').valid, 'Rechaza HTML en pregunta');
ok(validateSurveyTag('Atención').valid, 'Etiqueta válida');
ok(!validateSurveyTag('123').valid, 'Rechaza etiqueta sin letras');
ok(validateNumberRange('50000', { min: 0, max: 100000000 }).valid, 'Número válido');
ok(!validateNumberRange('-5', { min: 0 }).valid, 'Rechaza negativo');
ok(!validateNumberRange('2.5', { min: 1, max: 1000, integer: true }).valid, 'Rechaza decimal en entero');

console.log(`\n══════ RESULTADO VALIDATORS: ${pass} OK · ${fail} FALLAS ══════\n`);
process.exit(fail ? 1 : 0);
