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
    // Normalizar datos: convertir strings vacíos a null y numéricos a number
    const normalizar = (valor: string, tipo: 'int' | 'float' | 'date' = 'int') => {
      if (valor === "") return null
      if (tipo === 'date') return valor || null
      if (tipo === 'float') return isNaN(Number(valor)) ? null : Number(valor)
      return isNaN(parseInt(valor)) ? null : parseInt(valor)
    }
    const data = {
      ...form,
      num_ticket: normalizar(form.num_ticket),
      num_remito: normalizar(form.num_remito),
      lote: normalizar(form.lote),
      cant_bin: normalizar(form.cant_bin),
      peso_neto: normalizar(form.peso_neto, 'float'),
      fecha: normalizar(form.fecha, 'date'),
    }
    await onSubmit(data)
    setLoading(false)
    setForm(initialState)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Ingreso de Fruta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Sección: Datos Generales */}
          <fieldset className="border border-gray-200 rounded-md p-4 mb-4">
            <legend className="font-semibold text-base px-2">Datos generales</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium">Fecha</label>
                <Input type="date" name="fecha" value={form.fecha} onChange={handleChange} required />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input type="checkbox" name="estado_liquidacion" checked={form.estado_liquidacion} onChange={handleChange} />
                <span className="text-sm">Liquidación</span>
              </div>
              <div>
                <label className="block text-sm font-medium">N° de ticket</label>
                <Input name="num_ticket" value={form.num_ticket} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium">N° de remito</label>
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
                <label className="block text-sm font-medium">Tipo de cosecha</label>
                <Input name="tipo_cosecha" value={form.tipo_cosecha} onChange={handleChange} />
              </div>
            </div>
          </fieldset>
          {/* Sección: Transporte */}
          <fieldset className="border border-gray-200 rounded-md p-4 mb-4">
            <legend className="font-semibold text-base px-2">Transporte</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </fieldset>
          {/* Sección: Bins y Peso */}
          <fieldset className="border border-gray-200 rounded-md p-4 mb-4">
            <legend className="font-semibold text-base px-2">Bins y peso</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium">Cantidad de bins</label>
                <Input name="cant_bin" value={form.cant_bin} onChange={handleChange} type="number" />
              </div>
              <div>
                <label className="block text-sm font-medium">Tipo bin</label>
                <Input name="tipo_bin" value={form.tipo_bin} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium">Peso neto (kg)</label>
                <Input name="peso_neto" value={form.peso_neto} onChange={handleChange} type="number" />
              </div>
            </div>
          </fieldset>
          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              {loading ? "Guardando..." : "Guardar Ingreso"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
