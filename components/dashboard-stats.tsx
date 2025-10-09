"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { useAuth } from "../hooks/use-auth"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { farmsApi } from "../lib/api"
import { Package, Cog, Archive, Truck, ArrowUpRight, Sprout, ChevronRight, Boxes, Banknote, Users } from "lucide-react"

type Farm = {
  id: string
  name: string
}

export function DashboardStats() {
  const { user } = useAuth()
  const router = useRouter()
  const [farms, setFarms] = useState<Farm[]>([])
  const [loadingFarms, setLoadingFarms] = useState(false)

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

  if (!user) return null

  const go = (path: string) => router.push(path)

  const firstTwoFarms = farms.slice(0, 2)

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
          <Card className="border-seedor/20 bg-gradient-to-br from-white to-seedor/5 dark:from-neutral-900 dark:to-neutral-900">
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

          {/* Campo */}
          <Card className="border-emerald-200/30 bg-gradient-to-br from-white to-emerald-50 dark:from-neutral-900 dark:to-emerald-900/10">
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

          {/* Placeholder squares */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Inventario */}
            <Card className="h-48 border-sky-200/40 bg-gradient-to-br from-white to-sky-50 dark:from-neutral-900 dark:to-sky-900/10">
              <CardHeader className="flex flex-row items-start gap-3">
                <InventarioIcon />
                <CardTitle>Inventario</CardTitle>
              </CardHeader>
              <CardContent className="h-full flex items-center justify-center text-muted-foreground">Próximamente</CardContent>
            </Card>

            {/* Finanzas */}
            <Card className="h-48 border-amber-200/40 bg-gradient-to-br from-white to-amber-50 dark:from-neutral-900 dark:to-amber-900/10">
              <CardHeader className="flex flex-row items-start gap-3">
                <FinanzasIcon />
                <CardTitle>Finanzas</CardTitle>
              </CardHeader>
              <CardContent className="h-full flex items-center justify-center text-muted-foreground">Próximamente</CardContent>
            </Card>

            {/* Trabajadores */}
            <Card className="h-48 border-violet-200/40 bg-gradient-to-br from-white to-violet-50 dark:from-neutral-900 dark:to-violet-900/10">
              <CardHeader className="flex flex-row items-start gap-3">
                <TrabajadoresIcon />
                <CardTitle>Trabajadores</CardTitle>
              </CardHeader>
              <CardContent className="h-full flex items-center justify-center text-muted-foreground">Próximamente</CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
