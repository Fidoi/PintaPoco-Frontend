import { ChevronLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DrawingDetail } from '@/components';
import { SiteFooter } from '@/components/ui/SiteFooter';
import { getDrawing } from '@/data/drawings';

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const drawing = await getDrawing(id);

  if (!drawing) return { title: 'Obra no encontrada' };

  return {
    title: drawing.title,
    description: `"${drawing.title}", publicada en la galeria de PintaPoco.`,
    // Contenido subido por terceros bajo nuestro dominio: se muestra, pero no
    // se indexa.
    robots: { index: false, follow: false },
    openGraph: {
      title: drawing.title,
      images: [{ url: drawing.imageUrl, width: 1600, height: 900 }],
    },
  };
}

export default async function DrawingPage({ params }: PageProps) {
  const { id } = await params;
  const drawing = await getDrawing(id);

  if (!drawing) notFound();

  return (
    <>
      <main className='mx-auto w-full max-w-4xl px-6 py-12'>
        <Link
          href='/gallery'
          className='mb-6 inline-flex items-center gap-1 text-sm font-semibold text-ink-muted transition hover:text-brand'
        >
          <ChevronLeft className='h-3.5 w-3.5' />
          Volver a la galeria
        </Link>

        <DrawingDetail drawing={drawing} />
      </main>

      <SiteFooter />
    </>
  );
}
