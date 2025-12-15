"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card } from "../ui/card"
import { Badge } from "../ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Plus, Pencil, Trash2, Users, UserCheck, UserX, Search, Loader2 } from "lucide-react"
import { workersService, Worker } from "../../lib/workers"
import type { AuthUser } from "../../lib/types"
import { WorkerFormModal, type WorkerFormData } from "./worker-form-modal"
import { DailyAttendance } from "./daily-attendance"
import { AttendanceHistory } from "./attendance-history"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "../ui/label"
import { toast } from "../../hooks/use-toast"

const normalizeText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

const filterWorkersByTerm = (list: Worker[], term: string) => {
  const normalizedTerm = normalizeText(term)
  if (!normalizedTerm) return list

  return list.filter((worker) => {
    const name = normalizeText(worker.full_name || "")
    return name.includes(normalizedTerm)
  })
}

interface TrabajadoresPageProps {
  user?: AuthUser
}

export default function TrabajadoresPage({ user }: TrabajadoresPageProps) {
  const [allWorkers, setAllWorkers] = useState<Worker[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | undefined>(undefined)
  const [selectedWorkerForHistory, setSelectedWorkerForHistory] = useState<string>("")
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
    }, 350)

    return () => clearTimeout(handler)
  }, [searchTerm])

  useEffect(() => {
    if (!user?.tenantId) {
      setLoading(false)
      return
    }
    loadAllWorkers()
  }, [refreshKey, user?.tenantId])

  const fetchWorkers = async (searchValue?: string): Promise<Worker[]> => {
    if (!user?.tenantId) return []

    try {
      const workers = await workersService.getWorkersByTenant(user.tenantId, true)
      if (searchValue) {
        return filterWorkersByTerm(workers, searchValue)
      }
      return workers
    } catch (error) {
      console.error("Error fetching workers:", error)
      throw error
    }
  }

  const loadAllWorkers = async () => {
    if (!user?.tenantId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setSearchError(null)
      const data = await fetchWorkers()
      setAllWorkers(data)
      if (searchTerm.trim()) {
        setWorkers(filterWorkersByTerm(data, searchTerm))
      } else {
        setWorkers(data)
      }
    } catch (error) {
      console.error("Error loading workers:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los trabajadores",
        variant: "destructive"
      })
      setWorkers([])
      setAllWorkers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.tenantId) {
      return
    }

    if (!debouncedSearch) {
      setIsSearching(false)
      setSearchError(null)
      setWorkers(allWorkers)
      return
    }

    let isActive = true

    const runSearch = async () => {
      setIsSearching(true)
      setSearchError(null)
      try {
        const data = await fetchWorkers(debouncedSearch)
        if (!isActive) return
        setWorkers(data)
      } catch (error) {
        console.error("Server search failed, falling back to local filter:", error)
        if (!isActive) return
        setSearchError("No se pudo buscar en el servidor. Mostrando coincidencias locales.")
        setWorkers(filterWorkersByTerm(allWorkers, debouncedSearch))
      } finally {
        if (isActive) {
          setIsSearching(false)
        }
      }
    }

    runSearch()

    return () => {
      isActive = false
    }
  }, [debouncedSearch, allWorkers, user?.tenantId, refreshKey])

  useEffect(() => {
    const activeWorkersList = workers.filter((w) => w.status === "active")
    if (activeWorkersList.length === 0) {
      if (selectedWorkerForHistory) {
        setSelectedWorkerForHistory("")
      }
      return
    }

    const isSelectedStillValid = activeWorkersList.some((w) => w.id === selectedWorkerForHistory)
    if (!isSelectedStillValid) {
      setSelectedWorkerForHistory(activeWorkersList[0].id)
    }
  }, [workers, selectedWorkerForHistory])

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setSearchError(null)

    if (!value.trim()) {
      setWorkers(allWorkers)
      return
    }

    setWorkers(filterWorkersByTerm(allWorkers, value))
  }

  const handleAttendanceSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleCreateWorker = async (data: WorkerFormData) => {
    if (!user?.tenantId) {
      toast({
        title: "Error",
        description: "No se pudo obtener el ID del tenant",
        variant: "destructive"
      })
      return
    }

    try {
      await workersService.createWorker(user.tenantId, {
        fullName: data.full_name,
        documentId: data.document_id,
        email: data.email,
        phone: data.phone || undefined,
        areaModule: data.area_module as any,
      })
      toast({
        title: "Éxito",
        description: "Trabajador creado correctamente"
      })
      await loadAllWorkers()
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
      await workersService.updateWorker(selectedWorker.id, {
        fullName: data.full_name,
        documentId: data.document_id,
        email: data.email,
        phone: data.phone || undefined,
        areaModule: data.area_module as any,
      })
      toast({
        title: "Éxito",
        description: "Trabajador actualizado correctamente"
      })
      await loadAllWorkers()
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
      await workersService.deleteWorker(workerId)
      toast({
        title: "Éxito",
        description: "Trabajador desactivado correctamente"
      })
      await loadAllWorkers()
    } catch (error) {
      console.error("Error deleting worker:", error)
      toast({
        title: "Error",
        description: "No se pudo desactivar el trabajador",
        variant: "destructive"
      })
    }
  }

  const handlePermanentDeleteWorker = async (workerId: string, workerName: string) => {
    if (!confirm(`⚠️ ATENCIÓN: ¿Estás seguro de que quieres eliminar permanentemente a ${workerName}?\n\nEsta acción NO se puede deshacer y se eliminarán todos los registros asociados.`)) return

    try {
      await workersService.hardDeleteWorker(workerId)
      toast({
        title: "Éxito",
        description: "Trabajador eliminado permanentemente"
      })
      await loadAllWorkers()
    } catch (error: any) {
      console.error("Error permanently deleting worker:", error)
      toast({
        title: "Error",
        description: error?.message || "No se pudo eliminar el trabajador permanentemente",
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
  const totalActiveWorkers = allWorkers.filter(w => w.status === "active")
  const totalInactiveWorkers = allWorkers.filter(w => w.status === "inactive")
  const selectedWorkerData = workers.find(w => w.id === selectedWorkerForHistory)
  const trimmedSearch = searchTerm.trim()

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-3 md:px-6 gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-base md:text-xl font-semibold truncate">Trabajadores</h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              Control y administración de los trabajadores y asistencias
            </p>
          </div>
          <Button onClick={() => {
            setSelectedWorker(undefined)
            setIsModalOpen(true)
          }} className="shrink-0" style={{background: '#f56b8b', color: 'white'}} onMouseEnter={(e) => e.currentTarget.style.background = '#f88da7'} onMouseLeave={(e) => e.currentTarget.style.background = '#f56b8b'}>
            <Plus className="mr-0 md:mr-2 h-4 w-4" />
            <span className="hidden md:inline">Nuevo trabajador</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto" style={{background: '#f9f9f9'}}>
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="workers" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="workers" className="text-xs sm:text-sm px-2 py-2">
                <span className="hidden sm:inline">Trabajadores</span>
                <span className="sm:hidden">Trabajadores</span>
              </TabsTrigger>
              <TabsTrigger value="attendance" className="text-xs sm:text-sm px-2 py-2">
                <span className="hidden sm:inline">Tomar Asistencia</span>
                <span className="sm:hidden">Asistencia</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs sm:text-sm px-2 py-2">
                <span className="hidden sm:inline">Historial</span>
                <span className="sm:hidden">Historial</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workers">
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6" style={{background: '#ffffff', borderColor: '#fef0f3'}}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Trabajadores</p>
                  <p className="text-3xl font-bold" style={{color: '#f56b8b'}}>{allWorkers.length}</p>
                </div>
                <Users className="h-10 w-10" style={{color: '#f56b8b'}} />
              </div>
            </Card>

            <Card className="p-6" style={{background: '#ffffff', borderColor: '#fef0f3'}}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Activos</p>
                  <p className="text-3xl font-bold text-green-600">{totalActiveWorkers.length}</p>
                </div>
                <UserCheck className="h-10 w-10 text-green-600" />
              </div>
            </Card>

            <Card className="p-6" style={{background: '#ffffff', borderColor: '#fef0f3'}}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inactivos</p>
                  <p className="text-3xl font-bold text-red-600">{totalInactiveWorkers.length}</p>
                </div>
                <UserX className="h-10 w-10 text-red-600" />
              </div>
            </Card>
          </div>

            {/* Workers List */}
            <div className="space-y-2">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:w-80">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    placeholder="Buscar por nombre..."
                    className="pl-9"
                    style={{background: '#ffffff'}}
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
                {trimmedSearch && !isSearching && (
                  <span className="text-sm text-muted-foreground md:text-right">
                    {workers.length} resultado{workers.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              {searchError && (
                <p className="text-sm text-destructive">{searchError}</p>
              )}
            </div>

            {loading ? (
              <Card className="p-12 text-center" style={{background: '#ffffff'}}>
                <p className="text-muted-foreground">Cargando trabajadores...</p>
              </Card>
            ) : workers.length === 0 ? (
              <Card className="p-12 text-center" style={{background: '#ffffff'}}>
                {trimmedSearch ? (
                  <>
                    <h3 className="text-lg font-semibold mb-2">No se encontraron trabajadores</h3>
                    <p className="text-muted-foreground">
                      No hay coincidencias para "{trimmedSearch}". Probá con otro nombre o revisá el estado del trabajador.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleSearchChange("")}
                      >
                        Limpiar búsqueda
                      </Button>
                      <Button onClick={() => {
                        setSelectedWorker(undefined)
                        setIsModalOpen(true)
                      }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo trabajador
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </Card>
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold" style={{color: '#f56b8b'}}>Trabajadores Activos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeWorkers.map((worker) => (
                    <Card
                      key={worker.id}
                      data-testid="worker-card"
                      className="p-4 hover:shadow-lg transition-shadow"
                      style={{background: '#ffffff'}}
                    >
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
                    <h2 className="text-lg font-semibold mt-8" style={{color: '#f56b8b'}}>Trabajadores Inactivos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {inactiveWorkers.map((worker) => (
                        <Card
                          key={worker.id}
                          data-testid="worker-card-inactive"
                          className="p-4 opacity-60"
                          style={{background: '#ffffff'}}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold">{worker.full_name}</h3>
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
                                  title="Editar trabajador"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handlePermanentDeleteWorker(worker.id, worker.full_name)}
                                  title="Eliminar permanentemente"
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
                              <Badge variant="secondary">Inactivo</Badge>
                              <Badge className={getAreaColor(worker.area_module)}>
                                {getAreaLabel(worker.area_module)}
                              </Badge>
                            </div>
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
              <Card className="p-12 text-center" style={{background: '#ffffff'}}>
                <p className="text-muted-foreground">Cargando trabajadores...</p>
              </Card>
            ) : activeWorkers.length === 0 ? (
              <Card className="p-12 text-center" style={{background: '#ffffff'}}>
                <p className="text-muted-foreground">No hay trabajadores activos</p>
              </Card>
            ) : user?.tenantId ? (
              <DailyAttendance
                workers={activeWorkers}
                tenantId={user.tenantId}
                onSuccess={handleAttendanceSuccess}
              />
            ) : (
              <Card className="p-12 text-center" style={{background: '#ffffff'}}>
                <p className="text-muted-foreground text-red-600">Error: No se encontró el ID del tenant</p>
              </Card>
            )}
            </TabsContent>

            <TabsContent value="history">
            {loading ? (
              <Card className="p-12 text-center" style={{background: '#ffffff'}}>
                <p className="text-muted-foreground">Cargando trabajadores...</p>
              </Card>
            ) : activeWorkers.length === 0 ? (
              <Card className="p-12 text-center" style={{background: '#ffffff'}}>
                <p className="text-muted-foreground">No hay trabajadores activos</p>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className="p-6" style={{background: '#ffffff'}}>
                  <div className="space-y-2">
                    <Label style={{color: '#f56b8b'}}>Seleccionar Trabajador</Label>
                    <Select value={selectedWorkerForHistory} onValueChange={setSelectedWorkerForHistory}>
                      <SelectTrigger style={{background: '#f5f5f5'}}>
                        <SelectValue placeholder="Seleccionar trabajador" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeWorkers.map((worker) => (
                          <SelectItem key={worker.id} value={worker.id}>
                            {worker.full_name} - {worker.area_module}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Card>

                {selectedWorkerData && user?.tenantId && (
                  <AttendanceHistory
                    key={selectedWorkerForHistory}
                    worker={selectedWorkerData}
                    tenantId={user.tenantId}
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
