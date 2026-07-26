'use client';

import { Button } from '@heroui/button';
import { Slider } from '@heroui/slider';
import type Konva from 'konva';
import {
  ArrowLeftRight,
  Brush,
  Eraser,
  FlipHorizontal,
  FlipVertical,
  HardDriveUpload,
  Maximize2,
  Minus,
  Pipette,
  Plus,
  Redo,
  Trash2,
  Undo,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Layer, Line, Rect, Stage } from 'react-konva';

/**
 * El lienzo trabaja siempre en este sistema de coordenadas y se escala para
 * mostrarse. Asi un trazo hecho en movil y otro hecho en escritorio producen la
 * misma obra, y la exportacion no depende del tamano de la pantalla.
 *
 * 16:9 exacto: encaja con `aspect-video` en la galeria sin fracciones raras.
 */
const LIENZO_ANCHO = 1200;
const LIENZO_ALTO = 675;

/** Ancho del WebP exportado. */
const EXPORT_ANCHO = 1600;
const EXPORT_CALIDAD = 0.8;

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 5;
const ZOOM_PASO = 1.25;

const BLANCO = '#FFFFFF';

type Herramienta = 'pincel' | 'goma' | 'pipeta';
type Eje = 'horizontal' | 'vertical';
/** Indice de la ranura de color activa. */
type Ranura = 0 | 1;

type Trazo = {
  puntos: number[];
  color: string;
  grosor: number;
};

type Instantanea = {
  trazos: Trazo[];
  fondo: string;
};

interface CanvasProps {
  onSave: (dataUrl: string) => void | Promise<void>;
  isSaving: boolean;
}

const ICONOS: Record<Herramienta, typeof Brush> = {
  pincel: Brush,
  goma: Eraser,
  pipeta: Pipette,
};

const clampZoom = (valor: number) =>
  Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, valor));

