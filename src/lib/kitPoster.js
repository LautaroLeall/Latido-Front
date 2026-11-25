import { getMonogram } from './utils';

function loadImageCors(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function drawWrappedCenteredText(ctx, text, centerX, startY, maxWidth, lineHeight, maxLines = 2) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (current) lines.push(current);

  const clamped = lines.slice(0, maxLines);
  clamped.forEach((line, idx) => {
    ctx.fillText(line, centerX, startY + idx * lineHeight, maxWidth);
  });
  return startY + clamped.length * lineHeight;
}

function sanitizeFileSlug(value) {
  return String(value || 'latido')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'latido';
}

/**
 * Dibuja el símbolo vectorial oficial de Latido (talón 52×36 con muescas + pulso ámbar),
 * unificado exactamente con `public/latido-simbolo.svg` y `LatidoSymbol.jsx`.
 */
function drawLatidoSymbol(ctx, x, y, width, { bg = '#1A1D29', stroke = '#C89B3C' } = {}) {
  const s = width / 52;
  ctx.save();
  ctx.translate(x - 6 * s, y - 14 * s);
  ctx.scale(s, s);
  ctx.fillStyle = bg;
  ctx.fill(new Path2D('M6 14H58V27A5 5 0 0 0 58 37V50H6V37A5 5 0 0 0 6 27Z'));
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(new Path2D('M17 32L24 32L28 23L33 41L37 28L40 32L47 32'));
  ctx.restore();
}

async function ensurePosterFontsLoaded() {
  if (typeof document === 'undefined' || !document.fonts?.load) return;
  try {
    await Promise.all([
      document.fonts.load('700 62px "Space Grotesk"'),
      document.fonts.load('700 48px "Space Grotesk"'),
      document.fonts.load('700 44px "Space Grotesk"'),
      document.fonts.load('700 40px "Space Grotesk"'),
      document.fonts.load('700 30px "IBM Plex Mono"'),
      document.fonts.load('600 30px "IBM Plex Mono"')
    ]);
  } catch {
    // Continuar con las fuentes disponibles si el navegador bloquea la precarga
  }
}

/**
 * Descarga el QR limpio en PNG 1024×1024 (para insertar en diseños propios).
 */
export function downloadQrOnlyPng(qrCanvas, businessName, branchName) {
  if (!qrCanvas) return false;
  const link = document.createElement('a');
  const slug = sanitizeFileSlug(`${businessName}-${branchName || 'qr'}`);
  link.download = `latido-qr-${slug}.png`;
  link.href = qrCanvas.toDataURL('image/png');
  link.click();
  return true;
}

/**
 * Genera y descarga una lámina editorial imprimible HD (1200×1800 px, proporción 2:3
 * exacta para acrílico 10×15 cm a ~305 dpi, márgenes seguros de 5,5 mm y textos ≥ 7 pt).
 */
