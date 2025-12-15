"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { useAuth } from "../hooks/use-auth"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { farmsApi } from "../lib/api"
import { workersService, Worker, AttendanceRecord } from "../lib/workers"
import { Package, Cog, Archive, Truck, ArrowUpRight, Sprout, ChevronRight, Boxes, Banknote, Users, Wrench, Clock, TrendingDown, AlertTriangle } from "lucide-react"
import { useFeatures } from "../lib/features-context"

type Farm = {
  id: string
  name: string
}

export function DashboardStats() {
  const { user } = useAuth()
  const router = useRouter()
  const { canAccessModule } = useFeatures()
  const [farms, setFarms] = useState<Farm[]>([])
  const [loadingFarms, setLoadingFarms] = useState(false)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loadingWorkers, setLoadingWorkers] = useState(false)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [finanzasStats, setFinanzasStats] = useState({ ingresos: 0, egresos: 0, balance: 0 })
  const [loadingFinanzas, setLoadingFinanzas] = useState(false)
  const [inventarioStats, setInventarioStats] = useState({ totalItems: 0, lowStockItems: 0, lastMovementDate: null as string | null })
  const [loadingInventario, setLoadingInventario] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!user?.tenantId) return
      try {
        setLoadingFarms(true)
        const data = await farmsApi.getFarms(user.tenantId)
        setFarms(Array.isArray(data) ? (data as any).map((f: any) => ({ id: f.id, name: f.name })) : [])
      } catch (e) {
        setFarms([])
      } finally {
        setLoadingFarms(false)
      }
    }
    load()
  }, [user?.tenantId])

  useEffect(() => {
    const loadWorkers = async () => {
      if (!user?.tenantId) return
      try {
        setLoadingWorkers(true)
        const data = await workersService.getWorkersByTenant(user.tenantId)
        setWorkers(Array.isArray(data) ? data : [])
      } catch (e) {
        setWorkers([])
      } finally {
        setLoadingWorkers(false)
      }
    }
    loadWorkers()
  }, [user?.tenantId])

  // Get local YYYY-MM-DD (avoid UTC shift)
  const getLocalDate = () => {
    const d = new Date()
    const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    return tz.toISOString().slice(0, 10)
  }

  useEffect(() => {
    const loadAttendance = async () => {
      if (!user?.tenantId) return
      try {
        setLoadingAttendance(true)
        const today = getLocalDate()
        const data = await workersService.getAttendanceByDate(user.tenantId, today)
        setAttendance(Array.isArray(data) ? data : [])
      } catch (e) {
        setAttendance([])
      } finally {
        setLoadingAttendance(false)
      }
    }
    loadAttendance()
  }, [user?.tenantId])

  useEffect(() => {
    const loadFinanzas = async () => {
      if (!user?.tenantId) return
      try {
        setLoadingFinanzas(true)
        const { finanzasApi } = await import("../lib/api")
        const movimientos = await finanzasApi.getMovimientos(user.tenantId)
        
        const ingresos = movimientos
          .filter((m) => m.tipo === "ingreso")
          .reduce((sum, m) => sum + m.monto, 0)
        
        const egresos = movimientos
          .filter((m) => m.tipo === "egreso")
          .reduce((sum, m) => sum + m.monto, 0)
        
        setFinanzasStats({
          ingresos,
          egresos,
          balance: ingresos - egresos,
        })
      } catch (e) {
        console.error("Error loading finanzas stats:", e)
        setFinanzasStats({ ingresos: 0, egresos: 0, balance: 0 })
      } finally {
        setLoadingFinanzas(false)
      }
    }
    loadFinanzas()
  }, [user?.tenantId])

  useEffect(() => {
    const loadInventario = async () => {
      if (!user?.tenantId) return
      try {
        setLoadingInventario(true)
        const { inventoryApi } = await import("../lib/api")
        const stats = await inventoryApi.getInventorySummary(user.tenantId)
        setInventarioStats({
          totalItems: stats.totalItems,
          lowStockItems: stats.lowStockItems,
          lastMovementDate: stats.lastMovementDate || null,
        })
      } catch (e) {
        console.error("Error loading inventario stats:", e)
        setInventarioStats({ totalItems: 0, lowStockItems: 0, lastMovementDate: null })
      } finally {
        setLoadingInventario(false)
      }
    }
    loadInventario()
  }, [user?.tenantId])

  if (!user) return null

  const go = (path: string) => router.push(path)

  const firstTwoFarms = farms.slice(0, 2)

  // Use the same logic as sidebar: check role-based module access via canAccessModule
  const userRole = user?.rol || ''
  const canSeeEmpaque = canAccessModule('empaque', userRole)
  const canSeeCampo = canAccessModule('campo', userRole)
  const canSeeInventario = canAccessModule('inventario', userRole)
  const canSeeFinanzas = canAccessModule('finanzas', userRole)
  const canSeeTrabajadores = canAccessModule('trabajadores', userRole)

  const EmpaqueIcon = ({ className = "" }: { className?: string }) => (
    <div className={`h-8 w-8 rounded-md flex items-center justify-center ${className}`} style={{background: '#e8f5e0', color: '#63bd0a'}}>
      <Package className="h-4 w-4" />
    </div>
  )

  const CampoIcon = ({ className = "" }: { className?: string }) => (
    <div className={`h-8 w-8 rounded-md flex items-center justify-center ${className}`} style={{background: '#fef2ee', color: '#f96c57'}}>
      <Sprout className="h-4 w-4" />
    </div>
  )

  const InventarioIcon = ({ className = "" }: { className?: string }) => (
    <div className={`h-8 w-8 rounded-md flex items-center justify-center ${className}`} style={{background: '#fef0ee', color: '#f87163'}}>
      <Boxes className="h-4 w-4" />
    </div>
  )

  const FinanzasIcon = ({ className = "" }: { className?: string }) => (
    <div className={`h-8 w-8 rounded-md flex items-center justify-center ${className}`} style={{background: '#e8f3f9', color: '#297db5'}}>
      <Banknote className="h-4 w-4" />
    </div>
  )

  const TrabajadoresIcon = ({ className = "" }: { className?: string }) => (
    <div className={`h-8 w-8 rounded-md flex items-center justify-center ${className}`} style={{background: '#fef0f3', color: '#f56b8b'}}>
      <Users className="h-4 w-4" />
    </div>
  )

  const ActionButton = ({
    label,
    onClick,
    icon: Icon,
    tone = "lime",
  }: { label: string; onClick: () => void; icon: any; tone?: "lime" | "coral" | "yellow" | "pink" | "orange" | "blue" }) => {
    const toneStyles: Record<string, {bg: string, border: string, hoverBg: string}> = {
      lime: {bg: '#ffffff', border: '#e5e7eb', hoverBg: '#f0f7ea'},
      coral: {bg: '#ffffff', border: '#e5e7eb', hoverBg: '#fef0ee'},
      yellow: {bg: '#ffffff', border: '#e5e7eb', hoverBg: '#fef6e8'},
      pink: {bg: '#ffffff', border: '#e5e7eb', hoverBg: '#fef0f3'},
      orange: {bg: '#ffffff', border: '#e5e7eb', hoverBg: '#fef2ee'},
      blue: {bg: '#ffffff', border: '#e5e7eb', hoverBg: '#e8f3f9'},
    }
    const style = toneStyles[tone]
    return (
      <Button
        variant="outline"
        className="justify-start gap-2 transition-all border text-foreground"
        style={{background: style.bg, borderColor: style.border, color: '#1a1a1a'}}
        onMouseEnter={(e) => {e.currentTarget.style.background = style.hoverBg; e.currentTarget.style.color = '#1a1a1a'}}
        onMouseLeave={(e) => {e.currentTarget.style.background = style.bg; e.currentTarget.style.color = '#1a1a1a'}}
        onClick={onClick}
      >
        <Icon className="h-4 w-4 opacity-70" />
        <span>{label}</span>
        <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
      </Button>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Bienvenido, {user?.tenant?.name || 'Tu Empresa'}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.nombre || user?.email}</p>
              <p className="text-xs text-muted-foreground">{user?.rol || 'Usuario'}</p>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6 overflow-auto" style={{background: '#f9f9f9'}}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Empaque */}
          {canSeeEmpaque && (
            <Card className="border bg-white dark:bg-neutral-900 shadow-sm" style={{borderColor: '#e8f5e0'}}>
              <CardHeader className="flex flex-row items-start gap-3">
                <EmpaqueIcon />
                <div>
                  <CardTitle className="font-semibold">Empaque</CardTitle>
                  <CardDescription>Accesos rápidos</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in-up">
                  <div className="flex flex-col gap-3">
                    <ActionButton icon={Package} label="Ingreso Fruta" onClick={() => go('/empaque/ingreso-fruta')} tone="lime" />
                    <ActionButton icon={Cog} label="Preproceso" onClick={() => go('/empaque/preproceso')} tone="lime" />
                    <ActionButton icon={Archive} label="Pallets" onClick={() => go('/empaque/pallets')} tone="lime" />
                  </div>
                  <div className="flex flex-col gap-3">
                    <ActionButton icon={Truck} label="Despacho" onClick={() => go('/empaque/despacho')} tone="lime" />
                    <ActionButton icon={ArrowUpRight} label="Egreso fruta" onClick={() => go('/empaque/egreso-fruta')} tone="lime" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campo */}
          {canSeeCampo && (
            <Card className="border bg-white dark:bg-neutral-900 shadow-sm" style={{borderColor: '#fef2ee'}}>
              <CardHeader className="flex flex-row items-start gap-3">
                <CampoIcon />
                <div>
                  <CardTitle>Campo</CardTitle>
                  <CardDescription>Acceso a tus campos</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {loadingFarms ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[1,2].map((i) => (
                      <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 mb-3">
                      {firstTwoFarms.length > 0 ? (
                        firstTwoFarms.map((farm) => (
                          <Button
                            key={farm.id}
                            variant="outline"
                            className="justify-start gap-2 border transition-all text-foreground"
                            style={{background: '#ffffff', borderColor: '#e5e7eb', color: '#1a1a1a'}}
                            onMouseEnter={(e) => {e.currentTarget.style.background = '#fef2ee'; e.currentTarget.style.borderColor = '#fb8e7c'; e.currentTarget.style.color = '#1a1a1a'}}
                            onMouseLeave={(e) => {e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#1a1a1a'}}
                            onClick={() => go(`/campo/${farm.id}`)}
                          >
                            <Sprout className="h-4 w-4" style={{color: '#f96c57'}} />
                            <span>{farm.name}</span>
                            <ChevronRight className="ml-auto h-4 w-4 opacity-60" />
                          </Button>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Aún no hay campos creados</p>
                      )}
                    </div>
                    <button 
                      className="px-0 text-sm font-medium transition-opacity bg-transparent border-none cursor-pointer" 
                      style={{color: '#f96c57'}}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.6'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      onClick={() => go('/campo')}
                    >
                      Ver más
                    </button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Placeholder squares */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Inventario */}
            {canSeeInventario && (
            <Card className="h-full border bg-white dark:bg-neutral-900 cursor-pointer hover:shadow-lg transition-shadow" style={{borderColor: '#fef0ee'}} onClick={() => go('/inventario')}>
              <CardHeader className="flex flex-row items-start gap-3 pb-4">
                <InventarioIcon />
                <div>
                  <CardTitle>Inventario</CardTitle>
                  <CardDescription>
                    {loadingInventario
                      ? 'Cargando datos...'
                      : `${inventarioStats.totalItems} ítems en stock`}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-muted">
                    <span className="text-sm font-medium text-muted-foreground">Total de ítems</span>
                    <span className="text-2xl font-bold" style={{color: '#f87163'}}>{inventarioStats.totalItems}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-muted">
                    <span className="text-sm font-medium text-muted-foreground">Bajo stock</span>
                    <div className="flex items-center gap-2">
                      {inventarioStats.lowStockItems > 0 && (
                        <AlertTriangle className="h-5 w-5" style={{color: '#f87163'}} />
                      )}
                      <span className="text-2xl font-bold" style={{color: inventarioStats.lowStockItems > 0 ? '#f87163' : '#f87163'}}>
                        {inventarioStats.lowStockItems}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-muted-foreground">Último movimiento</span>
                    <span className="text-sm font-semibold">
                      {inventarioStats.lastMovementDate
                        ? new Date(inventarioStats.lastMovementDate).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        : 'Sin movimientos'}
                    </span>
                  </div>
                </div>
                <button 
                  className="px-0 text-sm font-medium transition-opacity bg-transparent border-none cursor-pointer" 
                  style={{color: '#f87163'}}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.6'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  onClick={() => go('/inventario')}
                >
                  Ver más
                </button>
              </CardContent>
            </Card>
            )}

            {/* Finanzas */}
            {canSeeFinanzas && (
            <Card className="h-full border bg-white dark:bg-neutral-900 cursor-pointer hover:shadow-lg transition-shadow" style={{borderColor: '#e8f3f9'}} onClick={() => go('/finanzas')}>
              <CardHeader className="flex flex-row items-start gap-3">
                <FinanzasIcon />
                <div>
                  <CardTitle>Finanzas</CardTitle>
                  <CardDescription>
                    {loadingFinanzas
                      ? 'Cargando balance...'
                      : `Balance: $${finanzasStats.balance.toLocaleString()}`}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {loadingFinanzas ? (
                  <div className="grid grid-cols-1 gap-3">
                    {[1,2,3].map((i) => (
                      <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Balance principal */}
                    <div className="mb-4 p-3 rounded-lg border" style={{background: 'linear-gradient(135deg, #e8f3f9 0%, #e8f3f9 100%)', borderColor: '#d0e8f5'}}>
                      <p className="text-xs text-muted-foreground mb-1">Balance Total</p>
                      <p className="text-2xl font-bold" style={{color: finanzasStats.balance >= 0 ? '#297db5' : '#f87163'}}>
                        ${finanzasStats.balance.toLocaleString()}
                      </p>
                    </div>

                    {/* Stats de Ingresos y Egresos */}
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ArrowUpRight className="h-4 w-4" style={{color: '#63bd0a'}} />
                          <span className="text-sm font-medium">Ingresos</span>
                        </div>
                        <span className="text-sm font-bold" style={{color: '#63bd0a'}}>
                          ${finanzasStats.ingresos.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4" style={{color: '#f87163'}} />
                          <span className="text-sm font-medium">Egresos</span>
                        </div>
                        <span className="text-sm font-bold" style={{color: '#f87163'}}>
                          ${finanzasStats.egresos.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button 
                      className="mt-4 px-0 text-sm font-medium transition-opacity bg-transparent border-none cursor-pointer" 
                      style={{color: '#297db5'}}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.6'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      onClick={(e) => {
                        e.stopPropagation()
                        go('/finanzas')
                      }}
                    >
                      Ver más
                    </button>
                  </>
                )}
              </CardContent>
            </Card>
            )}

            {/* Trabajadores - Asistencia de hoy */}
            {canSeeTrabajadores && (
            <Card className="h-full border bg-white dark:bg-neutral-900 shadow-sm" style={{borderColor: '#fef0f3'}}>
              <CardHeader className="flex flex-row items-start gap-3">
                <TrabajadoresIcon />
                <div>
                  <CardTitle>Trabajadores</CardTitle>
                  <CardDescription>
                    {loadingWorkers || loadingAttendance
                      ? 'Cargando asistencia de hoy...'
                      : `Hoy: ${workers.length > 0 ? Math.round((attendance.filter(a => a.status === 'PRE').length * 100) / workers.length) : 0}% presente`}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {loadingWorkers || loadingAttendance ? (
                  <div className="grid grid-cols-1 gap-3">
                    {[1,2,3].map((i) => (
                      <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Summary chips */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="text-xs rounded-md px-2 py-1" style={{background: '#fef0f3', color: '#f56b8b'}}>
                        Activos: {workers.length}
                      </span>
                      <span className="text-xs rounded-md px-2 py-1" style={{background: '#fef0f3', color: '#f56b8b'}}>
                        Registrados: {new Set(attendance.map(a => a.worker_id)).size}
                      </span>
                      <span className="text-xs rounded-md px-2 py-1" style={{background: '#fef0f3', color: '#f56b8b'}}>
                        Faltan: {Math.max(workers.length - new Set(attendance.map(a => a.worker_id)).size, 0)}
                      </span>
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { code: 'PRE', label: 'Presente' },
                        { code: 'AUS', label: 'Ausente' },
                        { code: 'TAR', label: 'Tardanza' },
                        { code: 'LIC', label: 'Licencia' },
                        { code: 'VAC', label: 'Vacaciones' },
                      ].map(({ code, label }) => {
                        const count = attendance.filter(a => a.status === code).length
                        return (
                          <div key={code} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="inline-block h-2 w-2 rounded-full" style={{background: '#f56b8b'}}></span>
                              <span className="text-sm">{label}</span>
                            </div>
                            <span className="text-xs rounded px-2 py-0.5" style={{background: '#fef0f3', color: '#f56b8b'}}>{count}</span>
                          </div>
                        )
                      })}
                    </div>

                    <button 
                      className="mt-4 px-0 text-sm font-medium transition-opacity bg-transparent border-none cursor-pointer" 
                      style={{color: '#f56b8b'}}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.6'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      onClick={() => go('/trabajadores')}
                    >
                      Ver más
                    </button>
                  </>
                )}
              </CardContent>
            </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
