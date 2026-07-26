import 'server-only';

import { list } from '@vercel/blob';

import { MAX_DRAWINGS } from '@/config/gallery';
import {
  BLOB_PREFIX,
  isNew,
  parsePathname,
  type Drawing,
} from '@/lib/drawings';

/**
 * Lectura del catalogo.
 *
 * Vive fuera de `src/actions` a proposito: un Server Action es un endpoint RPC
 * publico, y estas funciones solo las consume el servidor. Marcarlas
 * `'use server'` expondria dos rutas que nadie necesita. `server-only` hace que
 * importarlas desde un componente cliente rompa en build en vez de en runtime.
 */

export type GalleryResult =
  | { ok: true; drawings: Drawing[] }
  | { ok: false; reason: 'unconfigured' | 'error' };

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function getDrawings(): Promise<GalleryResult> {
  // Sin token no hay fallo que reportar: el proyecto simplemente no tiene
  // almacenamiento conectado todavia. La UI lo distingue de un error real.
  if (!isBlobConfigured()) return { ok: false, reason: 'unconfigured' };

  try {
    const { blobs } = await list({
      prefix: BLOB_PREFIX,
      limit: MAX_DRAWINGS,
    });

    const drawings = blobs
      .map(toDrawing)
      .filter((drawing): drawing is Drawing => drawing !== null)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

    return { ok: true, drawings };
  } catch (error) {
    console.error('[drawings] no se pudo listar el store de Blob:', error);
    return { ok: false, reason: 'error' };
  }
}

export async function getDrawing(id: string): Promise<Drawing | null> {
  if (!isBlobConfigured()) return null;

  try {
    // El prefijo incluye el separador para que un id no case con otro mas largo.
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}${id}__`, limit: 1 });
    return blobs.length > 0 ? toDrawing(blobs[0]) : null;
  } catch (error) {
    console.error(`[drawings] no se pudo leer la obra ${id}:`, error);
    return null;
  }
}

type BlobListItem = {
  pathname: string;
  url: string;
  uploadedAt: Date;
};

function toDrawing(blob: BlobListItem): Drawing | null {
  const parsed = parsePathname(blob.pathname);
  if (!parsed) return null;

  return {
    id: parsed.id,
    title: parsed.title,
    imageUrl: blob.url,
    uploadedAt: blob.uploadedAt.toISOString(),
    isNew: isNew(blob.uploadedAt),
  };
}
