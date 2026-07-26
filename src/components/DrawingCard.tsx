import Image from 'next/image';
import Link from 'next/link';

import type { Drawing } from '@/lib/drawings';

interface DrawingCardProps {
  drawing: Drawing;
  /** Las primeras filas se cargan con prioridad; el resto en diferido. */
  priority?: boolean;
}

export function DrawingCard({ drawing, priority = false }: DrawingCardProps) {
  return (
    <Link
      href={`/d/${drawing.id}`}
      // `scroll={false}` evita el salto al abrir el modal interceptado.
      scroll={false}
      className='mat group block transition duration-200 hover:-translate-y-1 hover:shadow-lift'
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
        <time dateTime={drawing.uploadedAt} className='text-sm text-ink-faint'>
          {new Date(drawing.uploadedAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </time>
      </div>
    </Link>
  );
}