export default function Canvas({ onSave, isSaving }: CanvasProps) {
  /**
   * El historial es la unica fuente de verdad: los trazos visibles se derivan
   * del paso actual. Mantenerlos ademas en su propio `useState` obligaba a
   * sincronizar dos copias y era de donde salian los desfases al deshacer.
   */
  const [historial, setHistorial] = useState<Instantanea[]>([
    { trazos: [], fondo: BLANCO },
  ]);
  const [pasoActual, setPasoActual] = useState(0);
  const { trazos, fondo } = historial[pasoActual];

  const [trazoActual, setTrazoActual] = useState<number[]>([]);

  /**
   * Dos colores guardados y uno activo, como el principal/secundario de Clip
   * Studio: alternar entre la tinta y un color de relleno es el gesto mas
   * repetido al dibujar, y no deberia costar volver a buscarlo en la rueda.
   */
  const [colores, setColores] = useState<[string, string]>([
    '#6366F1',
    '#111827',
  ]);
  const [ranuraActiva, setRanuraActiva] = useState<Ranura>(0);
  const colorActual = colores[ranuraActiva];

  const [herramienta, setHerramienta] = useState<Herramienta>('pincel');
  const [grosorPincel, setGrosorPincel] = useState(8);
  const [grosorGoma, setGrosorGoma] = useState(32);

  const [caja, setCaja] = useState({ ancho: LIENZO_ANCHO, alto: LIENZO_ALTO });
  const [zoom, setZoom] = useState(1);

  const medidaRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const inputsColor = useRef<Array<HTMLInputElement | null>>([null, null]);
  const dibujando = useRef(false);

  /**
   * Ajuste a los dos ejes, y el zoom encima.
   *
   * `escalaAjuste` es la que hace que el lienzo quepa entero: el menor de los
   * dos factores, porque en una ventana ancha y baja escalar solo por ancho lo
   * dejaria cortado. El zoom multiplica sobre esa base, de modo que el 100% es
   * siempre "lo que cabe en pantalla" y no una cantidad arbitraria de pixeles.
   */
  const escalaAjuste = Math.min(
    caja.ancho / LIENZO_ANCHO,
    caja.alto / LIENZO_ALTO
  );
  const escala = escalaAjuste * zoom;
  const anchoVisible = LIENZO_ANCHO * escala;
  const altoVisible = LIENZO_ALTO * escala;

  useLayoutEffect(() => {
    const medidor = medidaRef.current;
    if (!medidor) return;

    // Se mide un elemento aparte que nunca desplaza su contenido. Medir el
    // propio contenedor con scroll haria que, al aparecer la barra, encogiese
    // el area util, se recalculase la escala y el lienzo temblase.
    const medir = () => {
      const { clientWidth, clientHeight } = medidor;
      if (clientWidth > 0 && clientHeight > 0) {
        setCaja({ ancho: clientWidth, alto: clientHeight });
      }
    };

    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(medidor);
    return () => observador.disconnect();
  }, []);

  const commit = useCallback(
    (instantanea: Instantanea) => {
      setHistorial((previo) => [
        ...previo.slice(0, pasoActual + 1),
        instantanea,
      ]);
      setPasoActual((previo) => previo + 1);
    },
    [pasoActual]
  );

  const deshacer = useCallback(() => {
    setPasoActual((previo) => Math.max(0, previo - 1));
  }, []);

  const rehacer = useCallback(() => {
    setPasoActual((previo) => Math.min(historial.length - 1, previo + 1));
  }, [historial.length]);

  const limpiarLienzo = useCallback(() => {
    setTrazoActual([]);
    commit({ trazos: [], fondo: BLANCO });
  }, [commit]);

  const intercambiarColores = useCallback(() => {
    setRanuraActiva((previo) => (previo === 0 ? 1 : 0));
  }, []);

  const cambiarColor = useCallback(
    (ranura: Ranura, valor: string) => {
      setColores((previo) => {
        const siguiente: [string, string] = [...previo];
        siguiente[ranura] = valor;
        return siguiente;
      });
    },
    []
  );

  /**
   * Primer clic selecciona la ranura; el segundo abre el selector. Es como se
   * comporta cualquier paleta de dos colores, y evita que elegir cual usar
   * abra un dialogo que no habias pedido.
   */
  const pulsarRanura = useCallback(
    (ranura: Ranura) => {
      if (ranuraActiva !== ranura) {
        setRanuraActiva(ranura);
        return;
      }
      inputsColor.current[ranura]?.click();
    },
    [ranuraActiva]
  );

  /**
   * Voltear transforma los puntos de verdad en lugar de aplicar una escala
   * negativa al Stage: asi el cambio entra en el historial como un paso mas —se
   * deshace con Ctrl+Z— y la exportacion sale volteada sin logica aparte.
   */
  const voltear = useCallback(
    (eje: Eje) => {
      if (trazos.length === 0) return;

      const volteados = trazos.map((trazo) => ({
        ...trazo,
        // Los puntos van aplanados como [x0, y0, x1, y1, ...]: los indices
        // pares son X y los impares Y.
        puntos: trazo.puntos.map((valor, indice) => {
          const esX = indice % 2 === 0;
          if (eje === 'horizontal') return esX ? LIENZO_ANCHO - valor : valor;
          return esX ? valor : LIENZO_ALTO - valor;
        }),
      }));

      commit({ trazos: volteados, fondo });
    },
    [commit, fondo, trazos]
  );

  /** Coordenadas del puntero convertidas al espacio logico del lienzo. */
  const posicionLogica = useCallback((): { x: number; y: number } | null => {
    const posicion = stageRef.current?.getPointerPosition();
    if (!posicion) return null;
    return { x: posicion.x / escala, y: posicion.y / escala };
  }, [escala]);

  const finishStroke = useCallback(() => {
    dibujando.current = false;
    if (trazoActual.length === 0) return;

    const nuevoTrazo: Trazo = {
      puntos: trazoActual,
      color: herramienta === 'goma' ? fondo : colorActual,
      grosor: herramienta === 'goma' ? grosorGoma : grosorPincel,
    };

    commit({ trazos: [...trazos, nuevoTrazo], fondo });
    setTrazoActual([]);
  }, [
    colorActual,
    commit,
    fondo,
    grosorGoma,
    grosorPincel,
    herramienta,
    trazoActual,
    trazos,
  ]);

  const tomarColor = useCallback(() => {
    const stage = stageRef.current;
    const posicion = stage?.getPointerPosition();
    if (!stage || !posicion) return;

    const contexto = stage.toCanvas().getContext('2d');
    if (!contexto) return;

    // `toCanvas()` devuelve el lienzo a escala 1:1 con el Stage, asi que la
    // posicion del puntero ya esta en el sistema correcto. Multiplicarla por
    // devicePixelRatio muestreaba el pixel equivocado en pantallas retina.
    const { data } = contexto.getImageData(
      Math.floor(posicion.x),
      Math.floor(posicion.y),
      1,
      1
    );

    const hex = Array.from(data.slice(0, 3), (canal) =>
      canal.toString(16).padStart(2, '0')
    ).join('');

    // El color recogido sustituye al de la ranura activa.
    cambiarColor(ranuraActiva, `#${hex}`);
    // Devolver el pincel: nadie coge un color para seguir cogiendo colores.
    setHerramienta('pincel');
  }, [cambiarColor, ranuraActiva]);

  const handlePointerDown = useCallback(() => {
    if (herramienta === 'pipeta') {
      tomarColor();
      return;
    }

    const posicion = posicionLogica();
    if (!posicion) return;

    dibujando.current = true;
    setTrazoActual([posicion.x, posicion.y]);
  }, [herramienta, posicionLogica, tomarColor]);

  const handlePointerMove = useCallback(() => {
    if (!dibujando.current) return;
    const posicion = posicionLogica();
    if (!posicion) return;
    setTrazoActual((previo) => [...previo, posicion.x, posicion.y]);
  }, [posicionLogica]);

  /**
   * Patron "latest ref": el listener global se registra una sola vez y siempre
   * ejecuta la version actual del callback. Antes el efecto se resuscribia cada
   * vez que cambiaba cualquiera de sus siete dependencias.
   */
  const finishStrokeRef = useRef(finishStroke);
  finishStrokeRef.current = finishStroke;

  useEffect(() => {
    const handleUp = () => {
      if (dibujando.current) finishStrokeRef.current();
    };

    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, []);

  const atajosRef = useRef({ deshacer, rehacer, intercambiarColores });
  atajosRef.current = { deshacer, rehacer, intercambiarColores };

  useEffect(() => {
    const handleKeyDown = (evento: KeyboardEvent) => {
      // Sin esta guarda, escribir una "x" en el titulo del dibujo cambiaria el
      // color activo.
      if (escribiendo()) return;

      const tecla = evento.key.toLowerCase();

      if (evento.ctrlKey || evento.metaKey) {
        if (tecla === 'z' && !evento.shiftKey) {
          evento.preventDefault();
          atajosRef.current.deshacer();
        } else if (tecla === 'y' || (tecla === 'z' && evento.shiftKey)) {
          evento.preventDefault();
          atajosRef.current.rehacer();
        }
        return;
      }

      if (tecla === 'x') {
        evento.preventDefault();
        atajosRef.current.intercambiarColores();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * Ctrl+rueda para hacer zoom. El listener se registra a mano porque React
   * marca `onWheel` como pasivo y `preventDefault` no surtiria efecto: sin el,
   * el navegador haria zoom de la pagina entera por encima del nuestro.
   */
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const handleWheel = (evento: WheelEvent) => {
      if (!evento.ctrlKey && !evento.metaKey) return;
      evento.preventDefault();
      setZoom((previo) =>
        clampZoom(previo * (evento.deltaY < 0 ? 1.1 : 1 / 1.1))
      );
    };

    scroller.addEventListener('wheel', handleWheel, { passive: false });
    return () => scroller.removeEventListener('wheel', handleWheel);
  }, []);

  const handleSave = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // El pixelRatio compensa la escala de pantalla —zoom incluido— para que la
    // exportacion mida siempre EXPORT_ANCHO, se dibuje como se dibuje.
    const dataUrl = stage.toDataURL({
      mimeType: 'image/webp',
      quality: EXPORT_CALIDAD,
      pixelRatio: EXPORT_ANCHO / anchoVisible,
    });

    void onSave(dataUrl);
  }, [anchoVisible, onSave]);

  const puedeDeshacer = pasoActual > 0;
  const puedeRehacer = pasoActual < historial.length - 1;
  const hayDibujo = trazos.length > 0;

  /**
   * Un solo control de grosor, el de la herramienta activa.
   *
   * Antes habia dos sliders siempre visibles y solo uno tenia efecto en cada
   * momento: el usuario movia "Goma" con el pincel en la mano y no pasaba nada.
   * Cada herramienta conserva su grosor propio —un borrador quiere ser mas
   * gordo que un pincel—, pero solo se muestra el que aplica.
   */
  const usaGrosor = herramienta !== 'pipeta';
  const grosorActivo = herramienta === 'goma' ? grosorGoma : grosorPincel;
  const setGrosorActivo =
    herramienta === 'goma' ? setGrosorGoma : setGrosorPincel;

  return (
    <div className='flex h-full w-full flex-col lg:flex-row'>
      {/*
        Mesa de trabajo: fondo mas oscuro para que el lienzo se lea como una
        hoja apoyada encima. En movil se le da alto explicito porque no hay
        contenedor a pantalla completa del que heredarlo.
      */}
      <div className='relative flex h-[58vh] bg-workspace p-3 lg:h-full lg:min-h-0 lg:min-w-0 lg:flex-1 lg:p-6'>
        {/* Medidor invisible: da el area util sin verse afectado por el scroll. */}
        <div
          ref={medidaRef}
          aria-hidden
          className='pointer-events-none absolute inset-3 lg:inset-6'
        />

        <div
          ref={scrollerRef}
          className='flex h-full w-full items-center justify-center overflow-auto'
        >
          <div
            className='shrink-0 overflow-hidden rounded-lg bg-surface shadow-lift'
            // Sin esto el navegador interpreta el trazo como scroll y en movil
            // no se puede dibujar.
            style={{
              width: anchoVisible,
              height: altoVisible,
              touchAction: 'none',
            }}
          >
            <Stage
              ref={stageRef}
              width={anchoVisible}
              height={altoVisible}
              scaleX={escala}
              scaleY={escala}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishStroke}
              style={{
                cursor: herramienta === 'pipeta' ? 'crosshair' : 'default',
              }}
            >
              <Layer>
                <Rect width={LIENZO_ANCHO} height={LIENZO_ALTO} fill={fondo} />
                {trazos.map((trazo, indice) => (
                  <Line
                    key={indice}
                    points={trazo.puntos}
                    stroke={trazo.color}
                    strokeWidth={trazo.grosor}
                    lineCap='round'
                    lineJoin='round'
                    tension={0.35}
                  />
                ))}
                {trazoActual.length > 0 && (
                  <Line
                    points={trazoActual}
                    stroke={herramienta === 'goma' ? fondo : colorActual}
                    strokeWidth={
                      herramienta === 'goma' ? grosorGoma : grosorPincel
                    }
                    lineCap='round'
                    lineJoin='round'
                    tension={0.35}
                  />
                )}
              </Layer>
            </Stage>
          </div>
        </div>

        <ControlesZoom
          zoom={zoom}
          onAlejar={() => setZoom((previo) => clampZoom(previo / ZOOM_PASO))}
          onAcercar={() => setZoom((previo) => clampZoom(previo * ZOOM_PASO))}
          onAjustar={() => setZoom(1)}
        />
      </div>

      {/*
        Panel acoplado al borde, no una tarjeta dentro del flujo: en un editor a
        pantalla completa las herramientas son parte del marco de la aplicacion.
        Tiene scroll propio para que una ventana baja no las corte.
      */}
      <aside className='flex w-full shrink-0 flex-col gap-3 border-t border-line bg-surface p-3 lg:h-full lg:w-56 lg:overflow-y-auto lg:border-l lg:border-t-0'>
        <div
          role='radiogroup'
          aria-label='Herramienta de dibujo'
          className='grid grid-cols-3 gap-1 rounded-xl bg-ink/5 p-1'
        >
          {(Object.keys(ICONOS) as Herramienta[]).map((tipo) => (
            <BotonHerramienta
              key={tipo}
              tipo={tipo}
              activa={herramienta === tipo}
              onSelect={setHerramienta}
            />
          ))}
        </div>

        <div className='flex items-center gap-2 rounded-xl border border-line p-1.5'>
          {([0, 1] as Ranura[]).map((ranura) => (
            <RanuraColor
              key={ranura}
              ranura={ranura}
              color={colores[ranura]}
              activa={ranuraActiva === ranura}
              onPress={pulsarRanura}
              onChange={cambiarColor}
              inputRef={(elemento) => {
                inputsColor.current[ranura] = elemento;
              }}
            />
          ))}

          <span className='min-w-0 flex-1 truncate font-mono text-xs uppercase text-ink-muted'>
            {colorActual}
          </span>

          <button
            type='button'
            onClick={intercambiarColores}
            title='Intercambiar colores (X)'
            aria-label='Intercambiar colores'
            className='shrink-0 rounded-lg p-1.5 text-ink-faint transition hover:bg-ink/5 hover:text-ink'
          >
            <ArrowLeftRight className='h-4 w-4' />
          </button>
        </div>

        {usaGrosor && (
          <div className='flex items-center gap-2.5'>
            {/* Vista previa del grosor real: mas rapido de leer que un numero. */}
            <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper'>
              <span
                className='rounded-full bg-ink transition-all'
                style={{
                  width: previewPx(grosorActivo),
                  height: previewPx(grosorActivo),
                }}
              />
            </span>
            <Slider
              aria-label={`Grosor de ${herramienta}`}
              size='sm'
              minValue={1}
              maxValue={herramienta === 'goma' ? 60 : 50}
              step={1}
              value={grosorActivo}
              onChange={(valor) =>
                setGrosorActivo(Array.isArray(valor) ? valor[0] : valor)
              }
              classNames={{ filler: 'bg-brand', thumb: 'bg-brand' }}
            />
          </div>
        )}

        <div className='h-px bg-line' />

        <div className='grid grid-cols-4 gap-1.5'>
          {/* El atajo va en el tooltip: se descubre donde se usa. */}
          <AccionIcono
            etiqueta='Deshacer (Ctrl+Z)'
            onPress={deshacer}
            disabled={!puedeDeshacer}
          >
            <Undo className='h-[18px] w-[18px]' />
          </AccionIcono>
          <AccionIcono
            etiqueta='Rehacer (Ctrl+Y)'
            onPress={rehacer}
            disabled={!puedeRehacer}
          >
            <Redo className='h-[18px] w-[18px]' />
          </AccionIcono>
          <AccionIcono
            etiqueta='Voltear en horizontal'
            onPress={() => voltear('horizontal')}
            disabled={!hayDibujo}
          >
            <FlipHorizontal className='h-[18px] w-[18px]' />
          </AccionIcono>
          <AccionIcono
            etiqueta='Voltear en vertical'
            onPress={() => voltear('vertical')}
            disabled={!hayDibujo}
          >
            <FlipVertical className='h-[18px] w-[18px]' />
          </AccionIcono>
        </div>

        <Button
          onPress={handleSave}
          isLoading={isSaving}
          radius='lg'
          className='bg-brand font-semibold text-white data-[hover=true]:bg-brand-dark'
          startContent={!isSaving && <HardDriveUpload className='h-4 w-4' />}
        >
          {isSaving ? 'Publicando' : 'Publicar'}
        </Button>

        {/*
          Separado de los iconos: borrarlo todo no debe estar a un pixel de
          deshacer, que es lo que se pulsa cada dos minutos.
        */}
        <button
          type='button'
          onClick={limpiarLienzo}
          disabled={!hayDibujo}
          className='flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-sm text-ink-muted transition hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-40'
        >
          <Trash2 className='h-4 w-4' />
          Limpiar
        </button>
      </aside>
    </div>
  );
}

