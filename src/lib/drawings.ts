import { MAX_TITLE_LENGTH } from '@/config/gallery';

export type Drawing = {
  id: string;
  title: string;
  imageUrl: string;
  uploadedAt: string;
  isNew: boolean;
};

/** Carpeta unica dentro del store de Blob. */
export const BLOB_PREFIX = 'drawings/';

const EXTENSION = '.webp';
const SEPARATOR = '__';

/** Ventana durante la que una obra se marca como "Nuevo". */
const NEW_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * El titulo viaja dentro del propio nombre del fichero, que es lo que permite
 * prescindir de base de datos: `list()` devuelve el catalogo completo ya con
 * los metadatos que necesitamos.
 */
export function buildPathname(id: string, title: string): string {
  return `${BLOB_PREFIX}${id}${SEPARATOR}${encodeURIComponent(
    title
  )}${EXTENSION}`;
}

export function parsePathname(
  pathname: string
): { id: string; title: string } | null {
  if (!pathname.startsWith(BLOB_PREFIX) || !pathname.endsWith(EXTENSION)) {
    return null;
  }

  const bare = pathname.slice(BLOB_PREFIX.length, -EXTENSION.length);
  const [id, ...rest] = bare.split(SEPARATOR);

  // El titulo se reconstruye uniendo el resto: asi un titulo que contenga el
  // separador sigue sobreviviendo al viaje de ida y vuelta.
  if (!id || rest.length === 0) return null;

  try {
    return { id, title: decodeURIComponent(rest.join(SEPARATOR)) };
  } catch {
    return null;
  }
}

/** Id corto, url-safe y ordenable a simple vista. */
export function createId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('');
}

export function normalizeTitle(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, MAX_TITLE_LENGTH);
}

export function isNew(uploadedAt: Date): boolean {
  return Date.now() - uploadedAt.getTime() < NEW_WINDOW_MS;
}
