'use client';

import { HeroUIProvider } from '@heroui/system';
import { useRouter } from 'next/navigation';

/**
 * HeroUI necesita este proveedor para el tema y, sobre todo, para portales y
 * overlays: sin el, los modales se montan fuera del arbol de estilos. Pasarle
 * el `router` hace que sus componentes de navegacion usen el enrutado cliente
 * de Next en vez de recargar la pagina entera.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return <HeroUIProvider navigate={router.push}>{children}</HeroUIProvider>;
}
