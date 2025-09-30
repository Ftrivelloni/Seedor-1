"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { TaskFormModal } from "./task-form-modal"
import { campoApi } from "../../lib/api"
import { authService } from "../../lib/supabaseAuth"
import type { TareaCampo } from "../../lib/types"
import { Plus, Search, Filter, Edit, Trash2, Calendar, User } from "lucide-react"
import { 
  TASK_STATES, 
  TASK_TYPES, 
  getTaskTypeLabel, 
  getTaskStateLabel,
  getTaskStateBadgeVariant,
  getTaskTypeBadgeVariant,
  CAMPO_PERMISSION_ROLES,
  hasFieldPermission,
  getUniqueTaskTypes,
  getUniqueTaskStates
} from "../../lib/constants/campo"

export function CampoPage() {
  const [tareas, setTareas] = useState<TareaCampo[]>([])
  const [filteredTareas, setFilteredTareas] = useState<TareaCampo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TareaCampo | undefined>()

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLote, setFilterLote] = useState("all")
  const [filterTipo, setFilterTipo] = useState("all")
  const [filterEstado, setFilterEstado] = useState("all")

  const user = authService.getCurrentUser()

  useEffect(() => {
    loadTareas()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [tareas, searchTerm, filterLote, filterTipo, filterEstado])

  const loadTareas = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const data = await campoApi.getTareas(user.tenantId)
      setTareas(data)
    } catch (error) {
      console.error("Error al cargar tareas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = tareas

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (tarea) =>
          tarea.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tarea.lote.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tarea.cultivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tarea.responsable.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Lote filter
    if (filterLote !== "all") {
      filtered = filtered.filter((tarea) => tarea.lote === filterLote)
    }

    // Tipo filter
    if (filterTipo !== "all") {
      filtered = filtered.filter((tarea) => tarea.tipo === filterTipo)
    }

    // Estado filter
    if (filterEstado !== "all") {
      filtered = filtered.filter((tarea) => tarea.estado === filterEstado)
    }

    setFilteredTareas(filtered)
  }

  const handleCreateTask = async (taskData: Omit<TareaCampo, "id" | "fechaCreacion">) => {
    await campoApi.createTarea(taskData)
    await loadTareas()
  }

  const handleEditTask = async (taskData: Omit<TareaCampo, "id" | "fechaCreacion">) => {
    if (!editingTask) return
    await campoApi.updateTarea(editingTask.id, taskData)
    await loadTareas()
    setEditingTask(undefined)
  }

  const handleDeleteTask = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta tarea?")) {
      await campoApi.deleteTarea(id)
      await loadTareas()
    }
  }

  const openEditModal = (task: TareaCampo) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTask(undefined)
  }

  // Get unique values for filters
  const uniqueLotes = [...new Set(tareas.map((t) => t.lote))]
  const uniqueTipos = getUniqueTaskTypes(tareas)

  if (!user || !hasFieldPermission([user.rol])) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No tienes permisos para acceder a esta sección</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Campo</h1>
          <p className="text-muted-foreground">Administra las tareas y actividades del campo</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarea
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tareas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tareas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {tareas.filter((t) => t.estado === "pendiente").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {tareas.filter((t) => t.estado === "en-curso").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tareas.filter((t) => t.estado === "completada").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tareas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterLote} onValueChange={setFilterLote}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por lote" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los lotes</SelectItem>
                {uniqueLotes.map((lote) => (
                  <SelectItem key={lote} value={lote}>
                    {lote}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {uniqueTipos.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {TASK_STATES.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tareas de Campo</CardTitle>
          <CardDescription>
            {filteredTareas.length} de {tareas.length} tareas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote / Cultivo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTareas.map((tarea) => (
                  <TableRow key={tarea.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tarea.lote}</p>
                        <p className="text-sm text-muted-foreground">{tarea.cultivo}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{tarea.descripcion}</p>
                        {tarea.notas && <p className="text-sm text-muted-foreground">{tarea.notas}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTaskTypeBadgeVariant(tarea.tipo)}>
                        {getTaskTypeLabel(tarea.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTaskStateBadgeVariant(tarea.estado)}>
                        {getTaskStateLabel(tarea.estado)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{new Date(tarea.fechaProgramada).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{tarea.responsable}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(tarea)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTask(tarea.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredTareas.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron tareas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingTask ? handleEditTask : handleCreateTask}
        task={editingTask}
        tenantId={user.tenantId}
      />
    </div>
  )
}
