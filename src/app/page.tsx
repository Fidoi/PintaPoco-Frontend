import { Frame } from '@/components';

/**
 * Server Component: la interactividad vive dentro de `Frame`, que si es
 * cliente. Marcar la pagina entera como `'use client'` arrastraba al bundle
 * codigo que no lo necesita.
 *
 * Sin contenedor ni ancho maximo: el estudio ocupa la pantalla entera.
 */
export default function Page() {
  return <Frame />;
}
