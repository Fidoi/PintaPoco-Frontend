'use server';

import { del, list, put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

import { MAX_DRAWINGS } from '@/config/gallery';
import { isBlobConfigured } from '@/data/drawings';
import { BLOB_PREFIX, buildPathname, createId, normalizeTitle } from '@/lib/drawings';
import { decodeWebpDataUrl } from '@/lib/image';
import { checkRateLimit } from '@/lib/rate-limit';

export type SaveResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Devuelve un resultado tipado en lugar de lanzar.
 *
 * Next enmascara los mensajes de error de los Server Actions en produccion
 * ("An error occurred in the Server Components render"), asi que lanzar deja al
 * usuario sin informacion util. El fallo forma parte del contrato de la funcion.
 */
export async function saveDrawing(
  title: string,
  dataUrl: string
): Promise<SaveResult> {
  if (!isBlobConfigured()) {
    return { ok: false, error: 'El almacenamiento no esta configurado.' };
  }

  const clientIp = await getClientIp();
  if (!checkRateLimit(clientIp).allowed) {
    return { ok: false, error: 'Demasiadas subidas seguidas. Espera un minuto.' };
  }

  const cleanTitle = normalizeTitle(title);
  if (!cleanTitle) {
    return { ok: false, error: 'Ponle un titulo a la obra.' };
  }

  const decoded = decodeWebpDataUrl(dataUrl);
  if (!decoded.ok) {
    return { ok: false, error: decoded.error };
  }

  const id = createId();

  try {
    await put(buildPathname(id, cleanTitle), decoded.buffer, {
      access: 'public',
      contentType: 'image/webp',
      // El sufijo aleatorio de Blob romperia el parseo del nombre, que es de
      // donde sale el titulo. El id propio ya garantiza unicidad.
      addRandomSuffix: false,
      // `cacheControlMaxAge` se queda en su valor por defecto (un ano): una obra
      // publicada nunca cambia, asi que conviene cachearla lo maximo posible.
    });
  } catch (error) {
    console.error('[drawings] fallo al subir la obra:', error);
    return { ok: false, error: 'No se pudo guardar el dibujo. Intentalo de nuevo.' };
  }

  await enforceStorageCap();

  revalidatePath('/gallery');
  revalidatePath('/');

  return { ok: true, id };
}

/**
 * FIFO: el plan gratuito de Blob es finito, y una galeria de portfolio no gana
 * nada guardando la obra numero 201. Se ejecuta despues de subir, y su fallo no
 * invalida una subida que ya salio bien.
 */
async function enforceStorageCap(): Promise<void> {
  try {
    const { blobs } = await list({ prefix: BLOB_PREFIX, limit: 1000 });
    const excess = blobs.length - MAX_DRAWINGS;
    if (excess <= 0) return;

    const oldest = [...blobs]
      .sort((a, b) => a.uploadedAt.getTime() - b.uploadedAt.getTime())
      .slice(0, excess);

    await del(oldest.map((blob) => blob.url));
  } catch (error) {
    console.error('[drawings] no se pudo aplicar el limite FIFO:', error);
  }
}

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'desconocido';
}
