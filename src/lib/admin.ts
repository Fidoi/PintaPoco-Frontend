import 'server-only';

import { createHash, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const COOKIE_ADMIN = 'pintapoco_admin';

/** Ocho horas: una sesion de moderacion, no una permanente. */
export const DURACION_SESION = 60 * 60 * 8;

/**
 * Moderacion por secreto compartido en lugar de cuentas de usuario.
 *
 * Aqui solo hay una persona que modera —la que despliega— asi que montar
 * registro, sesiones y roles seria construir un sistema de identidad para un
 * unico sujeto. Un secreto en el entorno cubre el caso real: retirar un dibujo
 * ofensivo antes de que lo vea nadie mas.
 */
function secretoConfigurado(): string | null {
  const secreto = process.env.ADMIN_SECRET;
  // Sin secreto el modo admin no existe. El fallo es cerrado: nunca "todos son
  // administradores porque no hay contrasena".
  return secreto && secreto.length > 0 ? secreto : null;
}

export function adminDisponible(): boolean {
  return secretoConfigurado() !== null;
}

/** El valor de la cookie es el hash, nunca el secreto en claro. */
function huella(secreto: string): string {
  return createHash('sha256').update(secreto).digest('hex');
}

export function huellaDelSecreto(): string | null {
  const secreto = secretoConfigurado();
  return secreto ? huella(secreto) : null;
}

/**
 * Comparacion en tiempo constante: un `===` sobre cadenas corta en el primer
 * caracter distinto, y esa diferencia de tiempo es medible y suficiente para
 * reconstruir el secreto byte a byte.
 */
export function coincideSecreto(candidato: string): boolean {
  const secreto = secretoConfigurado();
  if (!secreto) return false;

  const a = Buffer.from(huella(candidato), 'hex');
  const b = Buffer.from(huella(secreto), 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function esAdmin(): Promise<boolean> {
  const esperada = huellaDelSecreto();
  if (!esperada) return false;

  const cookie = (await cookies()).get(COOKIE_ADMIN)?.value;
  if (!cookie) return false;

  const a = Buffer.from(cookie);
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}
