/**
 * Configuracion de la galeria.
 *
 * No hay base de datos: el catalogo se deriva de listar Vercel Blob. Lo unico
 * que no se puede derivar del almacenamiento es el criterio editorial, asi que
 * la curacion vive aqui, versionada.
 */

/** Techo de obras almacenadas. Al superarlo se borra la mas antigua (FIFO). */
export const MAX_DRAWINGS = 200;

/** Obras por pagina en "Recientes". */
export const PAGE_SIZE = 12;

/** Peso maximo aceptado por subida, antes de decodificar base64. */
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

/** Longitud maxima del titulo. */
export const MAX_TITLE_LENGTH = 60;

/**
 * Ids destacados, en orden de aparicion. Se editan a mano y se despliega.
 *
 * Con subida anonima la mayoria de las obras seran garabatos; si lo primero que
 * ve el visitante es un garabato, el juicio recae sobre el criterio de quien
 * firma el portfolio. Esta lista existe para controlar esa primera pantalla.
 */
export const FEATURED_IDS: readonly string[] = [];
