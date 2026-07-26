'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { iniciarSesionAdmin } from '@/actions/admin';

export function AdminLoginForm() {
  const [secreto, setSecreto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const enviar = (evento: React.FormEvent) => {
    evento.preventDefault();
    setError(null);

    startTransition(async () => {
      const resultado = await iniciarSesionAdmin(secreto);
      if (resultado.ok) {
        setSecreto('');
        // `refresh` revalida el arbol de servidor, que es quien decide si la
        // sesion existe. Sin esto la pagina seguiria mostrando el formulario.
        router.refresh();
      } else {
        setError(resultado.error);
      }
    });
  };

  return (
    <form onSubmit={enviar} className='flex flex-col gap-3'>
      <input
        type='password'
        value={secreto}
        onChange={(evento) => setSecreto(evento.target.value)}
        placeholder='Secreto de moderacion'
        autoComplete='current-password'
        className='rounded-xl border border-line bg-surface px-3.5 py-2.5 text-ink transition placeholder:text-ink-faint focus:border-brand focus:outline-none'
      />

      <button
        type='submit'
        disabled={isPending || secreto.length === 0}
        className='rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50'
      >
        {isPending ? 'Comprobando' : 'Entrar'}
      </button>

      {error && (
        <p role='alert' className='text-sm text-red-600'>
          {error}
        </p>
      )}
    </form>
  );
}