export async function downloadPrintableKitPoster({
  qrCanvas,
  businessName,
  branchName,
  logoUrl
}) {
  if (!qrCanvas) return false;

  await ensurePosterFontsLoaded();

  const W = 1200;
  const H = 1800;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  // 1. Fondo papel cálido a sangre + marco editorial con margen seguro ≥ 5,5 mm (66 px a ~305 dpi)
  ctx.fillStyle = '#FAF8F3';
  ctx.fillRect(0, 0, W, H);

  const margin = 66;
  const shadowOffset = 12;
  const frameW = W - margin * 2 - shadowOffset;
  const frameH = H - margin * 2 - shadowOffset;

  ctx.fillStyle = '#1F6F64';
  ctx.fillRect(margin + shadowOffset, margin + shadowOffset, frameW, frameH);
  ctx.fillStyle = '#FAF8F3';
  ctx.fillRect(margin, margin, frameW, frameH);
  ctx.strokeStyle = '#1A1D29';
  ctx.lineWidth = 6;
  ctx.strokeRect(margin, margin, frameW, frameH);

  // Perforaciones decorativas arriba y abajo (estética ticket)
  const topPerfY = margin + 46;
  const bottomPerfY = margin + frameH - 46;
  ctx.fillStyle = '#1A1D29';
  for (let x = margin + 48; x <= margin + frameW - 48; x += 44) {
    ctx.beginPath();
    ctx.arc(x, topPerfY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, bottomPerfY, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Logo del negocio (imagen real o monograma)
  const logoSize = 168;
  const logoX = (W - logoSize) / 2;
  const logoY = topPerfY + 42;

  let drewLogo = false;
  if (logoUrl) {
    try {
      const img = await loadImageCors(logoUrl);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(logoX, logoY, logoSize, logoSize);
      ctx.strokeStyle = '#D8D2C2';
      ctx.lineWidth = 3;
      ctx.strokeRect(logoX, logoY, logoSize, logoSize);

      const pad = 16;
      const avail = logoSize - pad * 2;
      const ratio = Math.min(avail / img.naturalWidth, avail / img.naturalHeight);
      const drawW = img.naturalWidth * ratio;
      const drawH = img.naturalHeight * ratio;
      ctx.drawImage(img, logoX + (logoSize - drawW) / 2, logoY + (logoSize - drawH) / 2, drawW, drawH);
      drewLogo = true;
    } catch {
      drewLogo = false;
    }
  }

  if (!drewLogo) {
    ctx.fillStyle = '#1A1D29';
    ctx.fillRect(logoX, logoY, logoSize, logoSize);
    ctx.strokeStyle = '#C89B3C';
    ctx.lineWidth = 4;
    ctx.strokeRect(logoX + 6, logoY + 6, logoSize - 12, logoSize - 12);
    ctx.fillStyle = '#FAF8F3';
    ctx.font = '700 66px "Space Grotesk", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(getMonogram(businessName), W / 2, logoY + logoSize / 2 + 2);
  }

  // 3. Nombre del negocio y sucursal (todos los textos ≥ 30 px / ≥ 7 pt en 10 cm)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#1A1D29';
  ctx.font = '700 60px "Space Grotesk", system-ui, sans-serif';
  const afterTitleY = drawWrappedCenteredText(ctx, businessName || 'Tu Negocio', W / 2, logoY + logoSize + 80, frameW - 96, 68, 2);

  if (branchName) {
    ctx.fillStyle = '#5F636B';
    ctx.font = '600 30px "IBM Plex Mono", monospace';
    ctx.fillText(String(branchName).toUpperCase(), W / 2, afterTitleY - 8, frameW - 110);
  }

  // Línea divisoria punteada
  const dividerY = Math.max(afterTitleY + 26, 496);
  ctx.save();
  ctx.setLineDash([12, 10]);
  ctx.strokeStyle = '#D8D2C2';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(margin + 54, dividerY);
  ctx.lineTo(margin + frameW - 54, dividerY);
  ctx.stroke();
  ctx.restore();

  // 4. Llamada a la acción única y clara (sin duplicar pedidos ni tiempos no medidos)
  ctx.fillStyle = '#1F6F64';
  ctx.font = '700 30px "IBM Plex Mono", monospace';
  ctx.fillText('CONTANOS TU EXPERIENCIA', W / 2, dividerY + 62, frameW - 80);

  ctx.fillStyle = '#1A1D29';
  ctx.font = '700 48px "Space Grotesk", system-ui, sans-serif';
  ctx.fillText('Tu opinión en pocos segundos', W / 2, dividerY + 124, frameW - 80);

  // 5. Código QR nítido en marco físico (~4,2 a 4,5 cm impresos en soporte 10×15 cm)
  const isTallHeader = dividerY > 520;
  const qrBoxSize = isTallHeader ? 544 : 588;
  const qrBoxX = (W - qrBoxSize) / 2;
  const qrBoxY = dividerY + (isTallHeader ? 160 : 172);

  ctx.fillStyle = '#1A1D29';
  ctx.fillRect(qrBoxX + 10, qrBoxY + 10, qrBoxSize, qrBoxSize);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
  ctx.strokeStyle = '#1A1D29';
  ctx.lineWidth = 5;
  ctx.strokeRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qrCanvas, qrBoxX + 24, qrBoxY + 24, qrBoxSize - 48, qrBoxSize - 48);
  ctx.restore();

  // 6. Zona objetivo de NFC (pegar el chip NTAG213 detrás del recuadro de ondas)
  const bandX = margin + 54;
  const bandW = frameW - 108;
  const bandH = 192;
  const bandY = qrBoxY + qrBoxSize + 54;

  ctx.fillStyle = '#C89B3C';
  ctx.fillRect(bandX + 10, bandY + 10, bandW, bandH);
  ctx.fillStyle = '#1A1D29';
  ctx.fillRect(bandX, bandY, bandW, bandH);

  // Recuadro objetivo del chip NFC (guía visual para apoyar la parte superior del celular)
  const padSize = 138;
  const padX = bandX + 27;
  const padY = bandY + (bandH - padSize) / 2;

  ctx.fillStyle = '#25293A';
  ctx.fillRect(padX, padY, padSize, padSize);
  ctx.strokeStyle = '#C89B3C';
  ctx.lineWidth = 4;
  ctx.strokeRect(padX, padY, padSize, padSize);

  // Ícono de ondas NFC ampliado y centrado dentro de la zona de apoyo
  const iconOriginX = padX + 44;
  const iconCy = padY + padSize / 2;
  ctx.fillStyle = '#C89B3C';
  ctx.beginPath();
  ctx.arc(iconOriginX, iconCy, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#C89B3C';
  ctx.lineWidth = 6.5;
  ctx.lineCap = 'round';
  [24, 42, 60].forEach((radius) => {
    ctx.beginPath();
    ctx.arc(iconOriginX, iconCy, radius, -Math.PI / 3.1, Math.PI / 3.1);
    ctx.stroke();
  });

  const textX = padX + padSize + 32;
  const textMaxW = bandX + bandW - textX - 28;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#C89B3C';
  ctx.font = '700 30px "IBM Plex Mono", monospace';
  ctx.fillText('ZONA NFC · SIN APPS', textX, bandY + 76, textMaxW);

  ctx.fillStyle = '#FAF8F3';
  ctx.font = '700 40px "Space Grotesk", system-ui, sans-serif';
  ctx.fillText('← Acercá tu celular acá', textX, bandY + 138, textMaxW);

  // 7. Firma de marca Latido (legible ≥ 7 pt, sin URL redundante ni hardcodeada)
  const footerCenterY = Math.round(((bandY + bandH + 10) + bottomPerfY) / 2);
  const prefixText = 'CON TECNOLOGÍA DE';
  const brandText = 'Latido';
  const symW = 68;
  const symH = Math.round((symW * 36) / 52);
  const gapPrefix = 20;
  const gapWord = 16;

  ctx.font = '600 30px "IBM Plex Mono", monospace';
  const prefixW = ctx.measureText(prefixText).width;
  ctx.font = '700 44px "Space Grotesk", system-ui, sans-serif';
  const brandW = ctx.measureText(brandText).width;

  const rowW = prefixW + gapPrefix + symW + gapWord + brandW;
  const startX = (W - rowW) / 2;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#5F636B';
  ctx.font = '600 30px "IBM Plex Mono", monospace';
  ctx.fillText(prefixText, startX, footerCenterY + 1);

  drawLatidoSymbol(ctx, startX + prefixW + gapPrefix, footerCenterY - symH / 2, symW);

  ctx.fillStyle = '#1A1D29';
  ctx.font = '700 44px "Space Grotesk", system-ui, sans-serif';
  ctx.fillText(brandText, startX + prefixW + gapPrefix + symW + gapWord, footerCenterY + 1);

  const link = document.createElement('a');
  const slug = sanitizeFileSlug(`${businessName}-${branchName || 'soporte'}`);
  link.download = `latido-lamina-${slug}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  return true;
}
