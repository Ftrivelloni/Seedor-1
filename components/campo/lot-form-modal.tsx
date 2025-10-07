"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { lotsApi } from "../../lib/api"
import type { Lot } from "../../lib/types"

interface LotFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: LotFormData) => Promise<void>
  farmId: string
  lot?: Lot
}

export interface LotFormData {
  code: string
  crop: string
  variety?: string
  area_ha?: number
  plant_date?: string
  status: string
}

export function LotFormModal({ isOpen, onClose, onSubmit, farmId, lot }: LotFormModalProps) {
  const [formData, setFormData] = useState<LotFormData>({
    code: "",
    crop: "",
    variety: "",
    area_ha: undefined,
    plant_date: "",
    status: "activo"
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statuses, setStatuses] = useState<{ code: string; name: string }[]>([])

  useEffect(() => {
    loadStatuses()
  }, [])

  useEffect(() => {
    if (lot) {
      setFormData({
        code: lot.code,
        crop: lot.crop,
        variety: lot.variety || "",
        area_ha: lot.area_ha || undefined,
        plant_date: lot.plant_date || "",
        status: lot.status
      })
    } else {
      setFormData({
        code: "",
        crop: "",
        variety: "",
        area_ha: undefined,
        plant_date: "",
        status: "activo"
      })
    }
  }, [lot, isOpen])

  const loadStatuses = async () => {
    try {
      const data = await lotsApi.getLotStatuses()
      if (data && data.length > 0) {
        setStatuses(data)
      } else {
        setStatuses([
          { code: "activo", name: "Activo" },
          { code: "inactivo", name: "Inactivo" },
          { code: "preparacion", name: "En preparación" }
        ])
      }
    } catch (error) {
      console.error("Error loading statuses:", error)
      setStatuses([
        { code: "activo", name: "Activo" },
        { code: "inactivo", name: "Inactivo" },
        { code: "preparacion", name: "En preparación" }
      ])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.code.trim() || !formData.crop.trim()) {
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
          <DialogTitle>{lot ? "Editar Lote" : "Cargar Nuevo Lote"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">
              Código del Lote <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Ej: L-34, Lote 1A"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="crop">
              Cultivo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="crop"
              value={formData.crop}
              onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
              placeholder="Ej: Manzanas, Uvas, Trigo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="variety">Variedad</Label>
            <Input
              id="variety"
              value={formData.variety}
              onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
              placeholder="Ej: Red Delicious, Malbec"
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
              placeholder="Ej: 5.5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plant_date">Fecha de Plantación</Label>
            <Input
              id="plant_date"
              type="date"
              value={formData.plant_date}
              onChange={(e) => setFormData({ ...formData, plant_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">
              Estado <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                {statuses.length > 0 ? (
                  statuses.map((status) => (
                    <SelectItem key={status.code} value={status.code}>
                      {status.name}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="preparacion">En preparación</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
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
              {isSubmitting ? "Guardando..." : lot ? "Guardar Cambios" : "Cargar Lote"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
