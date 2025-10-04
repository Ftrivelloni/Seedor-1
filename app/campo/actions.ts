// app/campo/actions.ts
"use server";

import { createClient } from "@supabase/supabase-js";

export type NuevaTarea = {
  lote: string;
  cultivo: string;
  tipo: string;
  descripcion: string;
  fechaProgramada: string; // "YYYY-MM-DD"
  responsable: string;
  estado: "pendiente" | "en-curso" | "completada";
  notas?: string;
  tenantId?: string | null;
};

// 👇 Cliente ADMIN (solo en servidor). Usa la Service Role Key
function sbAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,   // URL pública
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // 🔒 privada (no NEXT_PUBLIC)
    { auth: { persistSession: false } }
  );
}

export async function createTareaAction(payload: NuevaTarea) {
  try {
    const supabase = sbAdmin();

    // mapear camelCase (UI) -> snake_case (BD)
    const row = {
      lote: payload.lote,
      cultivo: payload.cultivo,
      tipo: payload.tipo,
      descripcion: payload.descripcion,
      fecha_programada: payload.fechaProgramada,
      responsable: payload.responsable,
      estado: payload.estado,
      notas: payload.notas ?? null,
      tenant_id: payload.tenantId ?? null,
    };

    const { data, error } = await supabase
      .from("tareas_campo")
      .insert([row])
      .select("*")
      .single();

    if (error) return { ok: false, message: error.message };
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? "Error desconocido al crear tarea" };
  }
}
