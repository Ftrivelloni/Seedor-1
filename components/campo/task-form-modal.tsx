"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { TareaCampo } from "@/lib/mocks"

interface TaskFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (tarea: Omit<TareaCampo, "id" | "fechaCreacion">) => Promise<void>
  task?: TareaCampo
  tenantId: string
}

const tiposTarea = [
  { value: "insecticida", label: "Insecticida" },
  { value: "fertilizante", label: "Fertilizante" },
  { value: "poda", label: "Poda" },
  { value: "riego", label: "Riego" },
  { value: "cosecha", label: "Cosecha" },
]

const estadosTarea = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en-curso", label: "En Curso" },
  { value: "completada", label: "Completada" },
]

export function TaskFormModal({ isOpen, onClose, onSubmit, task, tenantId }: TaskFormModalProps) {
  const [formData, setFormData] = useState({
    lote: task?.lote || "",
    cultivo: task?.cultivo || "",
    tipo: task?.tipo || "fertilizante",
    descripcion: task?.descripcion || "",
    fechaProgramada: task?.fechaProgramada || "",
    responsable: task?.responsable || "",
    estado: task?.estado || "pendiente",
    notas: task?.notas || "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onSubmit({
        ...formData,
        tenantId,
        tipo: formData.tipo as TareaCampo["tipo"],
        estado: formData.estado as TareaCampo["estado"],
      })
      onClose()
      // Reset form
      setFormData({
        lote: "",
        cultivo: "",
        tipo: "fertilizante",
        descripcion: "",
        fechaProgramada: "",
        responsable: "",
        estado: "pendiente",
        notas: "",
      })
    } catch (error) {
      console.error("Error al guardar tarea:", error)
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
          <DialogTitle>{task ? "Editar Tarea" : "Nueva Tarea de Campo"}</DialogTitle>
          <DialogDescription>
            {task ? "Modifica los detalles de la tarea" : "Crea una nueva tarea para el campo"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lote">Lote</Label>
              <Input
                id="lote"
                value={formData.lote}
                onChange={(e) => handleChange("lote", e.target.value)}
                placeholder="Ej: Lote A-1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cultivo">Cultivo</Label>
              <Input
                id="cultivo"
                value={formData.cultivo}
                onChange={(e) => handleChange("cultivo", e.target.value)}
                placeholder="Ej: Naranjas"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Tarea</Label>
              <Select value={formData.tipo} onValueChange={(value) => handleChange("tipo", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposTarea.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select value={formData.estado} onValueChange={(value) => handleChange("estado", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {estadosTarea.map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleChange("descripcion", e.target.value)}
              placeholder="Descripción de la tarea"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaProgramada">Fecha Programada</Label>
              <Input
                id="fechaProgramada"
                type="date"
                value={formData.fechaProgramada}
                onChange={(e) => handleChange("fechaProgramada", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsable">Responsable</Label>
              <Input
                id="responsable"
                value={formData.responsable}
                onChange={(e) => handleChange("responsable", e.target.value)}
                placeholder="Nombre del responsable"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas (Opcional)</Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => handleChange("notas", e.target.value)}
              placeholder="Notas adicionales sobre la tarea"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : task ? "Actualizar" : "Crear Tarea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
