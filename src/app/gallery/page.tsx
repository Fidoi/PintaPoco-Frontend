import type { Metadata } from 'next';
import Link from 'next/link';

import { GalleryGrid, GalleryNotice } from '@/components';
import { SiteFooter } from '@/components/ui/SiteFooter';
import { FEATURED_IDS, PAGE_SIZE } from '@/config/gallery';
import { getDrawings } from '@/data/drawings';
import type { Drawing } from '@/lib/drawings';

export const metadata: Metadata = {
  title: 'Galeria',
  description: 'Dibujos publicados por quien pasa por aqui.',
};

type PageProps = { searchParams: Promise<{ page?: string }> };

export default async function GalleryPage({ searchParams }: PageProps) {
  const [{ page }, resultado] = await Promise.all([
    searchParams,
    getDrawings(),
  ]);

  return (
    <>
      <main className='mx-auto w-full max-w-6xl px-6 py-10'>
        <header className='mb-10 max-w-xl'>
          <h1 className='text-3xl font-bold text-ink sm:text-4xl'>Galeria</h1>
          <p className='mt-2 text-ink-muted'>
            Todo lo que ha pasado por el lienzo. Sin cuentas ni firmas: solo un
            titulo y una fecha.
          </p>
        </header>

        {!resultado.ok ? (
          <GalleryNotice motivo={resultado.reason} />
        ) : (
          <GalleryContent drawings={resultado.drawings} page={page} />
        )}
      </main>

      <SiteFooter />
    </>
  );
}

function GalleryContent({
  drawings,
  page,
}: {
  drawings: Drawing[];
  page?: string;
}) {
  if (drawings.length === 0) return <GalleryNotice motivo='empty' />;

  const porId = new Map(drawings.map((drawing) => [drawing.id, drawing]));
  const destacadas = FEATURED_IDS.map((id) => porId.get(id)).filter(
    (drawing): drawing is Drawing => drawing !== undefined
  );

  const idsDestacados = new Set(destacadas.map((drawing) => drawing.id));
  const recientes = drawings.filter(
    (drawing) => !idsDestacados.has(drawing.id)
  );

  const totalPaginas = Math.max(1, Math.ceil(recientes.length / PAGE_SIZE));
  const paginaActual = Math.min(
    Math.max(1, Number.parseInt(page ?? '1', 10) || 1),
    totalPaginas
  );
  const visibles = recientes.slice(
    (paginaActual - 1) * PAGE_SIZE,
    paginaActual * PAGE_SIZE
  );

  return (
    <div className='flex flex-col gap-12'>
      {destacadas.length > 0 && (
        <section>
          <SectionTitle titulo='Destacados' nota='Nuestra seleccion' />
          <GalleryGrid drawings={destacadas} />
        </section>
      )}

      <section>
        <SectionTitle
          titulo='Recientes'
          nota={`${recientes.length} ${
            recientes.length === 1 ? 'dibujo' : 'dibujos'
          }`}
        />
        <GalleryGrid drawings={visibles} />

        {totalPaginas > 1 && (
          <Paginacion actual={paginaActual} total={totalPaginas} />
        )}
      </section>
    </div>
  );
}

function SectionTitle({ titulo, nota }: { titulo: string; nota: string }) {
  return (
    <div className='mb-4 flex items-baseline justify-between gap-4'>
      <h2 className='text-xl font-bold text-ink'>{titulo}</h2>
      <span className='text-sm text-ink-faint'>{nota}</span>
    </div>
  );
}

/**
 * Paginacion con enlaces reales en lugar de scroll infinito: cada pagina tiene
 * URL propia, funciona sin JavaScript y no penaliza al visitante que solo mira
 * las primeras filas.
 */
function Paginacion({ actual, total }: { actual: number; total: number }) {
  const claseEnlace =
    'rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink-muted transition hover:border-brand hover:text-brand';
  const claseInerte =
    'px-4 py-2 text-sm font-semibold text-ink-faint/50';

  return (
    <nav
      className='mt-8 flex items-center justify-center gap-4'
      aria-label='Paginacion de la galeria'
    >
      {actual > 1 ? (
        <Link href={`/gallery?page=${actual - 1}`} className={claseEnlace}>
          Anteriores
        </Link>
      ) : (
        <span className={claseInerte}>Anteriores</span>
      )}

      <span className='text-sm text-ink-muted'>
        {actual} / {total}
      </span>

      {actual < total ? (
        <Link href={`/gallery?page=${actual + 1}`} className={claseEnlace}>
          Siguientes
        </Link>
      ) : (
        <span className={claseInerte}>Siguientes</span>
      )}
    </nav>
  );
}
