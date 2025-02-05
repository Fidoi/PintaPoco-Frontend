export const revalidate = 0;

import { getDrawings } from '@/actions';
import { ClientGallery } from '@/components';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Divider } from '@nextui-org/react';
import { notFound } from 'next/navigation';

export default async function GalleryPage() {
  const drawings = await getDrawings();
  if (!drawings) {
    notFound();
  }

  return (
    <div className='p-10 flex flex-col items-center'>
      <div className='flex w-full justify-between items-center'>
        <Link
          href='/'
          className='rounded-xl px-2 py-3 mr-2 bg-success flex flex-row'
        >
          <ChevronLeft />
          Volver
        </Link>

        <div className='flex-1 text-center'>
          <h1 className='text-3xl font-bold mb-6'>Galería de Dibujos</h1>
        </div>

        <div className='w-20'></div>
      </div>
      <Divider className='my-5' />
      <ClientGallery drawings={drawings} />
    </div>
  );
}
