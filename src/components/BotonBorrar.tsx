'use client';

import { Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';

import { borrarDibujo } from '@/actions/admin';

/**
 * Confirmacion en dos pasos en lugar de `confirm()`: el dialogo nativo bloquea
 * el hilo, no se puede estilar y en movil aparece descolgado del elemento que
 * lo lanzo. Aqui la confirmacion sucede donde estaba el dedo.
 */
export function BotonBorrar({ id, titulo }: { id: string; titulo: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const borrar = () => {
    startTransition(async () => {
      const resultado = await borrarDibujo(id);
      if (!resultado.ok) {
        setError(resultado.error);
        setConfirmando(false);
      }
      // Si sale bien no hay que limpiar nada: `revalidatePath` hace que la
      // tarjeta desaparezca de la lista.
    });
  };

  if (error) {
    return (
      <span className='rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white'>
        {error}
      </span>
    );
  }

  if (confirmando) {
    return (
      <span className='flex items-center gap-1'>
        <button
          type='button'
          onClick={borrar}
          disabled={isPending}
          className='rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60'
        >
          {isPending ? 'Borrando' : 'Confirmar'}
        </button>
        <button
          type='button'
          onClick={() => setConfirmando(false)}
          disabled={isPending}
          className='rounded-lg bg-surface px-2 py-1 text-xs font-semibold text-ink-muted shadow-sm transition hover:text-ink'
        >
          No
        </button>
      </span>
    );
  }

  return (
    <button
      type='button'
      onClick={() => setConfirmando(true)}
      title={`Borrar "${titulo}"`}
      aria-label={`Borrar "${titulo}"`}
      className='rounded-lg bg-surface/90 p-1.5 text-ink-muted shadow-sm backdrop-blur transition hover:bg-red-600 hover:text-white'
    >
      <Trash2 className='h-4 w-4' />
    </button>
  );
}
