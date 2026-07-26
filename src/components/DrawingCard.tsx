import Image from 'next/image';
import Link from 'next/link';

import type { Drawing } from '@/lib/drawings';

import { BotonBorrar } from './BotonBorrar';

interface DrawingCardProps {
  drawing: Drawing;
  /** Las primeras filas se cargan con prioridad; el resto en diferido. */
  priority?: boolean;
  /** Muestra el control de retirada. Solo decide la vista: quien puede borrar
   *  de verdad lo decide el servidor al recibir la accion. */
  admin?: boolean;
}

export function DrawingCard({
  drawing,
  priority = false,
  admin = false,
}: DrawingCardProps) {
  return (
    // `article` en vez de envolverlo todo en el enlace: el boton de borrar no
    // puede vivir dentro de un `<a>` —seria HTML invalido y un clic ambiguo—
    // asi que va como hermano por encima.
    <article className='mat group relative transition duration-200 hover:-translate-y-1 hover:shadow-lift'>
      <Link
        href={`/d/${drawing.id}`}
        // `scroll={false}` evita el salto al abrir el modal interceptado.
        scroll={false}
        className='block rounded-lg focus:outline-none'
      >
        <div className='relative aspect-video overflow-hidden rounded-xl bg-paper'>
          <Image
            src={drawing.imageUrl}
            alt={drawing.title}
            fill
            // Sin `sizes` Next serviria el original de 1600px en todas las
            // celdas. Con el, cada hueco recibe la variante que le corresponde.
            sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
            priority={priority}
            className='object-cover'
          />

          {drawing.isNew && (
            <span className='absolute right-2 top-2 rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-white'>
              Nuevo
            </span>
          )}
        </div>

        <div className='px-1 pb-1 pt-3'>
          <p className='truncate font-semibold text-ink'>{drawing.title}</p>
          <time
            dateTime={drawing.uploadedAt}
            className='text-sm text-ink-faint'
          >
            {new Date(drawing.uploadedAt).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </time>
        </div>
      </Link>

      {admin && (
        <div className='absolute left-5 top-5 z-10'>
          <BotonBorrar id={drawing.id} titulo={drawing.title} />
        </div>
      )}
    </article>
  );
}
