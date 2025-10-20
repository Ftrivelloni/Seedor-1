"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { useAuth } from "../hooks/use-auth"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { farmsApi, workersApi, attendanceApi } from "../lib/api"
import { Package, Cog, Archive, Truck, ArrowUpRight, Sprout, ChevronRight, Boxes, Banknote, Users, Wrench, Clock, TrendingDown } from "lucide-react"

type Farm = {
  id: string
  name: string
}

export function DashboardStats() {
  const { user } = useAuth()
  const router = useRouter()
  const [farms, setFarms] = useState<Farm[]>([])
  const [loadingFarms, setLoadingFarms] = useState(false)
  const [workers, setWorkers] = useState<import("../lib/types").Worker[]>([])
  const [loadingWorkers, setLoadingWorkers] = useState(false)
  const [attendance, setAttendance] = useState<import("../lib/types").AttendanceRecord[]>([])
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [finanzasStats, setFinanzasStats] = useState({ ingresos: 0, egresos: 0, balance: 0 })
  const [loadingFinanzas, setLoadingFinanzas] = useState(false)

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
        const data = await workersApi.getWorkersByTenant(user.tenantId)
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
        const data = await attendanceApi.getAttendanceByDate(user.tenantId, today)
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

  if (!user) return null

  const go = (path: string) => router.push(path)

  const firstTwoFarms = farms.slice(0, 2)

  // Determine which boxes to show based on role
  const roleKey = (user?.rol || '').toString().toLowerCase().trim()
  const allowedBoxes = (() => {
    // Normalize a few variants
    if (roleKey.includes('admin')) return new Set(['empaque', 'campo', 'inventario', 'finanzas', 'trabajadores'])
    if (roleKey.includes('empaque')) return new Set(['empaque', 'inventario', 'trabajadores'])
    if (roleKey.includes('campo')) return new Set(['empaque', 'inventario', 'campo', 'trabajadores'])
    if (roleKey.includes('finanzas')) return new Set(['finanzas', 'trabajadores'])
    // Fallback: show a reasonable default (Empaque + Inventario + Trabajadores)
    return new Set(['empaque', 'inventario', 'trabajadores'])
  })()

  const EmpaqueIcon = ({ className = "" }: { className?: string }) => (
    <div className={`h-8 w-8 rounded-md bg-seedor/10 text-seedor flex items-center justify-center ${className}`}>
      <Package className="h-4 w-4" />
    </div>
  )

  const CampoIcon = ({ className = "" }: { className?: string }) => (
    <div className={`h-8 w-8 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center justify-center ${className}`}>
      <Sprout className="h-4 w-4" />
    </div>
  )

  const InventarioIcon = ({ className = "" }: { className?: string }) => (
    <div className={`h-8 w-8 rounded-md bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300 flex items-center justify-center ${className}`}>
      <Boxes className="h-4 w-4" />
    </div>
  )

  const FinanzasIcon = ({ className = "" }: { className?: string }) => (
    <div className={`h-8 w-8 rounded-md bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300 flex items-center justify-center ${className}`}>
      <Banknote className="h-4 w-4" />
    </div>
  )

  const TrabajadoresIcon = ({ className = "" }: { className?: string }) => (
    <div className={`h-8 w-8 rounded-md bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300 flex items-center justify-center ${className}`}>
      <Users className="h-4 w-4" />
    </div>
  )

  const ActionButton = ({
    label,
    onClick,
    icon: Icon,
    tone = "seedor",
  }: { label: string; onClick: () => void; icon: any; tone?: "seedor" | "purple" | "orange" | "green" }) => {
    const toneClasses: Record<string, string> = {
      seedor: "hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:!border-emerald-300 text-foreground",
      purple: "hover:bg-purple-100 hover:border-purple-300 text-foreground dark:hover:bg-purple-900/30",
      orange: "hover:bg-orange-100 hover:border-orange-300 text-foreground dark:hover:bg-orange-900/30",
      green: "hover:bg-emerald-100 hover:border-emerald-300 text-foreground dark:hover:bg-emerald-900/30",
    }
    return (
      <Button
        variant="outline"
        className={`justify-start gap-2 border-muted/60 transition-colors hover:!text-black dark:hover:!text-black ${toneClasses[tone]} `}
        onClick={onClick}
      >
        <Icon className="h-4 w-4 opacity-80" />
        <span>{label}</span>
        <ChevronRight className="ml-auto h-4 w-4 opacity-60" />
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
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Empaque */}
          {allowedBoxes.has('empaque') && (
            <Card className="border-seedor/20 bg-white dark:bg-neutral-900">
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
                    <ActionButton icon={Package} label="Ingreso Fruta" onClick={() => go('/empaque/ingreso-fruta')} tone="seedor" />
                    <ActionButton icon={Cog} label="Preproceso" onClick={() => go('/empaque/preproceso')} tone="orange" />
                    <ActionButton icon={Archive} label="Pallets" onClick={() => go('/empaque/pallets')} tone="green" />
                  </div>
                  <div className="flex flex-col gap-3">
                    <ActionButton icon={Truck} label="Despacho" onClick={() => go('/empaque/despacho')} tone="purple" />
                    <ActionButton icon={ArrowUpRight} label="Egreso fruta" onClick={() => go('/empaque/egreso-fruta')} tone="seedor" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campo */}
          {allowedBoxes.has('campo') && (
            <Card className="border-emerald-200/30 bg-white dark:bg-neutral-900">
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
                            className="justify-start gap-2 border-emerald-200/60 hover:border-emerald-300 hover:bg-emerald-100/40 dark:hover:bg-emerald-900/20 hover:text-black dark:hover:text-black"
                            onClick={() => go(`/campo/${farm.id}`)}
                          >
                            <Sprout className="h-4 w-4 text-emerald-600" />
                            <span>{farm.name}</span>
                            <ChevronRight className="ml-auto h-4 w-4 opacity-60" />
                          </Button>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Aún no hay campos creados</p>
                      )}
                    </div>
                    <Button variant="ghost" className="px-0 text-seedor underline hover:text-seedor/80" onClick={() => go('/campo')}>
                      Ver más
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Placeholder squares */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Inventario */}
            {allowedBoxes.has('inventario') && (
            <Card className="h-full border-sky-200/40 bg-white dark:bg-neutral-900">
              <CardHeader className="flex flex-row items-start gap-3">
                <InventarioIcon />
                <CardTitle>Inventario</CardTitle>
              </CardHeader>
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center mb-1">
                    <div className="relative">
                      <Wrench className="h-10 w-10 text-orange-500" />
                      <Clock className="h-5 w-5 text-orange-600 absolute -bottom-1 -right-1" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-orange-700">Módulo en Proceso</h3>
                    <p className="text-sm text-muted-foreground">Inventario</p>
                  </div>
                  <div>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 px-3 py-1 inline-flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      En Desarrollo
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Módulo de gestión de inventario y stock
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ¿Tienes alguna sugerencia?{' '}
                    <a href="/contactenos" className="text-orange-600 hover:text-orange-700 underline">Contáctanos</a>
                  </p>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Finanzas */}
            <Card className="h-full border-amber-200/40 bg-white dark:bg-neutral-900 cursor-pointer hover:shadow-md transition-shadow" onClick={() => go('/finanzas')}>
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
                    <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10 border border-amber-200/50">
                      <p className="text-xs text-muted-foreground mb-1">Balance Total</p>
                      <p className={`text-2xl font-bold ${finanzasStats.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        ${finanzasStats.balance.toLocaleString()}
                      </p>
                    </div>

                    {/* Stats de Ingresos y Egresos */}
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center justify-between p-2 rounded-md bg-emerald-50 dark:bg-emerald-900/20">
                        <div className="flex items-center gap-2">
                          <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-medium">Ingresos</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-600">
                          ${finanzasStats.ingresos.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-2 rounded-md bg-red-50 dark:bg-red-900/20">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium">Egresos</span>
                        </div>
                        <span className="text-sm font-bold text-red-600">
                          ${finanzasStats.egresos.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <Button 
                      variant="ghost" 
                      className="mt-4 px-0 text-amber-600 underline hover:text-amber-500 dark:text-amber-300 dark:hover:text-amber-200" 
                      onClick={(e) => {
                        e.stopPropagation()
                        go('/finanzas')
                      }}
                    >
                      Ver detalles financieros
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Trabajadores - Asistencia de hoy */}
            {allowedBoxes.has('trabajadores') && (
            <Card className="h-full border-violet-200/40 bg-white dark:bg-neutral-900">
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
                      <span className="text-xs rounded-md bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200 px-2 py-1">
                        Activos: {workers.length}
                      </span>
                      <span className="text-xs rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200 px-2 py-1">
                        Registrados: {new Set(attendance.map(a => a.worker_id)).size}
                      </span>
                      <span className="text-xs rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200 px-2 py-1">
                        Faltan: {Math.max(workers.length - new Set(attendance.map(a => a.worker_id)).size, 0)}
                      </span>
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { code: 'PRE', label: 'Presente', color: 'text-emerald-700 bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-900/40' },
                        { code: 'AUS', label: 'Ausente', color: 'text-rose-700 bg-rose-100 dark:text-rose-200 dark:bg-rose-900/40' },
                        { code: 'TAR', label: 'Tardanza', color: 'text-amber-700 bg-amber-100 dark:text-amber-200 dark:bg-amber-900/40' },
                        { code: 'LIC', label: 'Licencia', color: 'text-sky-700 bg-sky-100 dark:text-sky-200 dark:bg-sky-900/40' },
                        { code: 'VAC', label: 'Vacaciones', color: 'text-indigo-700 bg-indigo-100 dark:text-indigo-200 dark:bg-indigo-900/40' },
                      ].map(({ code, label, color }) => {
                        const count = attendance.filter(a => a.status === code).length
                        return (
                          <div key={code} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block h-2 w-2 rounded-full ${color.split(' ')[1]}`}></span>
                              <span className="text-sm">{label}</span>
                            </div>
                            <span className={`text-xs rounded px-2 py-0.5 ${color}`}>{count}</span>
                          </div>
                        )
                      })}
                    </div>

                    <Button variant="ghost" className="mt-4 px-0 text-violet-600 underline hover:text-violet-500 dark:text-violet-300 dark:hover:text-violet-200" onClick={() => go('/trabajadores')}>
                      Ver detalles de asistencia
                    </Button>
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
