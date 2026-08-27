import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Fábrica única de clientes Supabase para los endpoints del servidor.
 *
 * Separa lectura de escritura porque son dos niveles de privilegio distintos:
 *
 * - Lectura: clave anónima. Con RLS activo, solo puede hacer SELECT.
 * - Escritura: clave de service_role, que salta RLS. Nunca lleva prefijo NEXT_PUBLIC_,
 *   así que Next.js no puede incluirla en el bundle del navegador aunque alguien la
 *   referencie por error desde un componente de cliente.
 *
 * Si SUPABASE_SERVICE_ROLE_KEY no está configurada, la escritura cae a la clave
 * anónima. Eso mantiene el prototipo funcionando tal como estaba, pero solo funciona
 * mientras RLS siga permitiendo escritura anónima: al aplicar supabase/rls.sql, las
 * escrituras exigen la clave de servicio.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Configúrala en .env.local (no se versiona).`
    );
  }
  return value;
}

/** Cliente de solo lectura. Es el que deben usar los endpoints GET. */
export function getReadClient(): SupabaseClient {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  );
}

/** Cliente con privilegio de escritura. Solo para endpoints que persisten datos. */
export function getWriteClient(): SupabaseClient {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceKey) {
    return createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return createClient(url, requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'));
}

/** true si el despliegue tiene configurada la separación de privilegios. */
export function hasServiceRoleKey(): boolean {
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}
