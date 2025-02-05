'use client';
import dynamic from 'next/dynamic';
import React, { useState } from 'react';

import { postDrawings } from '@/actions';
import { Alert } from '@heroui/alert';
import { Input } from '@heroui/input';

import { Button } from '@nextui-org/react';
import { useRouter } from 'next/navigation';

const Canvas = dynamic(() => import('../Canvas'), { ssr: false });

export const Frame = () => {
  const [title, setTitle] = useState<string>('');
  const [isVisible, setIsVisible] = React.useState(true);
  const [savedMessage, setSavedMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const router = useRouter();

  const handleSave = (dataUrl: string) => {
    setSavedMessage('');
    if (!title.trim()) {
      setIsVisible(true);
      setErrorMessage('Por favor, ingresa un título para el dibujo.');

      return;
    }

    setErrorMessage('');

    return (
      postDrawings(title, dataUrl)
        .then(() => {
          setIsVisible(true);
          setSavedMessage('Ve a la galería para verlo.');
        })
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .catch((error) => {
          setIsVisible(true);
          setErrorMessage('Hubo un problema al guardar el dibujo.');
        })
    );
  };

  const handleUpgradeClick = () => {
    router.push('/gallery');
  };

  return (
    <>
      <div className='flex w-full justify-between items-center'>
        <div className='w-20'></div>
        <h1 className='text-5xl font-bold mb-4'>🎨 PintaPoco 🎨</h1>
        <div className='mb-4'>
          <Button
            onPress={handleUpgradeClick}
            color='warning'
            variant='solid'
            size='lg'
            radius='sm'
          >
            🖼️ Galeria
          </Button>
        </div>
      </div>

      <div>
        <div className='mt-2 mb-2'>
          <label className='mr-2 font-bold'>Título de la obra 😎:</label>
          <Input
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className='p-1 rounded max-w-xs'
            variant='faded'
          />
        </div>
        <Canvas onSave={handleSave} />
        <div className='mt-2'>
          {errorMessage && (
            <Alert
              title='Error'
              description={errorMessage}
              color='danger'
              variant='faded'
              isVisible={isVisible}
              onClose={() => setIsVisible(false)}
            />
          )}
          {savedMessage && (
            <Alert
              title='¡Dibujo subido exitosamente!'
              description={savedMessage}
              color='success'
              variant='solid'
              isVisible={isVisible}
              onClose={() => setIsVisible(false)}
            />
          )}
        </div>
      </div>
    </>
  );
};
