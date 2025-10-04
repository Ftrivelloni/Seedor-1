"use server";
import { createClient } from "@supabase/supabase-js";

export async function saveCampo(data: any) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, anon, { auth: { persistSession: false } });

    // renombrá "parcelas" por tu tabla real
    const { error } = await supabase.from("parcelas").insert([data]);
    if (error) return { ok: false, message: error.message };

    return { ok: true, message: "Parcela creada" };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? "Error desconocido" };
  }
}
