import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function PreprocesoFormModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    semana: "",
    fecha: "",
    duracion: "",
    bin_volcados: "",
    ritmo_maquina: "",
    duracion_proceso: "",
    bin_pleno: "",
    bin_intermedio_l: "", // corregido
    bin_intermedio_ll: "", // corregido
    bin_incipiente: "",
    cant_personal: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
   const { authService } = await import("../../lib/auth");
   const user = authService.getCurrentUser();
   if (!user) {
     setLoading(false);
     alert("No hay usuario autenticado.");
     return;
   }
    const { error } = await supabase.from("preseleccion").insert([{
      semana: Number(form.semana),
      fecha: form.fecha ? new Date(form.fecha).toISOString() : null,
      duracion: Number(form.duracion),
      bin_volcados: Number(form.bin_volcados),
      ritmo_maquina: Number(form.ritmo_maquina),
      duracion_proceso: Number(form.duracion_proceso),
      bin_pleno: Number(form.bin_pleno),
      bin_intermedio_l: Number(form.bin_intermedio_l),
      bin_intermedio_ll: Number(form.bin_intermedio_ll),
      bin_incipiente: Number(form.bin_incipiente),
      cant_personal: Number(form.cant_personal),
      tenant_id: user.tenantId,
    }]);
    setLoading(false);
    if (!error) {
      onCreated();
      onClose();
      setForm({
        semana: "",
        fecha: "",
        duracion: "",
        bin_volcados: "",
        ritmo_maquina: "",
        duracion_proceso: "",
        bin_pleno: "",
        bin_intermedio_l: "",
        bin_intermedio_ll: "",
        bin_incipiente: "",
        cant_personal: "",
      });
    } else {
      alert("Error al guardar: " + error.message);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Nuevo Preproceso</h2>
        <form onSubmit={handleSubmit}>
          <input name="semana" type="number" placeholder="Semana" value={form.semana} onChange={handleChange} required />
          <input name="fecha" type="date" placeholder="Fecha" value={form.fecha} onChange={handleChange} required />
          <input name="duracion" type="number" step="0.01" placeholder="Duración" value={form.duracion} onChange={handleChange} required />
          <input name="bin_volcados" type="number" placeholder="Bin Volcados" value={form.bin_volcados} onChange={handleChange} required />
          <input name="ritmo_maquina" type="number" placeholder="Ritmo Máquina" value={form.ritmo_maquina} onChange={handleChange} required />
          <input name="duracion_proceso" type="number" placeholder="Duración Proceso" value={form.duracion_proceso} onChange={handleChange} required />
          <input name="bin_pleno" type="number" placeholder="Bin Pleno" value={form.bin_pleno} onChange={handleChange} required />
          <input name="bin_intermedio_l" type="number" placeholder="Bin Intermedio l" value={form.bin_intermedio_l} onChange={handleChange} required />
          <input name="bin_intermedio_ll" type="number" placeholder="Bin Intermedio ll" value={form.bin_intermedio_ll} onChange={handleChange} required />
          <input name="bin_incipiente" type="number" placeholder="Bin Incipiente" value={form.bin_incipiente} onChange={handleChange} required />
          <input name="cant_personal" type="number" placeholder="Cantidad Personal" value={form.cant_personal} onChange={handleChange} required />
          <button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</button>
          <button type="button" onClick={onClose}>Cancelar</button>
        </form>
      </div>
      <style>{`
        .modal-backdrop {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.6);
            display: flex; align-items: center; justify-content: center;
            z-index: 1000;
        }
        .modal {
            background: #fff; padding: 2rem; border-radius: 8px; min-width: 320px;
            z-index: 1001;
        }
        .modal input { display: block; margin-bottom: 1rem; width: 100%; }
        .modal button { margin-right: 1rem; }
      `}</style>
    </div>
  );
}