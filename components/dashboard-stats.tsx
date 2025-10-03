"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { authService } from "../lib/supabaseAuth"
import { tareasCampo, movimientosCaja, inventario } from "../lib/mocks"
import { Calendar, TrendingUp, AlertTriangle, DollarSign } from "lucide-react"

// Utility function for conditional class names
function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

export function DashboardStats() {
  const user = authService.getCurrentUser()
  if (!user) return null

  // Filter data by tenant
  const tenantTareas = tareasCampo.filter((t) => t.tenantId === user.tenantId)
  const tenantMovimientos = movimientosCaja.filter((m) => m.tenantId === user.tenantId)
  const tenantInventario = inventario.filter((i) => i.tenantId === user.tenantId)

  // Calculate KPIs
  const tareasPendientes = tenantTareas.filter((t) => t.estado === "pendiente").length
  const tareasEnCurso = tenantTareas.filter((t) => t.estado === "en-curso").length

  const balance = tenantMovimientos.reduce((acc, mov) => {
    return mov.tipo === "ingreso" ? acc + mov.monto : acc - mov.monto
  }, 0)

  const itemsBajoStock = tenantInventario.filter((item) => item.stock <= item.stockMinimo)

  const proximasTareas = tenantTareas
    .filter((t) => t.estado === "pendiente")
    .sort((a, b) => new Date(a.fechaProgramada).getTime() - new Date(b.fechaProgramada).getTime())
    .slice(0, 3)

  const movimientosRecientes = tenantMovimientos
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 3)
    
  // Total items in inventory
  const totalInventario = tenantInventario.length

  return (
    <div className="space-y-6 px-4 py-6 max-w-5xl mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tareasPendientes}</div>
            <p className="text-xs text-muted-foreground">{tareasEnCurso} en curso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Caja Chica</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${balance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{tenantMovimientos.length} movimientos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Bajo Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{itemsBajoStock.length}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventario</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenantInventario.length}</div>
            <p className="text-xs text-muted-foreground">Items registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Tareas */}
        <Card>
          <CardHeader className="gap-1">
            <CardTitle>Próximas Tareas en Campo</CardTitle>
            <CardDescription>Tareas programadas para los próximos días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {proximasTareas.length > 0 ? (
                proximasTareas.map((tarea) => (
                  <div key={tarea.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{tarea.descripcion}</p>
                      <p className="text-sm text-muted-foreground">
                        {tarea.lote} • {tarea.cultivo}
                      </p>
                      <p className="text-xs text-muted-foreground">Responsable: {tarea.responsable}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={tarea.tipo === "fertilizante" ? "default" : "secondary"}>{tarea.tipo}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(tarea.fechaProgramada).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-6">No hay tareas pendientes</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Movimientos Recientes */}
        <Card>
          <CardHeader className="gap-1">
            <CardTitle>Movimientos Recientes</CardTitle>
            <CardDescription>Últimos movimientos de caja chica</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {movimientosRecientes.length > 0 ? (
                movimientosRecientes.map((movimiento) => (
                  <div key={movimiento.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{movimiento.concepto}</p>
                      <p className="text-sm text-muted-foreground">{movimiento.categoria}</p>
                      <p className="text-xs text-muted-foreground">{new Date(movimiento.fecha).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn("font-medium", movimiento.tipo === "ingreso" ? "text-green-600" : "text-red-600")}
                      >
                        {movimiento.tipo === "ingreso" ? "+" : "-"}${movimiento.monto.toLocaleString()}
                      </p>
                      <Badge variant={movimiento.tipo === "ingreso" ? "default" : "destructive"}>
                        {movimiento.tipo}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-6">No hay movimientos registrados</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Bajo Stock */}
      {itemsBajoStock.length > 0 && (
        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>Items con Bajo Stock</span>
            </CardTitle>
            <CardDescription>Items que requieren reposición urgente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itemsBajoStock.map((item) => (
                <div key={item.id} className="p-3 border border-destructive/20 rounded-lg bg-destructive/5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{item.nombre}</p>
                    <Badge variant="destructive">Bajo Stock</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Stock actual: {item.stock} {item.unidad}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Mínimo: {item.stockMinimo} {item.unidad}
                  </p>
                  {item.ubicacion && <p className="text-xs text-muted-foreground mt-1">Ubicación: {item.ubicacion}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
