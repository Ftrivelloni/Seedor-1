"use client"

import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  tenantId: string;
}

export default function EgresoFrutaFormModal({ open, onClose, onCreated, tenantId }: Props) {
  const [form, setForm] = useState({
    num_remito: "",
    fecha: "",
    cliente: "",
    finca: "",
    producto: "",
    DTV: "",
    tara: "",
    peso_neto: "",
    transporte: "",
    chasis: "",
    acoplado: "",
    chofer: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("egreso_fruta").insert([{
      tenant_id: tenantId,
      num_remito: Number(form.num_remito),
      fecha: form.fecha ? new Date(form.fecha).toISOString() : null,
      cliente: form.cliente,
      finca: form.finca,
      producto: form.producto,
      DTV: form.DTV,
      tara: Number(form.tara),
      peso_neto: Number(form.peso_neto),
      transporte: form.transporte,
      chasis: form.chasis,
      acoplado: form.acoplado,
      chofer: form.chofer,
    }]);
    setLoading(false);
    if (!error) {
      onCreated();
      onClose();
      setForm({
        num_remito: "",
        fecha: "",
        cliente: "",
        finca: "",
        producto: "",
        DTV: "",
        tara: "",
        peso_neto: "",
        transporte: "",
        chasis: "",
        acoplado: "",
        chofer: "",
      });
    } else {
      alert("Error al guardar: " + error.message);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Nuevo Egreso de Fruta</h2>
        <form onSubmit={handleSubmit}>
          <input name="num_remito" type="number" placeholder="N° Remito" value={form.num_remito} onChange={handleChange} required />
          <input name="fecha" type="date" placeholder="Fecha" value={form.fecha} onChange={handleChange} required />
          <input name="cliente" type="text" placeholder="Cliente" value={form.cliente} onChange={handleChange} required />
          <input name="finca" type="text" placeholder="Finca" value={form.finca} onChange={handleChange} />
          <input name="producto" type="text" placeholder="Producto" value={form.producto} onChange={handleChange} required />
          <input name="DTV" type="text" placeholder="DTV" value={form.DTV} onChange={handleChange} />
          <input name="tara" type="number" placeholder="Tara" value={form.tara} onChange={handleChange} />
          <input name="peso_neto" type="number" placeholder="Peso Neto" value={form.peso_neto} onChange={handleChange} required />
          <input name="transporte" type="text" placeholder="Transporte" value={form.transporte} onChange={handleChange} />
          <input name="chasis" type="text" placeholder="Chasis" value={form.chasis} onChange={handleChange} />
          <input name="acoplado" type="text" placeholder="Acoplado" value={form.acoplado} onChange={handleChange} />
          <input name="chofer" type="text" placeholder="Chofer" value={form.chofer} onChange={handleChange} />
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