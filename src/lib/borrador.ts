import type { Instantanea } from './lienzo';

/**
 * Borradores locales, uno por pestana.
 *
 * El problema de guardar en `localStorage` sin mas es que es compartido por
 * todas las pestanas del mismo origen: con dos abiertas, cada guardado pisa el
 * de la otra y se pierde trabajo en silencio, que es la peor forma de perderlo.
 *
 * La solucion es combinar los dos almacenes por lo que cada uno hace bien:
 * `sessionStorage` es por pestana y sobrevive a una recarga, asi que sirve para
 * darle identidad a la pestana; `localStorage` sobrevive a cerrar el navegador,
 * asi que sirve para guardar el contenido. Cada pestana escribe en su propia
 * clave y nunca toca la de las demas.
 */

const PREFIJO = 'pintapoco:borrador:';
const CLAVE_PESTANA = 'pintapoco:pestana';

/** Los borradores caducan: no queremos ofrecer el dibujo de hace un mes. */
const MAX_EDAD_MS = 7 * 24 * 60 * 60 * 1000;

/** Techo de borradores conservados, del mas reciente al mas antiguo. */
const MAX_BORRADORES = 5;

export type Borrador = {
  titulo: string;
  trazos: Instantanea['trazos'];
  fondo: string;
  guardadoEn: number;
};

/**
 * Identidad de la pestana. Se crea una vez y sobrevive a las recargas, pero no
 * a cerrar la pestana: eso es exactamente lo que queremos.
 */
export function idPestana(): string {
  try {
    let id = sessionStorage.getItem(CLAVE_PESTANA);
    if (!id) {
      id = Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem(CLAVE_PESTANA, id);
    }
    return id;
  } catch {
    // Modo incognito con almacenamiento bloqueado: se sigue dibujando, solo
    // que sin red de seguridad.
    return 'efimera';
  }
}

export function guardar(id: string, borrador: Omit<Borrador, 'guardadoEn'>) {
  const datos: Borrador = {
    ...borrador,
    // Redondear a entero es lo que hace viable guardar aqui: en un espacio de
    // 1200x675 el subpixel no aporta nada, y "1043.2847290039062" ocupa cuatro
    // veces mas que "1043". Un dibujo denso pasa de megabytes a cientos de KB.
    trazos: borrador.trazos.map((trazo) => ({
      ...trazo,
      puntos: trazo.puntos.map((valor) => Math.round(valor)),
    })),
    guardadoEn: Date.now(),
  };

  try {
    localStorage.setItem(PREFIJO + id, JSON.stringify(datos));
    recogerBasura(id);
  } catch (error) {
    // Cuota agotada o almacenamiento denegado. Perder el borrador es malo;
    // romper la sesion de dibujo con una excepcion es peor.
    console.warn('[borrador] no se pudo guardar:', error);
  }
}

export function leer(id: string): Borrador | null {
  return leerClave(PREFIJO + id);
}

export function borrar(id: string) {
  try {
    localStorage.removeItem(PREFIJO + id);
  } catch {
    // Nada que hacer si el almacenamiento no esta disponible.
  }
}

/**
 * El borrador mas reciente de *otra* pestana.
 *
 * Cubre el caso que `sessionStorage` no puede: al cerrar el navegador por
 * completo se pierde la identidad de la pestana, asi que al volver ninguna
 * clave coincide y el trabajo quedaria huerfano. En vez de descartarlo, se
 * ofrece.
 */
export function leerHuerfano(
  idActual: string
): { clave: string; datos: Borrador } | null {
  return (
    listar()
      .filter(({ clave }) => clave !== PREFIJO + idActual)
      .filter(({ datos }) => datos.trazos.length > 0)
      .sort((a, b) => b.datos.guardadoEn - a.datos.guardadoEn)[0] ?? null
  );
}

/** Retira un borrador concreto, se haya adoptado o descartado. */
export function borrarClave(clave: string) {
  try {
    localStorage.removeItem(clave);
  } catch {
    // Nada que hacer si el almacenamiento no esta disponible.
  }
}

function listar(): Array<{ clave: string; datos: Borrador }> {
  const encontrados: Array<{ clave: string; datos: Borrador }> = [];

  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const clave = localStorage.key(i);
      if (!clave?.startsWith(PREFIJO)) continue;

      const datos = leerClave(clave);
      if (datos) encontrados.push({ clave, datos });
    }
  } catch {
    return [];
  }

  return encontrados;
}

function leerClave(clave: string): Borrador | null {
  try {
    const crudo = localStorage.getItem(clave);
    if (!crudo) return null;

    const datos = JSON.parse(crudo) as Borrador;
    // Un borrador corrupto o de un formato anterior no debe tumbar la pagina.
    if (!Array.isArray(datos?.trazos) || typeof datos.guardadoEn !== 'number') {
      return null;
    }
    if (Date.now() - datos.guardadoEn > MAX_EDAD_MS) return null;

    return datos;
  } catch {
    return null;
  }
}

/** Sin esto cada pestana nueva dejaria una clave para siempre. */
function recogerBasura(idActual: string) {
  const claveActual = PREFIJO + idActual;
  const todos = listar().sort((a, b) => b.datos.guardadoEn - a.datos.guardadoEn);

  const sobrantes = todos
    .filter(({ clave }) => clave !== claveActual)
    .slice(MAX_BORRADORES - 1);

  try {
    for (const { clave } of sobrantes) localStorage.removeItem(clave);

    // Los caducados los descarta `leerClave`, pero conviene retirarlos del
    // almacen para no consumir cuota indefinidamente.
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const clave = localStorage.key(i);
      if (clave?.startsWith(PREFIJO) && leerClave(clave) === null) {
        localStorage.removeItem(clave);
      }
    }
  } catch {
    // Ignorable: la recogida de basura es oportunista.
  }
}
