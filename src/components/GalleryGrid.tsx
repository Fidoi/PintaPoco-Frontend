import type { Drawing } from '@/lib/drawings';

import { DrawingCard } from './DrawingCard';

interface GalleryGridProps {
  drawings: Drawing[];
  admin?: boolean;
}

export function GalleryGrid({ drawings, admin = false }: GalleryGridProps) {
  return (
    // Rejilla uniforme, no masonry: todas las obras comparten la proporcion del
    // lienzo, asi que una retícula regular es lo correcto y ahorra la
    // complejidad de un layout que aqui no aportaria nada.
    <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
      {drawings.map((drawing, indice) => (
        <DrawingCard
          key={drawing.id}
          drawing={drawing}
          priority={indice < 3}
          admin={admin}
        />
      ))}
    </div>
  );
}
