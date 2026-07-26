'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ENLACES = [
  { href: '/', etiqueta: 'Estudio' },
  { href: '/gallery', etiqueta: 'Galeria' },
] as const;

/**
 * Cabecera persistente.
 *
 * Antes cada pagina llevaba su propio titulo y su propio boton para saltar a la
 * otra: dos pantallas sueltas en vez de un producto. Una barra fija con estado
 * activo le dice al visitante donde esta y que hay dos sitios donde estar.
 */
export function SiteHeader() {
  const pathname = usePathname();

  return (
    // `h-16` explicito: el estudio calcula su alto restando exactamente esto.
    <header className='sticky top-0 z-40 h-16 border-b border-line bg-paper/85 backdrop-blur-md'>
      <div className='mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-6 px-6'>
        <Link href='/' className='text-xl font-bold text-ink'>
          PintaPoco
        </Link>

        <nav className='flex items-center gap-1'>
          {ENLACES.map(({ href, etiqueta }) => {
            const activo =
              href === '/' ? pathname === '/' : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={activo ? 'page' : undefined}
                className={`rounded-xl px-3 py-1.5 text-sm font-semibold transition ${
                  activo
                    ? 'bg-brand-soft text-brand-dark'
                    : 'text-ink-muted hover:bg-ink/5 hover:text-ink'
                }`}
              >
                {etiqueta}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