/** ¿Hay un campo de texto enfocado? Si lo hay, los atajos de una tecla callan. */
function escribiendo(): boolean {
  const activo = document.activeElement;
  if (!(activo instanceof HTMLElement)) return false;
  return (
    activo.tagName === 'INPUT' ||
    activo.tagName === 'TEXTAREA' ||
    activo.isContentEditable
  );
}

/** El grosor logico llega a 60; el circulo de muestra se queda en 26px. */
function previewPx(grosor: number): number {
  return Math.max(3, Math.min(26, Math.round(grosor * 0.55)));
}

function ControlesZoom({
  zoom,
  onAlejar,
  onAcercar,
  onAjustar,
}: {
  zoom: number;
  onAlejar: () => void;
  onAcercar: () => void;
  onAjustar: () => void;
}) {
  const claseBoton =
    'flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted transition hover:bg-ink/5 hover:text-ink disabled:opacity-35 disabled:hover:bg-transparent';

  return (
    <div className='absolute bottom-5 right-5 flex items-center gap-0.5 rounded-xl border border-line bg-surface/95 p-1 shadow-soft backdrop-blur'>
      <button
        type='button'
        onClick={onAlejar}
        disabled={zoom <= ZOOM_MIN}
        title='Alejar'
        aria-label='Alejar'
        className={claseBoton}
      >
        <Minus className='h-4 w-4' />
      </button>

      {/*
        El 100% es el lienzo ajustado a la pantalla, no una cantidad fija de
        pixeles: es lo que el usuario ve al entrar, asi que es la referencia que
        ya tiene en la cabeza.
      */}
      <span className='w-12 text-center font-mono text-xs text-ink-muted'>
        {Math.round(zoom * 100)}%
      </span>

      <button
        type='button'
        onClick={onAcercar}
        disabled={zoom >= ZOOM_MAX}
        title='Acercar'
        aria-label='Acercar'
        className={claseBoton}
      >
        <Plus className='h-4 w-4' />
      </button>

      <span className='mx-0.5 h-5 w-px bg-line' />

      <button
        type='button'
        onClick={onAjustar}
        disabled={zoom === 1}
        title='Ajustar a la pantalla'
        aria-label='Ajustar a la pantalla'
        className={claseBoton}
      >
        <Maximize2 className='h-[15px] w-[15px]' />
      </button>
    </div>
  );
}

