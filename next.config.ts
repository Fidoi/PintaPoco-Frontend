import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Cada store de Blob recibe su propio subdominio, de ahi el comodin.
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
    // Las obras se sirven siempre en 16:9; no hacen falta los ocho tamanos por
    // defecto de Next. El techo es el ancho de exportacion del lienzo.
    imageSizes: [128, 256, 384],
    deviceSizes: [640, 828, 1080, 1600],
  },

  /**
   * Konva trae un build de Node (`index-node.js`) que importa el paquete nativo
   * `canvas`. El empaquetador resuelve ese import aunque el componente se cargue
   * con `ssr: false`, y el build falla si no esta instalado.
   *
   * La salida no es instalarlo —son decenas de MB de binarios para renderizar en
   * servidor algo que solo se dibuja en el navegador— sino cortar la rama del
   * grafo. Hay que hacerlo dos veces porque `dev` usa Turbopack y `build` usa
   * webpack.
   */
  webpack: (config) => {
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    return config;
  },

  experimental: {
    turbo: {
      resolveAlias: {
        canvas: './src/lib/empty-module.ts',
      },
    },
  },
};

export default nextConfig;
