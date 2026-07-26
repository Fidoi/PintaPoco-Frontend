const WINDOW_MS = 60 * 1000;
const MAX_UPLOADS_PER_WINDOW = 5;

type Bucket = { count: number; resetAt: number };

/**
 * Limitador por ventana fija en memoria del proceso.
 *
 * Limitacion conocida y asumida: en serverless cada instancia tiene su propio
 * mapa, asi que el limite real es `MAX_UPLOADS_PER_WINDOW * instancias activas`.
 * Frena el spam accidental y el clic repetido, no a un atacante decidido. Para
 * eso haria falta un contador compartido (Upstash Redis) o el WAF de Vercel;
 * ninguno de los dos merece la pena en un proyecto de portfolio.
 */
const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string): { allowed: boolean } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    pruneExpired(now);
    return { allowed: true };
  }

  if (bucket.count >= MAX_UPLOADS_PER_WINDOW) {
    return { allowed: false };
  }

  bucket.count += 1;
  return { allowed: true };
}

/** Sin esto el mapa crece sin techo mientras viva la instancia. */
function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}
