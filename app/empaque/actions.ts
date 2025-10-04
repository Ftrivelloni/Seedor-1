"use server";
import { createClient } from "@supabase/supabase-js";

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, { auth: { persistSession: false } });
}

// Mapeá cada paso a su tabla real en tu BD:
const tableByPaso: Record<string, string> = {
  "ingreso-fruta": "ingresos_fruta",
  "preproceso": "preprocesos",
  "pallets": "pallets",
  "egreso-fruta": "egresos_fruta",
  "despacho": "despachos",
};

export async function savePaso(paso: string, data: any) {
  try {
    const table = tableByPaso[paso];
    if (!table) return { ok: false, message: `Paso desconocido: ${paso}` };

    const supabase = sb();

    // TIP: si necesitás asociar al usuario logueado, añadí un user_id en data antes del insert.
    const { error } = await supabase.from(table).insert([data]);

    if (error) return { ok: false, message: error.message };
    return { ok: true, message: "Guardado" };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? "Error desconocido" };
  }
}
