import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  tenantId: string;
}

export default function PalletsFormModal({ open, onClose, onCreated, tenantId }: Props) {
  const [form, setForm] = useState({
    semana: "",
    fecha: "",
    num_pallet: "",
    producto: "",
    productor: "",
    categoria: "",
    cod_envase: "",
    destino: "",
    kilos: "",
    cant_cajas: "",
    peso: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("pallets").insert([{
      tenant_id: tenantId,
      semana: Number(form.semana),
      fecha: form.fecha ? new Date(form.fecha).toISOString() : null,
      num_pallet: Number(form.num_pallet),
      producto: form.producto,
      productor: form.productor,
      categoria: form.categoria,
      cod_envase: form.cod_envase,
      destino: form.destino,
      kilos: Number(form.kilos),
      cant_cajas: Number(form.cant_cajas),
      peso: Number(form.peso),
    }]);
    setLoading(false);
    if (!error) {
      onCreated();
      onClose();
      setForm({
        semana: "",
        fecha: "",
        num_pallet: "",
        producto: "",
        productor: "",
        categoria: "",
        cod_envase: "",
        destino: "",
        kilos: "",
        cant_cajas: "",
        peso: "",
      });
    } else {
      alert("Error al guardar: " + error.message);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Nuevo Pallet</h2>
        <form onSubmit={handleSubmit}>
          <input name="semana" type="number" placeholder="Semana" value={form.semana} onChange={handleChange} required />
          <input name="fecha" type="date" placeholder="Fecha" value={form.fecha} onChange={handleChange} required />
          <input name="num_pallet" type="number" placeholder="N° Pallet" value={form.num_pallet} onChange={handleChange} required />
          <input name="producto" type="text" placeholder="Producto" value={form.producto} onChange={handleChange} required />
          <input name="productor" type="text" placeholder="Productor" value={form.productor} onChange={handleChange} required />
          <input name="categoria" type="text" placeholder="Categoría" value={form.categoria} onChange={handleChange} required />
          <input name="cod_envase" type="text" placeholder="Código Envase" value={form.cod_envase} onChange={handleChange} required />
          <input name="destino" type="text" placeholder="Destino" value={form.destino} onChange={handleChange} required />
          <input name="kilos" type="number" placeholder="Kilos" value={form.kilos} onChange={handleChange} required />
          <input name="cant_cajas" type="number" placeholder="Cantidad de Cajas" value={form.cant_cajas} onChange={handleChange} required />
          <input name="peso" type="number" placeholder="Peso" value={form.peso} onChange={handleChange} required />
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