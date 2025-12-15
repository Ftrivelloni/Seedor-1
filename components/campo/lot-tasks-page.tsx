"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Badge } from "../ui/badge"
import { Plus, ArrowLeft, Pencil, Trash2 } from "lucide-react"
import { lotsApiService, tasksApiService } from "../../lib/campo"
import { workersService, Worker } from "../../lib/workers"
import type { Lot, Task, AuthUser } from "../../lib/types"
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
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dragOrigin, setDragOrigin] = useState<"pending" | "completed" | "overdue" | null>(null)
  const [isOverCompleted, setIsOverCompleted] = useState(false)

  useEffect(() => {
    loadData()
  }, [lotId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [lotData, tasksData, workersData] = await Promise.all([
        lotsApiService.getLotById(lotId),
        tasksApiService.getTasksByLot(lotId),
        workersService.getWorkersByTenant(user?.tenantId || "")
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
      await tasksApiService.createTask(user?.tenantId || "", {
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
      await tasksApiService.updateTask(selectedTask.id, data)
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

  // DnD: only allow drop into Completed from Pending or Overdue
  const handleDropToCompleted = async () => {
    try {
      if (!draggingTaskId) return
      // Only accept from pending or overdue
      if (dragOrigin !== "pending" && dragOrigin !== "overdue") return
      // Optimistic UI: move task to completed locally
      setTasks(prev => prev.map(t => t.id === draggingTaskId ? { ...t, status_code: "completada" } as Task : t))
      setIsOverCompleted(false)
      const taskId = draggingTaskId
      setDraggingTaskId(null)
      setDragOrigin(null)
      await tasksApiService.updateTask(taskId, { status_code: "completada" })
      // Refresh to re-evaluate overdue/pending correctly
      loadData()
      toast({ title: "Tarea completada", description: "La tarea se movió a Completadas" })
    } catch (error) {
      console.error("Error moving task to completed:", error)
      toast({
        title: "Error",
        description: "No se pudo completar la tarea",
        variant: "destructive"
      })
      // rollback
      loadData()
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

  const renderTaskCard = (task: Task, origin: "pending" | "completed" | "overdue") => (
    <Card
      key={task.id}
      className="p-4 space-y-3 relative group"
      draggable={true}
      onDragStart={(e) => {
        // Allow drag from pending and overdue to Completed, and from completed back to Pending
        setDraggingTaskId(task.id)
        setDragOrigin(origin)
        e.dataTransfer.effectAllowed = "move"
      }}
      onDragEnd={() => {
        setDraggingTaskId(null)
        setDragOrigin(null)
        setIsOverCompleted(false)
      }}
    >
      {/* Action icons */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedTask(task)
            setIsModalOpen(true)
          }}
          aria-label="Editar tarea"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={async (e) => {
            e.stopPropagation()
            if (!confirm("¿Eliminar esta tarea?")) return
            try {
              setDeleteLoadingId(task.id)
              await tasksApiService.deleteTask(task.id)
              toast({ title: "Tarea eliminada" })
              loadData()
            } catch (error) {
              console.error("Error deleting task:", error)
              toast({ title: "Error", description: "No se pudo eliminar la tarea", variant: "destructive" })
            } finally {
              setDeleteLoadingId(null)
            }
          }}
          disabled={deleteLoadingId === task.id}
          aria-label="Eliminar tarea"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
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
    </Card>
  )

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <header className="border-b bg-card/50 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-3 md:px-6 gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Button variant="ghost" size="icon" onClick={() => router.push(`/campo/${farmId}`)} className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-base md:text-xl font-semibold truncate">Cargando...</h1>
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
        <header className="border-b bg-card/50 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-3 md:px-6 gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Button variant="ghost" size="icon" onClick={() => router.push(`/campo/${farmId}`)} className="shrink-0">
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
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-3 md:px-6 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/campo/${farmId}`)} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base md:text-xl font-semibold truncate">{lot.code}</h1>
              <p className="text-xs md:text-sm text-muted-foreground capitalize truncate">
                {lot.crop}
                {lot.variety && ` • ${lot.variety}`}
                {lot.area_ha && ` • ${lot.area_ha} ha`}
              </p>
            </div>
          </div>
          <Button onClick={() => {
            setSelectedTask(undefined)
            setIsModalOpen(true)
          }} size="sm" className="shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline ml-2">Nueva tarea</span>
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
              <div
                className={`space-y-4`}
                onDragOver={(e) => {
                  // Allow drop from completed back to pending
                  if (dragOrigin === "completed") {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = "move"
                  }
                }}
                onDrop={async (e) => {
                  e.preventDefault()
                  if (dragOrigin !== "completed" || !draggingTaskId) return
                  try {
                    // Optimistic UI: move to pending locally
                    setTasks(prev => prev.map(t => t.id === draggingTaskId ? { ...t, status_code: "pendiente" } as Task : t))
                    const taskId = draggingTaskId
                    setDraggingTaskId(null)
                    setDragOrigin(null)
                    await tasksApiService.updateTask(taskId, { status_code: "pendiente" })
                    loadData()
                    toast({ title: "Tarea reabierta", description: "La tarea volvió a Por hacer" })
                  } catch (error) {
                    console.error("Error moving task to pending:", error)
                    toast({ title: "Error", description: "No se pudo reabrir la tarea", variant: "destructive" })
                    loadData()
                  }
                }}
              >
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
                    pending.map(t => renderTaskCard(t, "pending"))
                  )}
                </div>
              </div>

              {/* Tareas completadas */}
              <div
                className={`space-y-4 ${isOverCompleted ? "outline outline-2 outline-green-400/60 rounded-md" : ""}`}
                onDragOver={(e) => {
                  // Allow drop only from pending/overdue
                  if (dragOrigin === "pending" || dragOrigin === "overdue") {
                    e.preventDefault()
                    setIsOverCompleted(true)
                    e.dataTransfer.dropEffect = "move"
                  } else {
                    setIsOverCompleted(false)
                  }
                }}
                onDragLeave={() => setIsOverCompleted(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  if (dragOrigin === "pending" || dragOrigin === "overdue") {
                    handleDropToCompleted()
                  }
                }}
              >
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="w-1 h-6 bg-green-600 rounded-full" />
                  <h2 className="font-semibold">Tareas completadas</h2>
                  <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800">
                    {completed.length}
                  </Badge>
                </div>
                {completed.length === 0 && (
                  <div className="text-xs text-muted-foreground italic mb-2">Arrastrá tareas acá para marcarlas como completadas</div>
                )}
                <div className="space-y-3">
                  {completed.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No hay tareas completadas
                    </p>
                  ) : (
                    completed.map(t => renderTaskCard(t, "completed"))
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
                    overdue.map(t => renderTaskCard(t, "overdue"))
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
