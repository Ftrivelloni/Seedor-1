"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import type { Farm } from "../../lib/types"

interface FarmFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: FarmFormData) => Promise<void>
  farm?: Farm
}

export interface FarmFormData {
  name: string
  location?: string
  area_ha?: number
  default_crop?: string
  notes?: string
}

export function FarmFormModal({ isOpen, onClose, onSubmit, farm }: FarmFormModalProps) {
  const [formData, setFormData] = useState<FarmFormData>({
    name: "",
    location: "",
    area_ha: undefined,
    default_crop: "",
    notes: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (farm) {
      setFormData({
        name: farm.name,
        location: farm.location || "",
        area_ha: farm.area_ha || undefined,
        default_crop: farm.default_crop || "",
        notes: farm.notes || ""
      })
    } else {
      setFormData({
        name: "",
        location: "",
        area_ha: undefined,
        default_crop: "",
        notes: ""
      })
    }
  }, [farm, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{farm ? "Editar Campo" : "Crear Nuevo Campo"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre del Campo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Campo Norte, Finca San José"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Ubicación</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ej: Ruta 5 Km 23, Mendoza"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area_ha">Área (hectáreas)</Label>
            <Input
              id="area_ha"
              type="number"
              step="0.01"
              min="0"
              value={formData.area_ha || ""}
              onChange={(e) => setFormData({ 
                ...formData, 
                area_ha: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
              placeholder="Ej: 50.5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_crop">Cultivo Principal</Label>
            <Input
              id="default_crop"
              value={formData.default_crop}
              onChange={(e) => setFormData({ ...formData, default_crop: e.target.value })}
              placeholder="Ej: Manzanas, Uvas, Trigo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Información adicional sobre el campo..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : farm ? "Guardar Cambios" : "Crear Campo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