function RanuraColor({
  ranura,
  color,
  activa,
  onPress,
  onChange,
  inputRef,
}: {
  ranura: Ranura;
  color: string;
  activa: boolean;
  onPress: (ranura: Ranura) => void;
  onChange: (ranura: Ranura, valor: string) => void;
  inputRef: (elemento: HTMLInputElement | null) => void;
}) {
  return (
    <span className='relative shrink-0'>
      <button
        type='button'
        onClick={() => onPress(ranura)}
        aria-pressed={activa}
        title={
          activa
            ? 'Cambiar este color'
            : `Usar el color ${ranura === 0 ? 'principal' : 'secundario'}`
        }
        className={`block h-7 w-7 rounded-lg transition ${
          activa
            ? 'ring-2 ring-brand ring-offset-2 ring-offset-surface'
            : 'ring-1 ring-inset ring-black/15 hover:ring-black/30'
        }`}
        style={{ backgroundColor: color }}
      />
      <input
        ref={inputRef}
        type='color'
        value={color}
        onChange={(evento) => onChange(ranura, evento.target.value)}
        // Oculto pero disparable: el boton de arriba le hace `click()`.
        className='pointer-events-none absolute inset-0 h-0 w-0 opacity-0'
        tabIndex={-1}
        aria-label={`Color ${ranura === 0 ? 'principal' : 'secundario'}`}
      />
    </span>
  );
}

