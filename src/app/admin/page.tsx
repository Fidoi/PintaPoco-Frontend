import type { Metadata } from 'next';
import Link from 'next/link';

import { cerrarSesionAdmin } from '@/actions/admin';
import { AdminLoginForm } from '@/components/ui/AdminLoginForm';
import { SiteFooter } from '@/components/ui/SiteFooter';
import { adminDisponible, esAdmin } from '@/lib/admin';

export const metadata: Metadata = {
  title: 'Moderacion',
  robots: { index: false, follow: false },
};

/**
 * Nunca prerenderizar.
 *
 * `esAdmin()` sale antes de tocar `cookies()` cuando no hay `ADMIN_SECRET`, asi
 * que Next no detecta ninguna API dinamica y congela la pagina en build. El
 * resultado seria que el modo de render depende de si la variable existia al
 * compilar, y una pagina cuyo contenido depende de una cookie no puede
 * servirse desde cache estatica.
 */
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const disponible = adminDisponible();
  const activa = await esAdmin();

  return (
    <>
      <main className='mx-auto w-full max-w-sm px-6 py-20'>
        <h1 className='text-2xl font-bold text-ink'>Moderacion</h1>
        <p className='mb-6 mt-2 text-sm leading-relaxed text-ink-muted'>
          Permite retirar dibujos de la galeria. La sesion dura ocho horas.
        </p>

        {!disponible ? (
          <p className='rounded-xl border border-line bg-surface p-4 text-sm text-ink-muted'>
            Falta la variable <code className='font-mono'>ADMIN_SECRET</code> en
            el entorno. Mientras no exista, el modo moderacion permanece
            desactivado.
          </p>
        ) : activa ? (
          <div className='flex flex-col gap-4'>
            <p className='rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800'>
              Sesion activa. En la galeria veras un boton de retirada sobre cada
              dibujo.
            </p>

            <Link
              href='/gallery'
              className='rounded-xl bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-dark'
            >
              Ir a la galeria
            </Link>

            <form action={cerrarSesionAdmin}>
              <button
                type='submit'
                className='w-full rounded-xl py-2 text-sm text-ink-muted transition hover:text-ink'
              >
                Cerrar sesion
              </button>
            </form>
          </div>
        ) : (
          <AdminLoginForm />
        )}
      </main>

      <SiteFooter />
    </>
  );
}
