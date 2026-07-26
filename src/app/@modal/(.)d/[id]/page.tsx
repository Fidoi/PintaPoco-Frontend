import { notFound } from 'next/navigation';

import { DrawingDetail } from '@/components';
import { RouteModal } from '@/components/ui/RouteModal';
import { getDrawing } from '@/data/drawings';

/**
 * Ruta interceptada: al llegar desde la galeria con navegacion cliente, esto
 * sustituye a `/d/[id]` y la obra se abre en modal. Al entrar por enlace
 * directo o recargar, Next sirve la pagina completa. Misma URL, dos
 * presentaciones, un solo `DrawingDetail`.
 */
export default async function InterceptedDrawingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const drawing = await getDrawing(id);

  if (!drawing) notFound();

  return (
    <RouteModal>
      <DrawingDetail drawing={drawing} />
    </RouteModal>
  );
}
