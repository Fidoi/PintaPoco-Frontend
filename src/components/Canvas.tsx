import React, { useState, useRef, useEffect, FC } from 'react';
import { Stage, Layer, Line, Rect } from 'react-konva';
import {
  Brush,
  Eraser,
  Trash2,
  Undo,
  Redo,
  HardDriveUpload,
  Pipette,
} from 'lucide-react';
import { Slider } from '@heroui/slider';
import { Button, Divider, Input } from '@nextui-org/react';

type Herramienta = 'pincel' | 'goma' | 'pipeta';
type Trazo = {
  puntos: number[];
  color: string;
  grosor: number;
};
type Historial = {
  trazos: Trazo[];
  fondo: string;
};

interface CanvasProps {
  onSave: (url: string) => void;
}

const Canvas: FC<CanvasProps> = ({ onSave }) => {
  const [trazos, setTrazos] = useState<Trazo[]>([]);
  const [trazoActual, setTrazoActual] = useState<number[]>([]);
  const [colorActual, setColorActual] = useState('#000000');
  const [fondo, setFondo] = useState('#FFFFFF');
  const [isSaving, setIsSaving] = useState(false); // Estado para controlar el botón

  const [herramienta, setHerramienta] = useState<Herramienta>('pincel');
  const [grosorPincel, setGrosorPincel] = useState(5);
  const [grosorGoma, setGrosorGoma] = useState(15);

  const [historial, setHistorial] = useState<Historial[]>([
    { trazos: [], fondo: '#FFFFFF' },
  ]);
  const [pasoActual, setPasoActual] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refLienzo = useRef<any>(null);
  const dibujando = useRef(false);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dibujando.current) finishStroke();
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [
    trazoActual,
    herramienta,
    colorActual,
    fondo,
    grosorGoma,
    grosorPincel,
    trazos,
  ]);

  const finishStroke = () => {
    if (trazoActual.length === 0) return;

    const nuevoTrazo: Trazo = {
      puntos: trazoActual,
      color: herramienta === 'goma' ? '#FFFFFF' : colorActual,
      grosor: herramienta === 'goma' ? grosorGoma : grosorPincel,
    };

    const nuevosTrazos = [...trazos, nuevoTrazo];
    setTrazos(nuevosTrazos);
    guardarEnHistorial(nuevosTrazos, fondo);
    setTrazoActual([]);
    dibujando.current = false;
  };

  const guardarEnHistorial = (nuevosTrazos: Trazo[], nuevoFondo: string) => {
    const nuevoHistorial = historial.slice(0, pasoActual + 1);
    nuevoHistorial.push({ trazos: nuevosTrazos, fondo: nuevoFondo });
    setHistorial(nuevoHistorial);
    setPasoActual(nuevoHistorial.length - 1);
  };

  const deshacer = () => {
    if (pasoActual > 0) {
      const nuevoPaso = pasoActual - 1;
      setPasoActual(nuevoPaso);
      setTrazos(historial[nuevoPaso].trazos);
      setFondo(historial[nuevoPaso].fondo);
    }
  };

  const rehacer = () => {
    if (pasoActual < historial.length - 1) {
      const nuevoPaso = pasoActual + 1;
      setPasoActual(nuevoPaso);
      setTrazos(historial[nuevoPaso].trazos);
      setFondo(historial[nuevoPaso].fondo);
    }
  };

  const limpiarLienzo = () => {
    setTrazos([]);
    setFondo('#FFFFFF');
    setTrazoActual([]);
    guardarEnHistorial([], '#FFFFFF');
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getPointerPosition = (e: any) =>
    e.target.getStage().getPointerPosition();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseDown = (e: any) => {
    const pos = getPointerPosition(e);
    if (!pos) return;

    if (herramienta === 'pipeta') {
      const canvas = refLienzo.current?.toCanvas();
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        const escala = window.devicePixelRatio || 1;
        const x = Math.floor(pos.x * escala);
        const y = Math.floor(pos.y * escala);
        const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
        setColorActual(
          `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`
        );
      }
      return;
    }

    dibujando.current = true;
    setTrazoActual([pos.x, pos.y]);
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseMove = (e: any) => {
    if (!dibujando.current) return;
    const pos = getPointerPosition(e);
    if (pos) setTrazoActual((prev) => [...prev, pos.x, pos.y]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (refLienzo.current) {
        const dataUrl = refLienzo.current.toDataURL({ pixelRatio: 2 });
        await onSave(dataUrl);
      }
    } catch (error) {
      console.error('Error al guardar dibujo:', error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        if (e.key === 'z') {
          e.preventDefault();
          deshacer();
        } else if (e.key === 'y') {
          e.preventDefault();
          rehacer();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historial, pasoActual]);

  interface BotonHerramientaProps {
    tipo: Herramienta;
    etiqueta: string;
  }
  const BotonHerramienta: FC<BotonHerramientaProps> = ({ tipo, etiqueta }) => {
    let Icono;
    switch (tipo) {
      case 'pincel':
        Icono = Brush;
        break;
      case 'goma':
        Icono = Eraser;
        break;
      case 'pipeta':
        Icono = Pipette;
        break;
      default:
        Icono = Brush;
    }
    return (
      <Button
        onPress={() => setHerramienta(tipo)}
        className={` flex items-center justify-center ${
          herramienta === tipo ? 'bg-success' : ''
        }`}
      >
        <Icono className='w-6 h-6' />
        <span className='ml-1'>{etiqueta}</span>
      </Button>
    );
  };

  return (
    <div className='flex flex-row'>
      <div className='max-w-[905]'>
        <Stage
          width={900}
          height={505}
          ref={refLienzo}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={finishStroke}
          className='rounded-md border-2 border-default'
        >
          <Layer>
            <Rect width={900} height={505} fill={fondo} />
            {trazos.map((trazo, i) => (
              <Line
                key={i}
                points={trazo.puntos}
                stroke={trazo.color}
                strokeWidth={trazo.grosor}
                lineCap='round'
                lineJoin='round'
              />
            ))}
            {trazoActual.length > 0 && (
              <Line
                points={trazoActual}
                stroke={herramienta === 'goma' ? '#FFFFFF' : colorActual}
                strokeWidth={herramienta === 'goma' ? grosorGoma : grosorPincel}
                lineCap='round'
                lineJoin='round'
              />
            )}
          </Layer>
        </Stage>
      </div>
      <div className='ml-4  '>
        <div className=' flex flex-col gap-2'>
          <label className='flex items-center'>
            🎨
            <Input
              type='color'
              value={colorActual}
              onChange={(e) => setColorActual(e.target.value)}
              className='ml-2'
            />
          </label>
          <BotonHerramienta tipo='pincel' etiqueta='Pincel' />
          <BotonHerramienta tipo='goma' etiqueta='Goma' />
          <BotonHerramienta tipo='pipeta' etiqueta='Pipeta' />

          <Button
            onPress={deshacer}
            className='flex items-center justify-center'
          >
            <Undo className='w-6 h-6' />
          </Button>

          <Button
            onPress={rehacer}
            className='flex items-center justify-center'
          >
            <Redo className='w-6 h-6' />
          </Button>
          <Button onPress={limpiarLienzo}>
            <Trash2 />
            Limpiar Todo
          </Button>
          {isSaving ? (
            <Button onPress={handleSave} color='secondary' isLoading></Button>
          ) : (
            <Button onPress={handleSave} color='primary'>
              <HardDriveUpload />
              Subir
            </Button>
          )}
        </div>

        <div className='mt-2 flex flex-col gap-4'>
          <Divider />
          <div>
            <Slider
              className='max-w-md font-bold'
              minValue={1}
              maxValue={50}
              label='Pincel'
              color='secondary'
              step={1}
              size='md'
              value={grosorPincel}
              onChange={(value: number | number[]) => {
                const newValue = Array.isArray(value) ? value[0] : value;
                setGrosorPincel(newValue);
              }}
            />
          </div>

          <div>
            <Slider
              label='Goma'
              className='max-w-md font-bold'
              minValue={1}
              maxValue={50}
              color='secondary'
              step={1}
              value={grosorGoma}
              onChange={(value: number | number[]) => {
                const newValue = Array.isArray(value) ? value[0] : value;
                setGrosorGoma(newValue);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Canvas;
