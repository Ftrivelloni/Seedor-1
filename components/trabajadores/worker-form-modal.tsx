"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import type { Worker } from "../../lib/workers"

interface WorkerFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: WorkerFormData) => Promise<void>
  worker?: Worker
}

export interface WorkerFormData {
  full_name: string
  document_id: string
  email: string
  phone?: string
  area_module: string
}

const AREA_MODULES = [
  { value: "campo", label: "Campo" },
  { value: "empaque", label: "Empaque" }
]

export function WorkerFormModal({ isOpen, onClose, onSubmit, worker }: WorkerFormModalProps) {
  const [formData, setFormData] = useState<WorkerFormData>({
    full_name: "",
    document_id: "",
    email: "",
    phone: "",
    area_module: "campo"
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (worker) {
      // Solo permitir 'campo' o 'empaque' al editar
      const allowedAreas = ["campo", "empaque"] as const
      const safeArea = allowedAreas.includes(worker.area_module as any) ? worker.area_module : "campo"
      setFormData({
        full_name: worker.full_name,
        document_id: worker.document_id,
        email: worker.email,
        phone: worker.phone || "",
        area_module: safeArea
      })
    } else {
      setFormData({
        full_name: "",
        document_id: "",
        email: "",
        phone: "",
        area_module: "campo"
      })
    }
  }, [worker, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.full_name.trim() || !formData.document_id.trim() || !formData.email.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error("Error submitting worker:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{worker ? "Editar trabajador" : "Nuevo trabajador"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">
              Nombre completo<span className="text-red-500">*</span>
            </Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Ej: Juan Pérez"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="document_id">
              DNI/Documento<span className="text-red-500">*</span>
            </Label>
            <Input
              id="document_id"
              value={formData.document_id}
              onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
              placeholder="Ej: 12345678"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email<span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ejemplo@correo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ej: +54 9 11 1234-5678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area_module">
              Área/Módulo<span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.area_module}
              onValueChange={(value) => setFormData({ ...formData, area_module: value })}
            >
              <SelectTrigger id="area_module">
                <SelectValue placeholder="Selecciona el área" />
              </SelectTrigger>
              <SelectContent>
                {AREA_MODULES.map((module) => (
                  <SelectItem key={module.value} value={module.value}>
                    {module.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
