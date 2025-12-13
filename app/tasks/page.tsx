"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

import { Sidebar } from "../../components/sidebar"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import { useDashboardTasks } from "../../hooks/use-dashboard-tasks"
import { useAuth } from "../../hooks/use-auth"
import { FeatureProvider } from "../../lib/features-context"
import type { DashboardTaskStatus } from "../../lib/tasks"

const statusLabels: Record<DashboardTaskStatus, string> = {
  PENDING: "Pendiente",
  COMPLETED: "Completada",
  INCOMPLETE: "Incompleta",
}

const statusBadge: Record<DashboardTaskStatus, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  COMPLETED: "default",
  INCOMPLETE: "destructive",
}

const todayIso = () => {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = `${d.getMonth() + 1}`.padStart(2, "0")
  const dd = `${d.getDate()}`.padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export default function TasksPage() {
  const router = useRouter()
  const { user, loading, handleLogout, hasRequiredRole } = useAuth({
    redirectToLogin: true,
    requireRoles: ["admin"],
  })

  const {
    tasks,
    loading: tasksLoading,
    error,
    filters,
    setFilters,
    refresh,
  } = useDashboardTasks({ date: todayIso() }, { enabled: !!user?.tenantId })

  // Scope queries by tenant as soon as it's available.
  useEffect(() => {
    if (user?.tenantId) {
      setFilters((prev) => ({
        ...prev,
        tenantId: user.tenantId || prev.tenantId,
      }))
    }
  }, [user?.tenantId, setFilters])

  const sectorOptions = useMemo(() => {
    const map = new Map<string, string>()
    tasks.forEach((task) => {
      const value = task.sectorId || task.sectorName
      if (!value) return
      const label = task.sectorName || value
      map.set(value, label)
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [tasks])

  const workerOptions = useMemo(() => {
    const map = new Map<string, string>()
    tasks.forEach((task) => {
      const value = task.workerId || task.workerName
      if (!value) return
      const label = task.workerName || value
      map.set(value, label)
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [tasks])

  const renderStatus = (status: DashboardTaskStatus) => (
    <Badge variant={statusBadge[status]}>{statusLabels[status]}</Badge>
  )

  const formatDate = (value?: string | null) => {
    if (!value) return "—"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString("es-ES")
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!hasRequiredRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm text-muted-foreground">
          Necesitas permisos de administrador para ver las tareas.
        </div>
      </div>
    )
  }

  return (
    <FeatureProvider user={user}>
      <div className="min-h-screen bg-background flex">
        <Sidebar
          user={user}
          onLogout={handleLogout}
          onNavigate={(page) => {
            const pageRoutes: Record<string, string> = {
              dashboard: "/home",
              campo: "/campo",
              empaque: "/empaque",
              inventario: "/inventario",
              tasks: "/tasks",
              finanzas: "/finanzas",
              ajustes: "/ajustes",
              trabajadores: "/trabajadores",
              contactos: "/contactos",
              usuarios: "/usuarios",
            }

            const targetRoute = pageRoutes[page] || "/home"
            router.push(targetRoute)
          }}
          currentPage="tasks"
        />
        <div className="flex-1 flex flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Tareas</h1>
              <p className="text-muted-foreground">
                Tareas creadas/actualizadas vía WhatsApp. Fuente: API Seedor-API (GET /tasks).
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh()}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refrescar
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Fecha</label>
                <Input
                  type="date"
                  value={filters.date ?? ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      date: e.target.value || undefined,
                    }))
                  }
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        date: todayIso(),
                      }))
                    }
                  >
                    Hoy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const d = new Date()
                      d.setDate(d.getDate() - 1)
                      const yyyy = d.getFullYear()
                      const mm = `${d.getMonth() + 1}`.padStart(2, "0")
                      const dd = `${d.getDate()}`.padStart(2, "0")
                      setFilters((prev) => ({
                        ...prev,
                        date: `${yyyy}-${mm}-${dd}`,
                      }))
                    }}
                  >
                    Ayer
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Estado</label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: value === "all" ? undefined : (value as DashboardTaskStatus),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="PENDING">Pendiente</SelectItem>
                    <SelectItem value="COMPLETED">Completada</SelectItem>
                    <SelectItem value="INCOMPLETE">Incompleta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Sector</label>
                <Select
                  value={filters.sectorId || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      sectorId: value === "all" ? undefined : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {sectorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Peón</label>
                <Select
                  value={filters.workerId || "all"}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      workerId: value === "all" ? undefined : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {workerOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tareas asignadas</CardTitle>
              {error ? (
                <span className="text-sm text-destructive">{error}</span>
              ) : tasksLoading ? (
                <span className="text-sm text-muted-foreground">Cargando...</span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {tasks.length} tareas
                </span>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Peón</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Comentario</TableHead>
                    <TableHead>Actualizado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.length === 0 && !tasksLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No hay tareas que coincidan con los filtros.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="max-w-[260px] whitespace-normal">
                          <div className="font-medium text-foreground">{task.description}</div>
                          <div className="text-xs text-muted-foreground">#{task.id}</div>
                        </TableCell>
                        <TableCell>{task.sectorName || task.sectorId || "—"}</TableCell>
                        <TableCell>{task.workerName || task.workerId || "—"}</TableCell>
                        <TableCell>{formatDate(task.date)}</TableCell>
                        <TableCell>{renderStatus(task.status)}</TableCell>
                        <TableCell className="max-w-[240px] whitespace-normal">
                          {task.comment || "—"}
                        </TableCell>
                        <TableCell>{formatDate(task.updatedAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-4">
                Los datos se obtienen desde Seedor-API (GET /tasks). Ajusta la URL base con
                NEXT_PUBLIC_API_URL si apuntas a otro entorno.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </FeatureProvider>
  )
}
