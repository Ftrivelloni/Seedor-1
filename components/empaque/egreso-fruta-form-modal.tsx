"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { useToast } from "../../hooks/use-toast"
import type { EgresoFruta } from "../../lib/types"

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (egreso: EgresoFruta) => void
  tenantId: string
}

const initialState = {
  tenant_id: "",
  fecha: new Date().toISOString().slice(0, 10),
  producto: "",
  peso_neto: 0,
  cliente: "",
  finca: "",
  num_remito: "",
  DTV: "",
  tara: 0,
  transporte: "",
  chasis: "",
  acoplado: "",
  chofer: "",
}

export function EgresoFrutaFormModal({ open, onClose, onCreated, tenantId }: Props) {
  const [form, setForm] = useState<any>({ ...initialState, tenant_id: tenantId })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [errors, setErrors] = useState<{ [k: string]: string }>({})

  const validate = (field: keyof typeof form, value: any) => {
    let err = ""
    if (["producto", "cliente", "fecha", "peso_neto"].includes(field) && !value) {
      err = "Campo requerido"
    }
    if (field === "peso_neto" && (isNaN(value) || value <= 0)) {
      err = "Debe ser un número mayor a 0"
    }
    setErrors((prev) => ({ ...prev, [field]: err }))
    return err
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let val: any = value
    if (["peso_neto", "tara", "num_remito"].includes(name)) {
      val = value === "" ? "" : Number(value)
    }
    validate(name as keyof typeof form, val)
    setForm((prev: any) => ({ ...prev, [name]: val }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let hasError = false
    Object.entries(form).forEach(([k, v]) => {
      if (validate(k as keyof typeof form, v)) hasError = true
    })
    if (hasError) return
    setLoading(true)
    try {
      const { egresoFrutaApi } = await import("../../lib/api")
      const egreso = await egresoFrutaApi.createEgreso(form)
      toast({ title: "Egreso registrado", description: "El egreso fue guardado correctamente." })
      onCreated(egreso)
      onClose()
      setForm({ ...initialState, tenant_id: tenantId })
      setErrors({})
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Egreso de Fruta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium">Fecha
            <Input type="date" name="fecha" value={form.fecha} onChange={handleChange} required />
            {errors.fecha && <span className="text-xs text-red-500">{errors.fecha}</span>}
          </label>
          <label className="block text-sm font-medium">Producto
            <Input name="producto" value={form.producto} onChange={handleChange} required />
            {errors.producto && <span className="text-xs text-red-500">{errors.producto}</span>}
          </label>
          <label className="block text-sm font-medium">Peso Neto (kg)
            <Input name="peso_neto" value={form.peso_neto} onChange={handleChange} type="number" min={1} required />
            {errors.peso_neto && <span className="text-xs text-red-500">{errors.peso_neto}</span>}
          </label>
          <label className="block text-sm font-medium">Cliente
            <Input name="cliente" value={form.cliente} onChange={handleChange} required />
            {errors.cliente && <span className="text-xs text-red-500">{errors.cliente}</span>}
          </label>
          <label className="block text-sm font-medium">Finca
            <Input name="finca" value={form.finca} onChange={handleChange} />
          </label>
          <label className="block text-sm font-medium">Remito
            <Input name="num_remito" value={form.num_remito} onChange={handleChange} type="number" min={0} />
          </label>
          <label className="block text-sm font-medium">DTV
            <Input name="DTV" value={form.DTV} onChange={handleChange} />
          </label>
          <label className="block text-sm font-medium">Tara
            <Input name="tara" value={form.tara} onChange={handleChange} type="number" min={0} />
          </label>
          <label className="block text-sm font-medium">Transporte
            <Input name="transporte" value={form.transporte} onChange={handleChange} />
          </label>
          <label className="block text-sm font-medium">Chasis
            <Input name="chasis" value={form.chasis} onChange={handleChange} />
          </label>
          <label className="block text-sm font-medium">Acoplado
            <Input name="acoplado" value={form.acoplado} onChange={handleChange} />
          </label>
          <label className="block text-sm font-medium">Chofer
            <Input name="chofer" value={form.chofer} onChange={handleChange} />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
