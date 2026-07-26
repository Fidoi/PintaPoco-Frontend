/**
 * Contenido por defecto del slot: en cualquier ruta que no sea `/d/[id]` el
 * modal no existe. Sin este fichero Next devuelve 404 al recargar una ruta que
 * no rellena el slot.
 */
export default function Default() {
  return null;
}
