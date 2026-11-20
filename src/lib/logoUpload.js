import { supabase } from './supabaseClient';

export const LOGO_BUCKET = 'business-logos';
export const ALLOWED_LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_INPUT_BYTES = 5 * 1024 * 1024;   // 5 MB antes de optimizar
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;  // 2 MB (límite del bucket)
const MIN_DIMENSION = 64;
const MAX_INPUT_DIMENSION = 6000;
const TARGET_MAX_DIMENSION = 512;

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('El archivo no es una imagen válida o está dañado.'));
    };
    img.src = objectUrl;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No pudimos procesar la imagen.'))),
      type,
      quality
    );
  });
}

/**
 * Valida que el archivo sea una imagen real (PNG, JPG o WebP) y la redimensiona
 * proporcionalmente hasta 512×512 px conservando la transparencia en PNG.
 */
export async function validateAndPrepareLogo(file) {
  if (!file) {
    throw new Error('Elegí una imagen para subir.');
  }
  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    throw new Error('Formato no permitido. Usá una imagen PNG, JPG o WebP (sin SVG ni PDF).');
  }
  if (file.size === 0) {
    throw new Error('El archivo está vacío.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('La imagen pesa demasiado (máximo 5 MB).');
  }

  const img = await loadImageFromFile(file);
  const { naturalWidth: w, naturalHeight: h } = img;

  if (w < MIN_DIMENSION || h < MIN_DIMENSION) {
    throw new Error(`La imagen es muy chica (${w}×${h}px). Usá un logo de al menos ${MIN_DIMENSION}×${MIN_DIMENSION}px.`);
  }
  if (w > MAX_INPUT_DIMENSION || h > MAX_INPUT_DIMENSION) {
    throw new Error(`La imagen es demasiado grande (${w}×${h}px).`);
  }

  const scale = Math.min(1, TARGET_MAX_DIMENSION / Math.max(w, h));
  const outW = Math.max(1, Math.round(w * scale));
  const outH = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Tu navegador no permite procesar imágenes.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, outW, outH);

  // PNG mantiene fondo transparente; JPEG queda más liviano como WebP/JPEG
  const outType = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
  const ext = outType === 'image/jpeg' ? 'jpg' : 'png';
  const blob = await canvasToBlob(canvas, outType, outType === 'image/jpeg' ? 0.9 : undefined);

  if (blob.size > MAX_UPLOAD_BYTES) {
    // Reintento en WebP si el PNG quedó > 2 MB
    const webpBlob = await canvasToBlob(canvas, 'image/webp', 0.88);
    if (webpBlob.size > MAX_UPLOAD_BYTES) {
      throw new Error('No pudimos comprimir el logo por debajo de 2 MB. Probá con otra imagen.');
    }
    return { blob: webpBlob, contentType: 'image/webp', ext: 'webp' };
  }

  return { blob, contentType: outType, ext };
}

function mapStorageError(err, fallback) {
  const msg = String(err?.message || '');
  if (/bucket not found|not found/i.test(msg)) {
    return new Error('Falta aplicar la migración 011 en Supabase para habilitar el almacenamiento de logos.');
  }
  if (/row-level security|permission|unauthorized|403/i.test(msg)) {
    return new Error('No tenés permisos para modificar el logo de este negocio.');
  }
  return new Error(msg || fallback);
}

/**
 * Sube el nuevo logo, actualiza `businesses.logo_url` y limpia logos anteriores de esa carpeta.
 */
export async function uploadBusinessLogo(businessId, file) {
  const prepared = await validateAndPrepareLogo(file);

  // Listar archivos previos para limpiar después del alta exitosa
  const { data: existingFiles } = await supabase.storage.from(LOGO_BUCKET).list(businessId);
  const path = `${businessId}/logo-${Date.now()}.${prepared.ext}`;

  const { error: uploadErr } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, prepared.blob, {
      contentType: prepared.contentType,
      cacheControl: '31536000',
      upsert: false
    });

  if (uploadErr) {
    throw mapStorageError(uploadErr, 'No pudimos subir el logo.');
  }

  const { data: urlData } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
  const publicUrl = urlData?.publicUrl;
  if (!publicUrl || !publicUrl.startsWith('https://')) {
    throw new Error('No pudimos obtener la URL pública del logo.');
  }

  const { error: dbErr } = await supabase
    .from('businesses')
    .update({ logo_url: publicUrl })
    .eq('id', businessId);

  if (dbErr) {
    // Rollback del archivo recién subido
    await supabase.storage.from(LOGO_BUCKET).remove([path]);
    throw mapStorageError(dbErr, 'No pudimos guardar el logo en tu negocio.');
  }

  // Borrar logos viejos del mismo negocio (mejor esfuerzo)
  const oldPaths = (existingFiles || [])
    .map(f => `${businessId}/${f.name}`)
    .filter(p => p !== path);
  if (oldPaths.length > 0) {
    await supabase.storage.from(LOGO_BUCKET).remove(oldPaths);
  }

  return { publicUrl };
}

/**
 * Quita el logo del negocio para volver automáticamente al monograma de iniciales.
 */
export async function removeBusinessLogo(businessId) {
  const { error: dbErr } = await supabase
    .from('businesses')
    .update({ logo_url: null })
    .eq('id', businessId);

  if (dbErr) {
    throw mapStorageError(dbErr, 'No pudimos quitar el logo.');
  }

  const { data: existingFiles } = await supabase.storage.from(LOGO_BUCKET).list(businessId);
  const paths = (existingFiles || []).map(f => `${businessId}/${f.name}`);
  if (paths.length > 0) {
    await supabase.storage.from(LOGO_BUCKET).remove(paths);
  }
}
