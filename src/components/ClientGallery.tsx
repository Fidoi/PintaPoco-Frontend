'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card } from '@heroui/card';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from '@heroui/modal';
import { Drawing } from '@/actions';
import { Chip } from '@heroui/chip';

interface ClientGalleryProps {
  drawings: Drawing[];
}

export const ClientGallery: React.FC<ClientGalleryProps> = ({ drawings }) => {
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleCardClick = (drawing: Drawing) => {
    setSelectedDrawing(drawing);
    onOpen();
  };

  return (
    <div>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
        {drawings.map((drawing) => (
          <Card
            key={drawing.id}
            className='cursor-pointer border p-2 rounded hover:shadow-lg'
            isPressable
            onPress={() => handleCardClick(drawing)}
          >
            {drawing.isNew && (
              <Chip
                classNames={{
                  base: 'bg-secondary ',
                  content: 'drop-shadow shadow-black ',
                }}
                variant='shadow'
              >
                Nuevo
              </Chip>
            )}
            <Image
              src={drawing.imageUrl}
              alt={drawing.name}
              height={500}
              width={500}
              className='w-full h-auto'
            />
            <p className='text-center mt-2 font-semibold'>{`"${drawing.name}"`}</p>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size='5xl'
        className='bg-gray-200'
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className='flex flex-col gap-1 items-center'>
                <h2 className='text-5xl'>{`"${selectedDrawing?.name}"`}</h2>
              </ModalHeader>
              <ModalBody>
                {selectedDrawing && (
                  <Image
                    src={selectedDrawing.imageUrl}
                    alt={selectedDrawing.name}
                    height={500}
                    width={500}
                    className='w-full h-auto'
                  />
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};
