'use client';

import { Alert } from '@heroui/alert';
import { Button } from '@heroui/button';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useState, useTransition } from 'react';

import { saveDrawing } from '@/actions';
import { MAX_TITLE_LENGTH } from '@/config/gallery';

/**
 * Konva habla directamente con `window` y `document` al construirse, asi que
 * romperia el render de servidor. Cargarlo con `ssr: false` lo saca del bundle
 * del servidor y deja el resto de la pagina renderizando en el.
 */
const Canvas = dynamic(() => import('../Canvas'), {
  ssr: false,
  loading: () => (
    <div className='flex h-full w-full items-center justify-center bg-workspace'>
      <div className='h-3/4 w-3/4 animate-pulse rounded-xl bg-black/5' />
    </div>
  ),
});

type Estado =
  | { tipo: 'inactivo' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; id: string };

/** Alto de la cabecera del sitio. El estudio ocupa lo que queda. */
const ALTO_ESTUDIO = 'lg:h-[calc(100dvh-4rem)]';

export function Frame() {
  const [title, setTitle] = useState('');
  const [estado, setEstado] = useState<Estado>({ tipo: 'inactivo' });
  const [isPending, startTransition] = useTransition();

  const handleSave = useCallback(
    (dataUrl: string) => {
      if (!title.trim()) {
        setEstado({
          tipo: 'error',
          mensaje: 'Ponle un titulo antes de publicar.',
        });
        return;
      }

      startTransition(async () => {
        const resultado = await saveDrawing(title, dataUrl);

        // El resultado del servidor manda. Antes se anunciaba exito siempre,
        // incluso cuando la peticion habia fallado.
        setEstado(
          resultado.ok
            ? { tipo: 'listo', id: resultado.id }
            : { tipo: 'error', mensaje: resultado.error }
        );
      });
    },
    [title]
  );

  return (
    <div className={`relative flex flex-col ${ALTO_ESTUDIO} lg:overflow-hidden`}>
      {/* Barra de documento: lo que identifica a la obra, separado de las
          herramientas de dibujo, que viven en el panel lateral. */}
      <div className='flex shrink-0 items-center gap-3 border-b border-line bg-paper px-4 py-2'>
        <label htmlFor='titulo' className='sr-only'>
          Titulo del dibujo
        </label>
        <input
          id='titulo'
          type='text'
          value={title}
          onChange={(evento) => setTitle(evento.target.value)}
          maxLength={MAX_TITLE_LENGTH}
          placeholder='Sin titulo'
          autoComplete='off'
          className='w-full max-w-xs rounded-lg border border-transparent bg-transparent px-2.5 py-1.5 font-semibold text-ink transition placeholder:font-normal placeholder:text-ink-faint hover:border-line focus:border-brand focus:bg-surface focus:outline-none'
        />
      </div>

      <div className='min-h-0 flex-1'>
        <Canvas onSave={handleSave} isSaving={isPending} />
      </div>

      {/* Aviso flotante: en un lienzo a pantalla completa un bloque en el flujo
          desplazaria el area de dibujo cada vez que aparece. */}
      {estado.tipo !== 'inactivo' && (
        <div className='pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4'>
          <div className='pointer-events-auto w-full max-w-md shadow-lift'>
            {estado.tipo === 'error' ? (
              <Alert
                color='danger'
                variant='solid'
                title='No se pudo publicar'
                description={estado.mensaje}
                onClose={() => setEstado({ tipo: 'inactivo' })}
              />
            ) : (
              <Alert
                color='success'
                variant='solid'
                title='Listo, ya esta en la galeria'
                onClose={() => setEstado({ tipo: 'inactivo' })}
                endContent={
                  <Button
                    as={Link}
                    href={`/d/${estado.id}`}
                    size='sm'
                    variant='flat'
                  >
                    Verlo
                  </Button>
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
