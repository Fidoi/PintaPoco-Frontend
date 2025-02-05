'use client';

import { Frame } from '@/components';
import { Card } from '@heroui/card';

export default function Page() {
  return (
    <div className='min-h-screen flex flex-col items-center py-10'>
      <Card className='flex flex-col items-center bg-slate-400 p-4'>
        <Frame />
      </Card>
    </div>
  );
}
