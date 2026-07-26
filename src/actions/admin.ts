'use server';

import { del } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';

import { getDrawing } from '@/data/drawings';
import {
  COOKIE_ADMIN,
  DURACION_SESION,
  adminDisponible,
  coincideSecreto,
  esAdmin,
  huellaDelSecreto,
} from '@/lib/admin';
import { checkRateLimit } from '@/lib/rate-limit';

export type AccionResult = { ok: true } | { ok: false; error: string };

export async function iniciarSesionAdmin(
  secreto: string
): Promise<AccionResult> {
  if (!adminDisponible()) {
    return { ok: false, error: 'El modo moderacion no esta configurado.' };
  }

  // El limitador frena el ataque por fuerza bruta contra el secreto.
  const ip = await clientIp();
  if (!checkRateLimit(`admin:${ip}`).allowed) {
    return { ok: false, error: 'Demasiados intentos. Espera un minuto.' };
  }

  if (!coincideSecreto(secreto)) {
    return { ok: false, error: 'Secreto incorrecto.' };
  }

  const huella = huellaDelSecreto();
  if (!huella) return { ok: false, error: 'El modo moderacion no esta configurado.' };

  (await cookies()).set(COOKIE_ADMIN, huella, {
    // `httpOnly` la deja fuera del alcance de cualquier script en la pagina.
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: DURACION_SESION,
  });

  return { ok: true };
}

export async function cerrarSesionAdmin(): Promise<void> {
  (await cookies()).delete(COOKIE_ADMIN);
  revalidatePath('/gallery');
}

export async function borrarDibujo(id: string): Promise<AccionResult> {
  // La comprobacion vive en el servidor: ocultar el boton en el cliente no
  // protege nada, porque un Server Action es un endpoint invocable.
  if (!(await esAdmin())) {
    return { ok: false, error: 'No tienes permiso para borrar.' };
  }

  const dibujo = await getDrawing(id);
  if (!dibujo) return { ok: false, error: 'Ese dibujo ya no existe.' };

  try {
    await del(dibujo.imageUrl);
  } catch (error) {
    console.error(`[admin] no se pudo borrar ${id}:`, error);
    return { ok: false, error: 'No se pudo borrar. Intentalo de nuevo.' };
  }

  revalidatePath('/gallery');
  revalidatePath('/');
  return { ok: true };
}

async function clientIp(): Promise<string> {
  const lista = await headers();
  return lista.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconocido';
}
