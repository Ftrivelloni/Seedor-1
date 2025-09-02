"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { MovimientoCaja } from "@/lib/mocks"

interface FinanzasFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (movimiento: Omit<MovimientoCaja, "id">) => Promise<void>
  tenantId: string
}

const tiposMovimiento = [
  { value: "ingreso", label: "Ingreso" },
  { value: "egreso", label: "Egreso" },
]

const categorias = [
  "Ventas",
  "Insumos",
  "Mano de obra",
  "Combustible",
  "Mantenimiento",
  "Servicios",
  "Transporte",
  "Otros ingresos",
  "Otros gastos",
]

export function FinanzasFormModal({ isOpen, onClose, onSubmit, tenantId }: FinanzasFormModalProps) {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split("T")[0],
    tipo: "egreso" as "ingreso" | "egreso",
    monto: "",
    concepto: "",
    categoria: "",
    comprobante: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onSubmit({
        tenantId,
        fecha: formData.fecha,
        tipo: formData.tipo,
        monto: Number(formData.monto),
        concepto: formData.concepto,
        categoria: formData.categoria,
        comprobante: formData.comprobante || undefined,
      })
      onClose()
      // Reset form
      setFormData({
        fecha: new Date().toISOString().split("T")[0],
        tipo: "egreso",
        monto: "",
        concepto: "",
        categoria: "",
        comprobante: "",
      })
    } catch (error) {
      console.error("Error al guardar movimiento:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Movimiento de Caja</DialogTitle>
          <DialogDescription>Registra un ingreso o egreso en la caja chica</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => handleChange("fecha", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={formData.tipo} onValueChange={(value) => handleChange("tipo", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposMovimiento.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monto">Monto ($)</Label>
              <Input
                id="monto"
                type="number"
                min="0"
                step="0.01"
                value={formData.monto}
                onChange={(e) => handleChange("monto", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select value={formData.categoria} onValueChange={(value) => handleChange("categoria", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="concepto">Concepto</Label>
            <Input
              id="concepto"
              value={formData.concepto}
              onChange={(e) => handleChange("concepto", e.target.value)}
              placeholder="Descripción del movimiento"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comprobante">Comprobante (Opcional)</Label>
            <Input
              id="comprobante"
              value={formData.comprobante}
              onChange={(e) => handleChange("comprobante", e.target.value)}
              placeholder="Número de factura, recibo, etc."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Crear Movimiento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
