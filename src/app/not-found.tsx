import Link from 'next/link';

export default function NotFound() {
  return (
    <main className='mx-auto flex w-full max-w-md flex-col items-center gap-3 px-6 py-24 text-center'>
      <p className='text-sm font-semibold text-ink-faint'>Error 404</p>
      <h1 className='text-3xl font-bold text-ink'>Este dibujo ya no esta</h1>
      <p className='text-sm leading-relaxed text-ink-muted'>
        La galeria guarda un numero limitado de dibujos, asi que los mas
        antiguos van dejando sitio a los nuevos.
      </p>
      <Link
        href='/gallery'
        className='mt-3 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark'
      >
        Ver la galeria
      </Link>
    </main>
  );
}
