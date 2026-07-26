import { heroui } from '@heroui/theme';
import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // Glob amplio a proposito: enumerar los componentes de HeroUI uno a uno
    // hace que anadir uno nuevo se traduzca en estilos silenciosamente
    // ausentes solo en produccion.
    './node_modules/@heroui/theme/dist/**/*.{js,mjs}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F7F7F9',
        surface: '#FFFFFF',
        /**
         * La mesa de trabajo del estudio: mas oscura que el lienzo para que la
         * hoja blanca se lea como un objeto apoyado encima y no como el fondo
         * de la pagina. Es lo que hacen todos los editores de imagen.
         */
        workspace: '#E4E4EA',
        ink: {
          DEFAULT: '#27272A',
          muted: '#71717A',
          faint: '#A1A1AA',
        },
        line: '#E4E4E7',
        /**
         * Un unico acento, y solo en la interfaz: botones, estado activo y
         * foco. Las tarjetas de la galeria se quedan neutras para que el color
         * de los dibujos no compita con el de la aplicacion.
         */
        brand: {
          DEFAULT: '#6366F1',
          soft: '#EEF0FE',
          dark: '#5254D6',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        // La monoespaciada sobrevive solo donde aporta: el valor hexadecimal
        // del color, que se lee mejor con ancho fijo.
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(39, 39, 42, 0.04), 0 4px 16px -8px rgba(39, 39, 42, 0.12)',
        lift: '0 2px 4px rgba(39, 39, 42, 0.06), 0 12px 28px -12px rgba(39, 39, 42, 0.2)',
      },
    },
  },
  plugins: [heroui()],
} satisfies Config;
