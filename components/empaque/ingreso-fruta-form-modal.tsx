"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Plus } from "lucide-react"

// Campos de la tabla ingreso_fruta (excepto técnicos)
const initialState = {
  fecha: "",
  estado_liquidacion: false,
  num_ticket: "",
  num_remito: "",
  productor: "",
  finca: "",
  producto: "",
  lote: "",
  contratista: "",
  tipo_cosecha: "",
  cant_bin: "",
  tipo_bin: "",
  peso_neto: "",
  transporte: "",
  chofer: "",
  chasis: "",
  acoplado: "",
  operario: ""
}

export function IngresoFrutaFormModal({ isOpen, onClose, onSubmit }: {
  isOpen: boolean,
  onClose: () => void,
  onSubmit: (data: any) => void
}) {
  const [form, setForm] = useState(initialState)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    let fieldValue: string | boolean = value
    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      fieldValue = e.target.checked
    }
    setForm((prev) => ({
      ...prev,
      [name]: fieldValue
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit(form)
    setLoading(false)
    setForm(initialState)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Ingreso de Fruta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Fecha</label>
              <Input type="date" name="fecha" value={form.fecha} onChange={handleChange} required />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input type="checkbox" name="estado_liquidacion" checked={form.estado_liquidacion} onChange={handleChange} />
              <span className="text-sm">Liquidación</span>
            </div>
            <div>
              <label className="block text-sm font-medium">N° Ticket</label>
              <Input name="num_ticket" value={form.num_ticket} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">N° Remito</label>
              <Input name="num_remito" value={form.num_remito} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">Productor</label>
              <Input name="productor" value={form.productor} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">Finca</label>
              <Input name="finca" value={form.finca} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">Producto</label>
              <Input name="producto" value={form.producto} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">Lote</label>
              <Input name="lote" value={form.lote} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">Contratista</label>
              <Input name="contratista" value={form.contratista} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">Tipo de Cosecha</label>
              <Input name="tipo_cosecha" value={form.tipo_cosecha} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">Cantidad de Bins</label>
              <Input name="cant_bin" value={form.cant_bin} onChange={handleChange} type="number" />
            </div>
            <div>
              <label className="block text-sm font-medium">Tipo Bin</label>
              <Input name="tipo_bin" value={form.tipo_bin} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">Peso Neto (kg)</label>
              <Input name="peso_neto" value={form.peso_neto} onChange={handleChange} type="number" />
            </div>
            <div>
              <label className="block text-sm font-medium">Transporte</label>
              <Input name="transporte" value={form.transporte} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">Chofer</label>
              <Input name="chofer" value={form.chofer} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">Chasis</label>
              <Input name="chasis" value={form.chasis} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">Acoplado</label>
              <Input name="acoplado" value={form.acoplado} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">Operario</label>
              <Input name="operario" value={form.operario} onChange={handleChange} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            {loading ? "Guardando..." : "Guardar Ingreso"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
