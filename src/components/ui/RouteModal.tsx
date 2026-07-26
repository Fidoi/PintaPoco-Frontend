'use client';

import { Modal, ModalBody, ModalContent } from '@heroui/modal';
import { useRouter } from 'next/navigation';

/**
 * Envoltorio del modal interceptado.
 *
 * Cerrar hace `router.back()` en lugar de navegar a una ruta fija: el modal
 * ocupa una entrada del historial, asi que retroceder devuelve al visitante
 * exactamente de donde vino y el boton "atras" del navegador se comporta igual
 * que la X.
 */
export function RouteModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <Modal
      isOpen
      onOpenChange={(abierto) => {
        if (!abierto) router.back();
      }}
      size='4xl'
      scrollBehavior='inside'
      classNames={{
        base: 'bg-paper',
        backdrop: 'bg-ink/50 backdrop-blur-sm',
        closeButton: 'text-ink-muted hover:bg-ink/5',
      }}
    >
      <ModalContent>
        <ModalBody className='p-6'>{children}</ModalBody>
      </ModalContent>
    </Modal>
  );
}
