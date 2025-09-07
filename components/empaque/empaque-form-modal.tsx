"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/ui/button"
import { Input } from "@/ui/input"
import { Label } from "@/ui/label"
import { Textarea } from "@/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog"
import type { RegistroEmpaque } from "../../lib/mocks"

interface EmpaqueFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (registro: Omit<RegistroEmpaque, "id" | "kgDescartados">) => Promise<void>
  tenantId: string
}

export function EmpaqueFormModal({ isOpen, onClose, onSubmit, tenantId }: EmpaqueFormModalProps) {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split("T")[0],
    cultivo: "",
    kgEntraron: "",
    kgSalieron: "",
    notas: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onSubmit({
        tenantId,
        fecha: formData.fecha,
        cultivo: formData.cultivo,
        kgEntraron: Number(formData.kgEntraron),
        kgSalieron: Number(formData.kgSalieron),
        notas: formData.notas || undefined,
      })
      onClose()
      // Reset form
      setFormData({
        fecha: new Date().toISOString().split("T")[0],
        cultivo: "",
        kgEntraron: "",
        kgSalieron: "",
        notas: "",
      })
    } catch (error) {
      console.error("Error al guardar registro:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const kgDescartados = Number(formData.kgEntraron || 0) - Number(formData.kgSalieron || 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Registro de Empaque</DialogTitle>
          <DialogDescription>Registra el procesamiento de fruta del día</DialogDescription>
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
              <Label htmlFor="cultivo">Cultivo</Label>
              <Input
                id="cultivo"
                value={formData.cultivo}
                onChange={(e) => handleChange("cultivo", e.target.value)}
                placeholder="Ej: Naranjas, Limones"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kgEntraron">Kg que Entraron</Label>
              <Input
                id="kgEntraron"
                type="number"
                min="0"
                step="0.1"
                value={formData.kgEntraron}
                onChange={(e) => handleChange("kgEntraron", e.target.value)}
                placeholder="0.0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kgSalieron">Kg que Salieron</Label>
              <Input
                id="kgSalieron"
                type="number"
                min="0"
                step="0.1"
                value={formData.kgSalieron}
                onChange={(e) => handleChange("kgSalieron", e.target.value)}
                placeholder="0.0"
                required
              />
            </div>
          </div>

          {/* Calculated field */}
          <div className="p-3 bg-muted rounded-lg">
            <Label className="text-sm font-medium">Kg Descartados (Calculado)</Label>
            <p className="text-2xl font-bold text-destructive">{kgDescartados.toFixed(1)} kg</p>
            <p className="text-xs text-muted-foreground">
              {kgDescartados > 0
                ? `${((kgDescartados / Number(formData.kgEntraron || 1)) * 100).toFixed(1)}% de descarte`
                : "Sin descarte"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas (Opcional)</Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => handleChange("notas", e.target.value)}
              placeholder="Observaciones sobre el procesamiento, motivos de descarte, etc."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Crear Registro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
