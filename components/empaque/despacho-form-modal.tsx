import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  tenantId: string;
}

export default function DespachoFormModal({ open, onClose, onCreated, tenantId }: Props) {
  const [form, setForm] = useState({
    fecha: "",
    num_remito: "",
    cliente: "",
    DTV: "",
    codigo_cierre: "",
    termografo: "",
    DTC: "",
    destino: "",
    transporte: "",
    total_pallets: "",
    total_cajas: "",
    cuit: "",
    chasis: "",
    acoplado: "",
    chofer: "",
    dni: "",
    celular: "",
    operario: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("despacho").insert([{
      tenant_id: tenantId,  
      fecha: form.fecha ? new Date(form.fecha).toISOString() : null,
      num_remito: Number(form.num_remito),
      cliente: form.cliente,
      DTV: form.DTV,
      codigo_cierre: Number(form.codigo_cierre),
      termografo: form.termografo,
      DTC: form.DTC,
      destino: form.destino,
      transporte: form.transporte,
      total_pallets: Number(form.total_pallets),
      total_cajas: Number(form.total_cajas),
      cuit: form.cuit,
      chasis: form.chasis,
      acoplado: form.acoplado,
      chofer: form.chofer,
      dni: Number(form.dni),
      celular: form.celular,
      operario: form.operario,
    }]);
    setLoading(false);
    if (!error) {
      onCreated();
      onClose();
      setForm({
        fecha: "",
        num_remito: "",
        cliente: "",
        DTV: "",
        codigo_cierre: "",
        termografo: "",
        DTC: "",
        destino: "",
        transporte: "",
        total_pallets: "",
        total_cajas: "",
        cuit: "",
        chasis: "",
        acoplado: "",
        chofer: "",
        dni: "",
        celular: "",
        operario: "",
      });
    } else {
      alert("Error al guardar: " + error.message);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Nuevo Despacho</h2>
        <form onSubmit={handleSubmit}>
          <input name="fecha" type="date" placeholder="Fecha" value={form.fecha} onChange={handleChange} required />
          <input name="num_remito" type="number" placeholder="N° Remito" value={form.num_remito} onChange={handleChange} required />
          <input name="cliente" type="text" placeholder="Cliente" value={form.cliente} onChange={handleChange} required />
          <input name="DTV" type="text" placeholder="DTV" value={form.DTV} onChange={handleChange} />
          <input name="codigo_cierre" type="number" placeholder="Código Cierre" value={form.codigo_cierre} onChange={handleChange} />
          <input name="termografo" type="text" placeholder="Termógrafo" value={form.termografo} onChange={handleChange} />
          <input name="DTC" type="text" placeholder="DTC" value={form.DTC} onChange={handleChange} />
          <input name="destino" type="text" placeholder="Destino" value={form.destino} onChange={handleChange} required />
          <input name="transporte" type="text" placeholder="Transporte" value={form.transporte} onChange={handleChange} />
          <input name="total_pallets" type="number" placeholder="Total Pallets" value={form.total_pallets} onChange={handleChange} />
          <input name="total_cajas" type="number" placeholder="Total Cajas" value={form.total_cajas} onChange={handleChange} />
          <input name="cuit" type="text" placeholder="CUIT" value={form.cuit} onChange={handleChange} />
          <input name="chasis" type="text" placeholder="Chasis" value={form.chasis} onChange={handleChange} />
          <input name="acoplado" type="text" placeholder="Acoplado" value={form.acoplado} onChange={handleChange} />
          <input name="chofer" type="text" placeholder="Chofer" value={form.chofer} onChange={handleChange} />
          <input name="dni" type="number" placeholder="DNI" value={form.dni} onChange={handleChange} />
          <input name="celular" type="text" placeholder="Celular" value={form.celular} onChange={handleChange} />
          <input name="operario" type="text" placeholder="Operario" value={form.operario} onChange={handleChange} />
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