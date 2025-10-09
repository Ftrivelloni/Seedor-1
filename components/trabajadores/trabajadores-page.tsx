"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Badge } from "../ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Plus, Pencil, Trash2, Users, UserCheck, UserX } from "lucide-react"
import { workersApi } from "../../lib/api"
import type { Worker, AuthUser } from "../../lib/types"
import { WorkerFormModal, type WorkerFormData } from "./worker-form-modal"
import { DailyAttendance } from "./daily-attendance"
import { AttendanceHistory } from "./attendance-history"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "../ui/label"
import { toast } from "../../hooks/use-toast"

interface TrabajadoresPageProps {
  user?: AuthUser
}

export default function TrabajadoresPage({ user }: TrabajadoresPageProps) {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | undefined>(undefined)
  const [selectedWorkerForHistory, setSelectedWorkerForHistory] = useState<string>("")
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    loadWorkers()
  }, [refreshKey])

  const loadWorkers = async () => {
    try {
      setLoading(true)
      const data = await workersApi.getWorkersByTenant(user?.tenantId || "", true)
      setWorkers(data)
      
      // Auto-select first worker if none selected
      if (data.length > 0 && !selectedWorkerForHistory) {
        setSelectedWorkerForHistory(data[0].id)
      }
    } catch (error) {
      console.error("Error loading workers:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los trabajadores",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAttendanceSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleCreateWorker = async (data: WorkerFormData) => {
    try {
      await workersApi.createWorker(user?.tenantId || "", data)
      toast({
        title: "Éxito",
        description: "Trabajador creado correctamente"
      })
      loadWorkers()
    } catch (error: any) {
      console.error("Error creating worker:", error)
      toast({
        title: "Error",
        description: error?.message || "No se pudo crear el trabajador",
        variant: "destructive"
      })
    }
  }

  const handleEditWorker = async (data: WorkerFormData) => {
    if (!selectedWorker) return

    try {
      await workersApi.updateWorker(selectedWorker.id, data)
      toast({
        title: "Éxito",
        description: "Trabajador actualizado correctamente"
      })
      loadWorkers()
    } catch (error) {
      console.error("Error updating worker:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el trabajador",
        variant: "destructive"
      })
    }
  }

  const handleDeleteWorker = async (workerId: string) => {
    if (!confirm("¿Estás seguro de que quieres desactivar este trabajador?")) return

    try {
      await workersApi.deleteWorker(workerId)
      toast({
        title: "Éxito",
        description: "Trabajador desactivado correctamente"
      })
      loadWorkers()
    } catch (error) {
      console.error("Error deleting worker:", error)
      toast({
        title: "Error",
        description: "No se pudo desactivar el trabajador",
        variant: "destructive"
      })
    }
  }

  const getAreaColor = (area: string) => {
    switch (area) {
      case "campo":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "empaque":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "finanzas":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "admin":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getAreaLabel = (area: string) => {
    const labels: Record<string, string> = {
      campo: "Campo",
      empaque: "Empaque",
      finanzas: "Finanzas",
      admin: "Administración"
    }
    return labels[area] || area
  }

  const activeWorkers = workers.filter(w => w.status === "active")
  const inactiveWorkers = workers.filter(w => w.status === "inactive")
  const selectedWorkerData = workers.find(w => w.id === selectedWorkerForHistory)

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold">Gestión de Trabajadores</h1>
            <p className="text-sm text-muted-foreground">
              Control y administración de los trabajadores y asistencias
            </p>
          </div>
          <Button onClick={() => {
            setSelectedWorker(undefined)
            setIsModalOpen(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo trabajador
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="workers" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-3">
              <TabsTrigger value="workers">Trabajadores</TabsTrigger>
              <TabsTrigger value="attendance">Tomar Asistencia</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="workers">
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Trabajadores</p>
                  <p className="text-3xl font-bold">{workers.length}</p>
                </div>
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Activos</p>
                  <p className="text-3xl font-bold text-green-600">{activeWorkers.length}</p>
                </div>
                <UserCheck className="h-10 w-10 text-green-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inactivos</p>
                  <p className="text-3xl font-bold text-red-600">{inactiveWorkers.length}</p>
                </div>
                <UserX className="h-10 w-10 text-red-600" />
              </div>
            </Card>
          </div>

            {/* Workers List */}
            {loading ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">Cargando trabajadores...</p>
              </Card>
            ) : workers.length === 0 ? (
              <Card className="p-12 text-center">
                <h3 className="text-lg font-semibold mb-2">No hay trabajadores</h3>
                <p className="text-muted-foreground mb-6">
                  Comienza agregando tu primer trabajador al sistema
                </p>
                <Button onClick={() => {
                  setSelectedWorker(undefined)
                  setIsModalOpen(true)
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo trabajador
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Trabajadores Activos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeWorkers.map((worker) => (
                    <Card key={worker.id} className="p-4 hover:shadow-lg transition-shadow">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{worker.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{worker.email}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedWorker(worker)
                                setIsModalOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteWorker(worker.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <p className="text-muted-foreground">DNI: {worker.document_id}</p>
                          {worker.phone && (
                            <p className="text-muted-foreground">Tel: {worker.phone}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={getAreaColor(worker.area_module)}>
                            {getAreaLabel(worker.area_module)}
                          </Badge>
                          {worker.membership_id && (
                            <Badge variant="outline" className="text-xs">
                              Con membresía
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {inactiveWorkers.length > 0 && (
                  <>
                    <h2 className="text-lg font-semibold mt-8">Trabajadores Inactivos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {inactiveWorkers.map((worker) => (
                        <Card key={worker.id} className="p-4 opacity-60">
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold">{worker.full_name}</h3>
                              <p className="text-sm text-muted-foreground">{worker.email}</p>
                            </div>
                            <Badge variant="secondary">Inactivo</Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
              </div>
            </TabsContent>

            <TabsContent value="attendance">
            {loading ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">Cargando trabajadores...</p>
              </Card>
            ) : (
              <DailyAttendance
                workers={activeWorkers}
                tenantId={user?.tenantId || ""}
                onSuccess={handleAttendanceSuccess}
              />
            )}
            </TabsContent>

            <TabsContent value="history">
            {loading ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">Cargando trabajadores...</p>
              </Card>
            ) : workers.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No hay trabajadores registrados</p>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="space-y-2">
                    <Label>Seleccionar Trabajador</Label>
                    <Select value={selectedWorkerForHistory} onValueChange={setSelectedWorkerForHistory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar trabajador" />
                      </SelectTrigger>
                      <SelectContent>
                        {workers.map((worker) => (
                          <SelectItem key={worker.id} value={worker.id}>
                            {worker.full_name} - {worker.area_module}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Card>

                {selectedWorkerData && (
                  <AttendanceHistory
                    key={selectedWorkerForHistory}
                    worker={selectedWorkerData}
                    tenantId={user?.tenantId || ""}
                  />
                )}
              </div>
            )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <WorkerFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedWorker(undefined)
        }}
        onSubmit={selectedWorker ? handleEditWorker : handleCreateWorker}
        worker={selectedWorker}
      />
    </div>
  )
}
