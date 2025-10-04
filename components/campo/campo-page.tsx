"use client";


import { IconBadge } from "@/components/ui/icon-badge";
import { Sprout, ClipboardList, Clock3, PlayCircle, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { TaskFormModal } from "./task-form-modal";
import { campoApi } from "../../lib/api";                   // get/update/delete
import { createTareaAction } from "@/app/campo/actions";    // create
import { authService } from "../../lib/supabaseAuth";
import type { TareaCampo } from "../../lib/types";
import { Plus, Search, Filter, Edit, Trash2, Calendar, User } from "lucide-react";
import {
  TASK_STATES,
  getTaskTypeLabel,
  getTaskStateLabel,
  getTaskStateBadgeVariant,
  getTaskTypeBadgeVariant,
  hasFieldPermission,
  getUniqueTaskTypes,
} from "../../lib/constants/campo";

type NuevaTarea = Omit<TareaCampo, "id" | "fechaCreacion">;

export function CampoPage() {
  const [tareas, setTareas] = useState<TareaCampo[]>([]);
  const [filteredTareas, setFilteredTareas] = useState<TareaCampo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TareaCampo | undefined>(undefined);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLote, setFilterLote] = useState("all");
  const [filterTipo, setFilterTipo] = useState("all");
  const [filterEstado, setFilterEstado] = useState("all");

  const user = authService.getCurrentUser();

  useEffect(() => {
    loadTareas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tareas, searchTerm, filterLote, filterTipo, filterEstado]);

  async function loadTareas() {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await campoApi.getTareas(user.tenantId);
      setTareas(data);
    } catch (error) {
      console.error("Error al cargar tareas:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...tareas];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.descripcion.toLowerCase().includes(q) ||
          t.lote.toLowerCase().includes(q) ||
          t.cultivo.toLowerCase().includes(q) ||
          t.responsable.toLowerCase().includes(q)
      );
    }
    if (filterLote !== "all") filtered = filtered.filter((t) => t.lote === filterLote);
    if (filterTipo !== "all") filtered = filtered.filter((t) => t.tipo === filterTipo);
    if (filterEstado !== "all") filtered = filtered.filter((t) => t.estado === filterEstado);

    setFilteredTareas(filtered);
  }

  // -------- Handlers ----------
  async function handleCreateTask(newTarea: NuevaTarea): Promise<void> {
    const res = await createTareaAction(newTarea);
    if (!res.ok) {
      console.error("Error creando tarea:", res.message);
      return;
    }
    if (res.data) setTareas((prev) => [res.data as TareaCampo, ...prev]);
    else await loadTareas();

    setIsModalOpen(false);
    setEditingTask(undefined);
  }

  async function handleEditTask(taskData: NuevaTarea): Promise<void> {
    if (!editingTask) return;
    await campoApi.updateTarea(editingTask.id, taskData);
    await loadTareas();
    setIsModalOpen(false);
    setEditingTask(undefined);
  }

  async function handleDeleteTask(id: string) {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarea?")) return;
    await campoApi.deleteTarea(id);
    await loadTareas();
  }

  function openEditModal(task: TareaCampo) {
    setEditingTask(task);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingTask(undefined);
  }

  // Valores únicos para filtros
  const uniqueLotes = [...new Set(tareas.map((t) => t.lote))];
  const uniqueTipos = getUniqueTaskTypes(tareas);

  if (!user || !hasFieldPermission([user.rol])) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No tienes permisos para acceder a esta sección</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
       <div className="flex items-center gap-3">
      <div className="hidden md:flex h-10 w-10 items-center justify-center rounded-2xl bg-lime-50 text-lime-700 dark:bg-lime-900/20">
      <Sprout className="h-5 w-5" />
      </div>
      <div>
      <h1 className="text-2xl font-bold">Gestión de Campo</h1>
      <p className="text-muted-foreground">Administra las tareas y actividades del campo</p>
    </div>
  </div>

  <Button onClick={() => setIsModalOpen(true)}>
    <Plus className="mr-2 h-4 w-4" />
    Nueva Tarea
  </Button>
</div>

<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
  {/* Total */}
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-start justify-between">
        <CardTitle className="text-sm font-medium">Total Tareas</CardTitle>
        <IconBadge className="bg-blue-50 text-blue-600 dark:bg-blue-900/20">
          <ClipboardList className="h-5 w-5" />
        </IconBadge>
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{tareas.length}</div>
    </CardContent>
  </Card>

  {/* Pendientes */}
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-start justify-between">
        <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
        <IconBadge className="bg-orange-50 text-orange-600 dark:bg-orange-900/20">
          <Clock3 className="h-5 w-5" />
        </IconBadge>
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-orange-600">
        {tareas.filter((t) => t.estado === "pendiente").length}
      </div>
    </CardContent>
  </Card>

  {/* En curso */}
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-start justify-between">
        <CardTitle className="text-sm font-medium">En Curso</CardTitle>
        <IconBadge className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20">
          <PlayCircle className="h-5 w-5" />
        </IconBadge>
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-indigo-600">
        {tareas.filter((t) => t.estado === "en-curso").length}
      </div>
    </CardContent>
  </Card>

  {/* Completadas */}
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-start justify-between">
        <CardTitle className="text-sm font-medium">Completadas</CardTitle>
        <IconBadge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
          <CheckCircle2 className="h-5 w-5" />
        </IconBadge>
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-green-600">
        {tareas.filter((t) => t.estado === "completada").length}
      </div>
    </CardContent>
  </Card>
</div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" /><span>Filtros</span>
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
              <SelectTrigger><SelectValue placeholder="Filtrar por lote" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los lotes</SelectItem>
                {uniqueLotes.map((lote) => (
                  <SelectItem key={lote} value={lote}>{lote}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger><SelectValue placeholder="Filtrar por tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {uniqueTipos.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {TASK_STATES.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>{estado.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Tareas de Campo</CardTitle>
          <CardDescription>{filteredTareas.length} de {tareas.length} tareas</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
                        <span className="text-sm">
                          {new Date(tarea.fechaProgramada).toLocaleDateString()}
                        </span>
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

      {/* Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingTask ? handleEditTask : handleCreateTask}
        task={editingTask}
        tenantId={user.tenantId}
      />
    </div>
  );
}
