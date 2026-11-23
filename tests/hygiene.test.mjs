// Higiene automática del Frontend: UTF-8 limpio, sin rutas legacy /registro ni enlaces externos inseguros.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FRONT_ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC_DIR = path.join(FRONT_ROOT, 'src');
const SCRIPTS_DIR = path.join(FRONT_ROOT, 'scripts');
const INDEX_HTML = path.join(FRONT_ROOT, 'index.html');

const MOJIBAKE_RE = /Ã[¡©­³º±¼ÁÉÍÓÚÑ€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]|Â[·¡¿°ªº]|â€|â†|âœ|â˜|ï¸|ðŸ|\uFFFD/;
const LEGACY_RE = /\/registro\b|RegisterPage|OnboardingPage|\/onboarding\b|create_my_business/;

let fail = 0;

function checkEncoding(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach((l, i) => {
    if (MOJIBAKE_RE.test(l)) {
      fail++;
      console.log(`  ✘ Mojibake en ${path.relative(FRONT_ROOT, filePath)}:${i + 1}`);
    }
  });
}

function checkLegacyAndLinks(filePath) {
  const txt = fs.readFileSync(filePath, 'utf8');
  if (LEGACY_RE.test(txt)) {
    fail++;
    console.log(`  ✘ Referencia legacy (/registro u onboarding) en ${path.relative(FRONT_ROOT, filePath)}`);
  }
  if (/\.jsx$/i.test(filePath)) {
    // 1) Todo enlace a WhatsApp/Mail/Gmail/ticket debe abrir en pestaña nueva con noopener
    const re = /<(?:a|HardButton)\b[\s\S]*?href=\{[\s\S]*?\}[\s\S]*?>/g;
    let m;
    while ((m = re.exec(txt))) {
      const tag = m[0];
      if (!/(Mail|WhatsApp|Gmail|mailHref|waHref|gmailHref|urlCheck|ticketUrl|buildFeedbackUrl|href=\{url\})/.test(tag)) {
        continue;
      }
      if (!/target=["']_blank["']/.test(tag) || !/noopener/.test(tag)) {
        fail++;
        console.log(`  ✘ Enlace externo sin target="_blank"/noopener en ${path.relative(FRONT_ROOT, filePath)}`);
      }
    }

    // 2) Ningún target="_blank" en toda la app puede omitir rel="noopener..."
    const blankRe = /<(?:a|HardButton)\b[^>]*target=["']_blank["'][^>]*>/g;
    while ((m = blankRe.exec(txt))) {
      if (!/noopener/.test(m[0])) {
        fail++;
        console.log(`  ✘ target="_blank" sin noopener en ${path.relative(FRONT_ROOT, filePath)}`);
      }
    }
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|jsx|mjs|css)$/i.test(e.name)) {
      checkEncoding(p);
      if (/\.(js|jsx|mjs)$/i.test(e.name)) checkLegacyAndLinks(p);
    }
  }
}

checkEncoding(INDEX_HTML);
walk(SRC_DIR);
walk(SCRIPTS_DIR);

console.log(fail ? `\n✘ ${fail} problemas de higiene detectados` : '✔ Higiene Frontend OK (UTF-8 limpio, sin /registro, enlaces externos seguros)');
process.exit(fail ? 1 : 0);