function AccionIcono({
  etiqueta,
  onPress,
  disabled = false,
  children,
}: {
  etiqueta: string;
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type='button'
      onClick={onPress}
      disabled={disabled}
      title={etiqueta}
      aria-label={etiqueta}
      className='flex items-center justify-center rounded-lg border border-line py-2 text-ink-muted transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-line disabled:hover:text-ink-muted'
    >
      {children}
    </button>
  );
}

interface BotonHerramientaProps {
  tipo: Herramienta;
  activa: boolean;
  onSelect: (tipo: Herramienta) => void;
}

/**
 * Fuera del componente padre a proposito: definido dentro se recreaba en cada
 * render, y React lo desmontaba y remontaba en vez de actualizarlo.
 */
function BotonHerramienta({ tipo, activa, onSelect }: BotonHerramientaProps) {
  const Icono = ICONOS[tipo];
  const etiqueta = tipo.charAt(0).toUpperCase() + tipo.slice(1);

  return (
    <button
      type='button'
      role='radio'
      aria-checked={activa}
      title={etiqueta}
      onClick={() => onSelect(tipo)}
      className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-semibold transition ${
        activa
          ? 'bg-surface text-brand shadow-sm'
          : 'text-ink-muted hover:text-ink'
      }`}
    >
      <Icono className='h-[18px] w-[18px]' />
      {etiqueta}
    </button>
  );
}
