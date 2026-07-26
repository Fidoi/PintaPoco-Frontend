import { ImageOff, PlugZap, TriangleAlert } from 'lucide-react';
import Link from 'next/link';

type Motivo = 'unconfigured' | 'error' | 'empty';

const MENSAJES: Record<
  Motivo,
  { icono: typeof ImageOff; titulo: string; detalle: string }
> = {
  empty: {
    icono: ImageOff,
    titulo: 'Aqui no hay nada todavia',
    detalle: 'Nadie ha subido ningun dibujo. Puede ser el tuyo el primero.',
  },
  unconfigured: {
    icono: PlugZap,
    titulo: 'Almacenamiento sin conectar',
    detalle:
      'Falta la variable BLOB_READ_WRITE_TOKEN. El README explica como enlazar un store de Vercel Blob.',
  },
  error: {
    icono: TriangleAlert,
    titulo: 'No se pudo cargar la galeria',
    detalle: 'El almacenamiento no respondio. Vuelve a intentarlo en un rato.',
  },
};

/**
 * Tres estados distintos con tres mensajes distintos. Colapsarlos en una lista
 * vacia —como hacia la version anterior— le decia al visitante que no hay obras
 * cuando en realidad el servicio estaba caido.
 */
export function GalleryNotice({ motivo }: { motivo: Motivo }) {
  const { icono: Icono, titulo, detalle } = MENSAJES[motivo];

  return (
    <div className='flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-line px-6 py-16 text-center'>
      <Icono className='h-8 w-8 text-ink-faint' aria-hidden />
      <h2 className='text-lg font-bold text-ink'>{titulo}</h2>
      <p className='max-w-sm text-sm leading-relaxed text-ink-muted'>
        {detalle}
      </p>

      {motivo === 'empty' && (
        <Link
          href='/'
          className='mt-3 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark'
        >
          Dibujar el primero
        </Link>
      )}
    </div>
  );
}
