'use client';

import { Alert } from '@heroui/alert';
import { Button } from '@heroui/button';
import { RotateCcw, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

import { saveDrawing } from '@/actions';
import { MAX_TITLE_LENGTH } from '@/config/gallery';
import {
  borrar as borrarBorrador,
  borrarClave,
  guardar as guardarBorrador,
  idPestana,
  leer as leerBorrador,
  leerHuerfano,
  type Borrador,
} from '@/lib/borrador';
import type { Instantanea } from '@/lib/lienzo';

/**
 * Konva habla directamente con `window` y `document` al construirse, asi que
 * romperia el render de servidor. Cargarlo con `ssr: false` lo saca del bundle
 * del servidor y deja el resto de la pagina renderizando en el.
 */
const Canvas = dynamic(() => import('../Canvas'), {
  ssr: false,
  loading: () => (
    <div className='flex h-full w-full items-center justify-center bg-workspace'>
      <div className='h-3/4 w-3/4 animate-pulse rounded-xl bg-black/5' />
    </div>
  ),
});

type Estado =
  | { tipo: 'inactivo' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; id: string };

/** Alto de la cabecera del sitio. El estudio ocupa lo que queda. */
const ALTO_ESTUDIO = 'lg:h-[calc(100dvh-4rem)]';

/** Margen tras el ultimo cambio antes de escribir en disco. */
const RETARDO_GUARDADO = 800;

export function Frame() {
  const [title, setTitle] = useState('');
  const [estado, setEstado] = useState<Estado>({ tipo: 'inactivo' });
  const [isPending, startTransition] = useTransition();

  const [borradorInicial, setBorradorInicial] = useState<Instantanea | null>(
    null
  );
  // Cambiar la `key` remonta el lienzo con el estado recuperado. Es mas simple
  // y menos fragil que exponer un metodo imperativo a traves de `dynamic`.
  const [claveLienzo, setClaveLienzo] = useState(0);
  const [huerfano, setHuerfano] = useState<{
    clave: string;
    datos: Borrador;
  } | null>(null);

  const pestanaRef = useRef<string>('');
  const datosRef = useRef<{ titulo: string; instantanea: Instantanea | null }>({
    titulo: '',
    instantanea: null,
  });
  const temporizadorRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const guardarAhora = useCallback(() => {
    const { titulo, instantanea } = datosRef.current;
    if (!pestanaRef.current) return;

    // Un lienzo en blanco y sin titulo no es trabajo que perder; guardarlo solo
    // dejaria una clave por cada visita.
    if (!instantanea?.trazos.length && !titulo.trim()) return;

    guardarBorrador(pestanaRef.current, {
      titulo,
      trazos: instantanea?.trazos ?? [],
      fondo: instantanea?.fondo ?? '#FFFFFF',
    });
  }, []);

  const programarGuardado = useCallback(() => {
    if (temporizadorRef.current) clearTimeout(temporizadorRef.current);
    temporizadorRef.current = setTimeout(guardarAhora, RETARDO_GUARDADO);
  }, [guardarAhora]);

  // Recuperacion al montar. Se hace en un efecto porque `localStorage` no
  // existe durante el render de servidor.
  useEffect(() => {
    const id = idPestana();
    pestanaRef.current = id;

    const propio = leerBorrador(id);
    if (propio) {
      // Es el trabajo de esta misma pestana tras una recarga: se restaura sin
      // preguntar, porque la continuidad es lo que el usuario espera.
      adoptar(propio);
      return;
    }

    // Viene de otra pestana o de una sesion anterior del navegador: es
    // ambiguo, asi que se ofrece en vez de imponerse.
    setHuerfano(leerHuerfano(id));
  }, []);

  /**
   * Guardado final al ocultarse la pagina.
   *
   * `pagehide` y `visibilitychange` en lugar de `beforeunload`: este ultimo no
   * se dispara de forma fiable en Safari ni en moviles, que es justo donde se
   * pierde el trabajo al cambiar de aplicacion.
   */
  useEffect(() => {
    const alOcultarse = () => guardarAhora();
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === 'hidden') guardarAhora();
    };

    window.addEventListener('pagehide', alOcultarse);
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    return () => {
      window.removeEventListener('pagehide', alOcultarse);
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
    };
  }, [guardarAhora]);

  function adoptar(borrador: Borrador) {
    datosRef.current = {
      titulo: borrador.titulo,
      instantanea: { trazos: borrador.trazos, fondo: borrador.fondo },
    };
    setTitle(borrador.titulo);
    setBorradorInicial({ trazos: borrador.trazos, fondo: borrador.fondo });
    setClaveLienzo((previo) => previo + 1);
  }

  const recuperarHuerfano = () => {
    if (!huerfano) return;
    adoptar(huerfano.datos);
    // Ya vive bajo la clave de esta pestana; dejar la vieja lo ofreceria otra vez.
    borrarClave(huerfano.clave);
    setHuerfano(null);
    programarGuardado();
  };

  const descartarHuerfano = () => {
    if (!huerfano) return;
    borrarClave(huerfano.clave);
    setHuerfano(null);
  };

  const handleCambio = useCallback(
    (instantanea: Instantanea) => {
      datosRef.current.instantanea = instantanea;
      programarGuardado();
    },
    [programarGuardado]
  );

  const handleTitulo = (valor: string) => {
    setTitle(valor);
    datosRef.current.titulo = valor;
    programarGuardado();
  };

  const handleSave = useCallback(
    (dataUrl: string) => {
      if (!title.trim()) {
        setEstado({
          tipo: 'error',
          mensaje: 'Ponle un titulo antes de publicar.',
        });
        return;
      }

      startTransition(async () => {
        const resultado = await saveDrawing(title, dataUrl);

        // El resultado del servidor manda. Antes se anunciaba exito siempre,
        // incluso cuando la peticion habia fallado.
        if (resultado.ok) {
          // Publicado: ya no es un borrador que recuperar.
          if (pestanaRef.current) borrarBorrador(pestanaRef.current);
          setEstado({ tipo: 'listo', id: resultado.id });
        } else {
          setEstado({ tipo: 'error', mensaje: resultado.error });
        }
      });
    },
    [title]
  );

  return (
    <div className={`relative flex flex-col ${ALTO_ESTUDIO} lg:overflow-hidden`}>
      {/* Barra de documento: lo que identifica a la obra, separado de las
          herramientas de dibujo, que viven en el panel lateral. */}
      <div className='flex shrink-0 items-center gap-3 border-b border-line bg-paper px-4 py-2'>
        <label htmlFor='titulo' className='sr-only'>
          Titulo del dibujo
        </label>
        <input
          id='titulo'
          type='text'
          value={title}
          onChange={(evento) => handleTitulo(evento.target.value)}
          maxLength={MAX_TITLE_LENGTH}
          placeholder='Sin titulo'
          autoComplete='off'
          className='w-full max-w-xs rounded-lg border border-transparent bg-transparent px-2.5 py-1.5 font-semibold text-ink transition placeholder:font-normal placeholder:text-ink-faint hover:border-line focus:border-brand focus:bg-surface focus:outline-none'
        />
      </div>

      {huerfano && (
        <div className='flex shrink-0 flex-wrap items-center gap-3 border-b border-brand/30 bg-brand-soft px-4 py-2.5 text-sm text-brand-dark'>
          <RotateCcw className='h-4 w-4 shrink-0' aria-hidden />
          <span className='flex-1'>
            Tienes un dibujo sin publicar
            {huerfano.datos.titulo ? ` ("${huerfano.datos.titulo}")` : ''} de{' '}
            {enPalabras(huerfano.datos.guardadoEn)}.
          </span>
          <button
            type='button'
            onClick={recuperarHuerfano}
            className='rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark'
          >
            Recuperar
          </button>
          <button
            type='button'
            onClick={descartarHuerfano}
            aria-label='Descartar el borrador'
            className='rounded-lg p-1.5 transition hover:bg-brand/10'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
      )}

      <div className='min-h-0 flex-1'>
        <Canvas
          key={claveLienzo}
          onSave={handleSave}
          isSaving={isPending}
          borradorInicial={borradorInicial}
          onCambio={handleCambio}
        />
      </div>

      {/* Aviso flotante: en un lienzo a pantalla completa un bloque en el flujo
          desplazaria el area de dibujo cada vez que aparece. */}
      {estado.tipo !== 'inactivo' && (
        <div className='pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4'>
          <div className='pointer-events-auto w-full max-w-md shadow-lift'>
            {estado.tipo === 'error' ? (
              <Alert
                color='danger'
                variant='solid'
                title='No se pudo publicar'
                description={estado.mensaje}
                onClose={() => setEstado({ tipo: 'inactivo' })}
              />
            ) : (
              <Alert
                color='success'
                variant='solid'
                title='Listo, ya esta en la galeria'
                onClose={() => setEstado({ tipo: 'inactivo' })}
                endContent={
                  <Button
                    as={Link}
                    href={`/d/${estado.id}`}
                    size='sm'
                    variant='flat'
                  >
                    Verlo
                  </Button>
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function enPalabras(marca: number): string {
  const minutos = Math.round((Date.now() - marca) / 60000);
  if (minutos < 1) return 'hace un momento';
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;

  const dias = Math.round(horas / 24);
  return dias === 1 ? 'ayer' : `hace ${dias} dias`;
}
