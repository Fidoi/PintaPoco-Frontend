import Image from 'next/image';

import type { Drawing } from '@/lib/drawings';

/**
 * Vista unica de una obra, compartida por la pagina completa y por el modal
 * interceptado. Ese es el motivo de que exista como componente propio: la ruta
 * decide el envoltorio, nunca el contenido.
 */
export function DrawingDetail({ drawing }: { drawing: Drawing }) {
  return (
    <figure className='flex flex-col gap-4'>
      <div className='mat'>
        <div className='relative aspect-video w-full overflow-hidden rounded-xl bg-paper'>
          <Image
            src={drawing.imageUrl}
            alt={drawing.title}
            fill
            sizes='(max-width: 1024px) 100vw, 900px'
            priority
            className='object-contain'
          />
        </div>
      </div>

      <figcaption className='flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1'>
        <h1 className='text-2xl font-bold text-ink'>{drawing.title}</h1>
        <time dateTime={drawing.uploadedAt} className='text-sm text-ink-faint'>
          {new Date(drawing.uploadedAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </time>
      </figcaption>
    </figure>
  );
}
