import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
// Si tenés tu tipo de BD, podés importarlo y poner <Database> abajo. Sino, sin genéricos.

export function supabaseServer() {
  // En server actions / route handlers, cookies() permite get/set/remove.
  // Hacemos un pequeño wrapper con tipos flexibles para evitar warnings.
  const cookieStore = cookies() as any;

  const get = (name: string): string | undefined => {
    try {
      return cookieStore.get(name)?.value as string | undefined;
    } catch {
      return undefined;
    }
  };

  const set = (name: string, value: string, options?: CookieOptions) => {
    try {
      // Forma recomendada por Next 14/15: objeto con name/value y opciones
      cookieStore.set({ name, value, ...(options ?? {}) });
    } catch {
      // en contextos read-only, ignoramos el set (Supabase maneja en memoria)
    }
  };

  const remove = (name: string, options?: CookieOptions) => {
    try {
      cookieStore.set({ name, value: "", ...(options ?? {}), maxAge: 0 });
    } catch {}
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { get, set, remove },
    }
  );
}
