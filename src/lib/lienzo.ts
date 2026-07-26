/** Tipos compartidos entre el lienzo y la capa de borradores. */

export type Trazo = {
  /** Aplanado como [x0, y0, x1, y1, ...]. */
  puntos: number[];
  color: string;
  grosor: number;
};

export type Instantanea = {
  trazos: Trazo[];
  fondo: string;
};

export const LIENZO_ANCHO = 1200;
export const LIENZO_ALTO = 675;
export const BLANCO = '#FFFFFF';
