"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Calendar } from "../ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "../../lib/utils"
import { tasksApi, workersApi } from "../../lib/api"
import type { Task, TaskType, Worker } from "../../lib/types"

interface TaskFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TaskFormData) => Promise<void>
  farmId: string
  lotId: string
  tenantId: string
  task?: Task
}

export interface TaskFormData {
  title: string
  type_code?: string
  scheduled_date?: string
  responsible_membership_id?: string | null
  worker_id?: string | null
  status_code: string
}

export function TaskFormModal({ isOpen, onClose, onSubmit, farmId, lotId, tenantId, task }: TaskFormModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    type_code: "",
    scheduled_date: "",
    responsible_membership_id: "",
    status_code: "pendiente"
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [loadingWorkers, setLoadingWorkers] = useState(false)

  useEffect(() => {
    loadTaskTypes()
    if (isOpen && tenantId) {
      loadWorkers()
    }
  }, [isOpen, tenantId])

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        type_code: task.type_code,
        scheduled_date: task.scheduled_date || "",
        responsible_membership_id: task.responsible_membership_id || "",
        status_code: task.status_code
      })
      if (task.scheduled_date) {
        setSelectedDate(new Date(task.scheduled_date))
      }
    } else {
      setFormData({
        title: "",
        type_code: "",
        scheduled_date: "",
        responsible_membership_id: "",
        status_code: "pendiente"
      })
      setSelectedDate(undefined)
    }
  }, [task, isOpen])

  const loadTaskTypes = async () => {
    try {
      const data = await tasksApi.getTaskTypes()
      if (data && data.length > 0) {
        setTaskTypes(data)
      } else {
        // Fallback default types
        setTaskTypes([
          { code: "riego", name: "Riego" },
          { code: "fertilizacion", name: "Fertilización" },
          { code: "poda", name: "Poda" },
          { code: "control_plagas", name: "Control de plagas" },
          { code: "cosecha", name: "Cosecha" },
          { code: "otro", name: "Otro" }
        ])
      }
    } catch (error) {
      console.error("Error loading task types:", error)
      setTaskTypes([
        { code: "riego", name: "Riego" },
        { code: "fertilizacion", name: "Fertilización" },
        { code: "poda", name: "Poda" },
        { code: "control_plagas", name: "Control de plagas" },
        { code: "cosecha", name: "Cosecha" },
        { code: "otro", name: "Otro" }
      ])
    }
  }

  const loadWorkers = async () => {
    try {
      setLoadingWorkers(true)
      const data = await workersApi.getWorkersByTenant(tenantId)
      setWorkers(data)
    } catch (error) {
      console.error("Error loading workers:", error)
      setWorkers([])
    } finally {
      setLoadingWorkers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.scheduled_date) {
      return
    }

    setIsSubmitting(true)
    try {
      // Si el responsible_membership_id empieza con "worker-", extraemos el worker_id
      let workerId: string | null = null
      let membershipId: string | null = formData.responsible_membership_id || null
      
      if (formData.responsible_membership_id?.startsWith('worker-')) {
        workerId = formData.responsible_membership_id.replace('worker-', '')
        membershipId = null
      }
      
      const dataToSubmit = {
        ...formData,
        responsible_membership_id: membershipId,
        worker_id: workerId
      }
      
      await onSubmit(dataToSubmit)
      onClose()
    } catch (error) {
      console.error("Error submitting task:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Tarea<span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Riego del sector norte"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de tarea</Label>
            <Select
              value={formData.type_code}
              onValueChange={(value) => setFormData({ ...formData, type_code: value })}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                {taskTypes.map((type) => (
                  <SelectItem key={type.code} value={type.code}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Fecha límite<span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: es })
                  ) : (
                    <span>Selecciona una fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date)
                    setFormData({
                      ...formData,
                      scheduled_date: date ? format(date, "yyyy-MM-dd") : ""
                    })
                  }}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible">
              Responsable<span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.responsible_membership_id || undefined}
              onValueChange={(value) => setFormData({ ...formData, responsible_membership_id: value })}
              disabled={loadingWorkers}
            >
              <SelectTrigger id="responsible">
                <SelectValue placeholder={loadingWorkers ? "Cargando..." : "Selecciona un responsable"} />
              </SelectTrigger>
              <SelectContent>
                {workers.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No hay trabajadores disponibles
                  </div>
                ) : (
                  workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.membership_id || `worker-${worker.id}`}>
                      <div className="flex flex-col">
                        <span className="font-medium">{worker.full_name}</span>
                        <span className="text-xs text-muted-foreground">{worker.email}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
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
            <Button type="submit" disabled={isSubmitting || !formData.title.trim() || !formData.scheduled_date || !formData.responsible_membership_id}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
