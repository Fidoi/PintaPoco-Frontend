import type { Metadata } from 'next';
import { Geist_Mono, Nunito } from 'next/font/google';

import { SiteHeader } from '@/components/ui/SiteHeader';

import { Providers } from './providers';
import './globals.css';

/** Terminaciones redondeadas: la unica decision tipografica del proyecto. */
const sans = Nunito({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'PintaPoco — dibuja y comparte',
    template: '%s · PintaPoco',
  },
  description:
    'Dibuja en el navegador y publica tu obra en una galeria abierta. Next.js, React Konva y Vercel Blob.',
  openGraph: {
    title: 'PintaPoco',
    description:
      'Dibuja en el navegador y publica tu obra en una galeria abierta.',
    type: 'website',
  },
};

/**
 * El layout raiz solo aporta la cabecera, de alto fijo y conocido (`h-16`).
 *
 * El pie lo monta cada pagina que hace scroll, porque el estudio ocupa la
 * pantalla completa y necesita restar exactamente el alto de la cabecera para
 * calcular el suyo.
 */
export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang='es'>
      <body className={`${sans.variable} ${geistMono.variable} font-sans`}>
        <Providers>
          <SiteHeader />
          {children}
          {modal}
        </Providers>
      </body>
    </html>
  );
}
