"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Badge } from "../ui/badge"
import { Plus, ArrowLeft, Circle, CheckCircle2 } from "lucide-react"
import { lotsApi, tasksApi, workersApi } from "../../lib/api"
import type { Lot, Task, Worker, AuthUser } from "../../lib/types"
import { TaskFormModal, type TaskFormData } from "./task-form-modal"
import { toast } from "../../hooks/use-toast"

interface LotTasksPageProps {
  farmId: string
  lotId: string
  user?: AuthUser
}

export function LotTasksPage({ farmId, lotId, user }: LotTasksPageProps) {
  const router = useRouter()
  const [lot, setLot] = useState<Lot | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined)

  useEffect(() => {
    loadData()
  }, [lotId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [lotData, tasksData, workersData] = await Promise.all([
        lotsApi.getLotById(lotId),
        tasksApi.getTasksByLot(lotId),
        workersApi.getWorkersByTenant(user?.tenantId || "")
      ])
      setLot(lotData)
      setTasks(tasksData)
      setWorkers(workersData)
    } catch (error) {
      console.error("Error loading lot data:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información del lote",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (data: TaskFormData) => {
    try {
      await tasksApi.createTask(user?.tenantId || "", {
        ...data,
        farm_id: farmId,
        lot_id: lotId
      }, user?.id)
      toast({
        title: "Éxito",
        description: "Tarea creada correctamente"
      })
      loadData()
    } catch (error: any) {
      console.error("Error creating task:", error)
      const errorMessage = error?.message || "No se pudo crear la tarea"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const handleEditTask = async (data: TaskFormData) => {
    if (!selectedTask) return

    try {
      await tasksApi.updateTask(selectedTask.id, data)
      toast({
        title: "Éxito",
        description: "Tarea actualizada correctamente"
      })
      loadData()
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea",
        variant: "destructive"
      })
    }
  }

  const toggleTaskStatus = async (task: Task) => {
    try {
      const newStatus = task.status_code === "completada" ? "pendiente" : "completada"
      await tasksApi.updateTask(task.id, { status_code: newStatus })
      loadData()
    } catch (error) {
      console.error("Error updating task status:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la tarea",
        variant: "destructive"
      })
    }
  }

  const isTaskOverdue = (task: Task): boolean => {
    if (!task.scheduled_date || task.status_code === "completada") return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const scheduledDate = new Date(task.scheduled_date)
    scheduledDate.setHours(0, 0, 0, 0)
    return scheduledDate < today
  }

  const getTasksByStatus = () => {
    const pending = tasks.filter(t => t.status_code !== "completada" && !isTaskOverdue(t))
    const completed = tasks.filter(t => t.status_code === "completada")
    const overdue = tasks.filter(t => isTaskOverdue(t))
    
    return { pending, completed, overdue }
  }

  const getWorkerName = (task: Task): string => {
    // Primero intentar buscar por membership_id
    if (task.responsible_membership_id) {
      const workerByMembership = workers.find(w => w.membership_id === task.responsible_membership_id)
      if (workerByMembership) return workerByMembership.full_name
    }
    
    // Luego buscar por worker_id
    if (task.worker_id) {
      const workerById = workers.find(w => w.id === task.worker_id)
      if (workerById) return workerById.full_name
    }
    
    return "Sin asignar"
  }

  const renderTaskCard = (task: Task) => (
    <Card key={task.id} className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-sm">{task.title}</h4>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-1 text-xs text-muted-foreground">
        <p>Responsable: {getWorkerName(task)}</p>
        {task.scheduled_date && (
          <p>Fecha límite: {new Date(task.scheduled_date).toLocaleDateString()}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => toggleTaskStatus(task)}
        >
          {task.status_code === "completada" ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="border-b bg-card">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push(`/campo/${farmId}`)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Cargando...</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
            <p className="text-muted-foreground">Cargando información del lote...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!lot) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="border-b bg-card">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push(`/campo/${farmId}`)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Lote no encontrado</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
            <p className="text-muted-foreground">El lote solicitado no existe</p>
          </div>
        </main>
      </div>
    )
  }

  const { pending, completed, overdue } = getTasksByStatus()

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/campo/${farmId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{lot.code}</h1>
              <p className="text-sm text-muted-foreground capitalize">
                {lot.crop}
                {lot.variety && ` • ${lot.variety}`}
                {lot.area_ha && ` • ${lot.area_ha} ha`}
              </p>
            </div>
          </div>
          <Button onClick={() => {
            setSelectedTask(undefined)
            setIsModalOpen(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva tarea
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto bg-muted/30">
        <div className="max-w-7xl mx-auto">
          {tasks.length === 0 ? (
            <Card className="p-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No hay tareas cargadas</h3>
              <p className="text-muted-foreground mb-6">
                Comienza creando tu primera tarea para este lote
              </p>
              <Button onClick={() => {
                setSelectedTask(undefined)
                setIsModalOpen(true)
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva tarea
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tareas por hacer */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="w-1 h-6 bg-gray-800 dark:bg-gray-200 rounded-full" />
                  <h2 className="font-semibold">Tareas por hacer</h2>
                  <Badge variant="secondary" className="ml-auto">
                    {pending.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {pending.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No hay tareas pendientes
                    </p>
                  ) : (
                    pending.map(renderTaskCard)
                  )}
                </div>
              </div>

              {/* Tareas completadas */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="w-1 h-6 bg-green-600 rounded-full" />
                  <h2 className="font-semibold">Tareas completadas</h2>
                  <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800">
                    {completed.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {completed.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No hay tareas completadas
                    </p>
                  ) : (
                    completed.map(renderTaskCard)
                  )}
                </div>
              </div>

              {/* Tareas atrasadas */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="w-1 h-6 bg-red-600 rounded-full" />
                  <h2 className="font-semibold">Tareas atrasadas</h2>
                  <Badge variant="secondary" className="ml-auto bg-red-100 text-red-800">
                    {overdue.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {overdue.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No hay tareas atrasadas
                    </p>
                  ) : (
                    overdue.map(renderTaskCard)
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedTask(undefined)
        }}
        onSubmit={selectedTask ? handleEditTask : handleCreateTask}
        farmId={farmId}
        lotId={lotId}
        tenantId={user?.tenantId || ""}
        task={selectedTask}
      />
    </div>
  )
}
