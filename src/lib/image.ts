import { MAX_UPLOAD_BYTES } from '@/config/gallery';

const DATA_URL_PREFIX = 'data:image/webp;base64,';

export type DecodedImage =
  | { ok: true; buffer: Buffer }
  | { ok: false; error: string };

/**
 * Decodifica el dataURL que manda el lienzo.
 *
 * El prefijo `data:` lo escribe el cliente, asi que no prueba nada: se
 * comprueba tambien la cabecera RIFF/WEBP del binario ya decodificado. De lo
 * contrario cualquiera puede subir un ejecutable renombrado y acabaria servido
 * desde nuestro dominio.
 */
export function decodeWebpDataUrl(dataUrl: string): DecodedImage {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith(DATA_URL_PREFIX)) {
    return { ok: false, error: 'El formato de la imagen no es valido.' };
  }

  const base64 = dataUrl.slice(DATA_URL_PREFIX.length);

  // Se descarta por longitud antes de reservar el buffer, no despues.
  if (base64.length > MAX_UPLOAD_BYTES * 1.4) {
    return { ok: false, error: 'La imagen supera el limite de 2 MB.' };
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch {
    return { ok: false, error: 'La imagen no se pudo decodificar.' };
  }

  if (buffer.byteLength === 0) {
    return { ok: false, error: 'La imagen esta vacia.' };
  }

  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    return { ok: false, error: 'La imagen supera el limite de 2 MB.' };
  }

  if (!isWebp(buffer)) {
    return { ok: false, error: 'El contenido no es una imagen WebP.' };
  }

  return { ok: true, buffer };
}

/** Contenedor RIFF: "RIFF" en 0..3 y "WEBP" en 8..11. */
function isWebp(buffer: Buffer): boolean {
  return (
    buffer.byteLength > 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  );
}
