"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/ui/button"
import { Input } from "@/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { authService } from "../../lib/supabaseAuth"
import type { EgresoFruta } from "../../lib/types"
import { Plus, Search, Download, ArrowUp, DollarSign, AlertTriangle, FileText, Package, ArrowLeft } from "lucide-react"
import { EgresoFrutaFormModal } from "./egreso-fruta-form-modal"

export function EgresoFrutaPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [egresos, setEgresos] = useState<any[]>([])
  const [filteredEgresos, setFilteredEgresos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoMovimientoFilter, setTipoMovimientoFilter] = useState<string>("all")

  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  // Load user from Supabase auth
  useEffect(() => {
    const loadUser = async () => {
      const sessionUser = await authService.checkSession()
      if (!sessionUser) {
        router.push("/login")
        return
      }
      setUser(sessionUser)
    }
    loadUser()
  }, [router])

  useEffect(() => {
    if (user) {
      loadEgresos()
    }
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [egresos, searchTerm, tipoMovimientoFilter])

  const loadEgresos = async () => {
    if (!user?.tenantId) return;
    setIsLoading(true);
    try {
      const { egresoFrutaApi } = await import("../../lib/api");
      const data = await egresoFrutaApi.getEgresos(user.tenantId);
      setEgresos(data);
    } catch (error) {
      console.error("Error al cargar egresos:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const applyFilters = () => {
    let filtered = egresos

    if (searchTerm) {
      filtered = filtered.filter(
        (egreso) =>
          (egreso.producto || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (egreso.cliente || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (egreso.chofer || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (egreso.num_remito ? egreso.num_remito.toString().includes(searchTerm) : false)
      )
    }

    // No hay tipoMovimiento en la tabla real, así que el filtro se omite o se puede adaptar si hay un campo equivalente

    // Ordenar por fecha (más reciente primero)
    filtered = filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    setFilteredEgresos(filtered)
  }

  const exportToCSV = () => {
    const headers = ["Fecha", "Producto", "Peso Neto", "Cliente", "Finca", "Remito", "Chofer", "Transporte", "Chasis", "Acoplado"]
    const csvData = [
      headers.join(","),
      ...filteredEgresos.map((egreso) => [
        egreso.fecha,
        egreso.producto,
        egreso.peso_neto,
        egreso.cliente,
        egreso.finca,
        egreso.num_remito,
        egreso.chofer,
        egreso.transporte,
        egreso.chasis,
        egreso.acoplado
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    const today = new Date().toISOString().split("T")[0]
    link.setAttribute("download", `egreso-fruta-${today}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getTipoMovimientoBadge = (tipo: EgresoFruta["tipoMovimiento"]) => {
    switch (tipo) {
      case "venta":
        return <Badge variant="default" className="bg-green-500"><DollarSign className="h-3 w-3 mr-1" />Venta</Badge>
      case "merma":
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Merma</Badge>
      case "devolucion":
        return <Badge variant="secondary"><ArrowUp className="h-3 w-3 mr-1" />Devolución</Badge>
      case "regalo":
        return <Badge variant="outline"><Package className="h-3 w-3 mr-1" />Regalo</Badge>
      default:
        return <Badge variant="outline">{tipo}</Badge>
    }
  }

  // Calculate statistics
  const totalCantidad = egresos.reduce((sum, e) => sum + e.cantidad, 0)
  const totalVentas = egresos
    .filter(e => e.tipoMovimiento === "venta")
    .reduce((sum, e) => sum + (e.valorTotal || 0), 0)
  const totalMerma = egresos
    .filter(e => e.tipoMovimiento === "merma")
    .reduce((sum, e) => sum + e.cantidad, 0)
  const ventas = egresos.filter(e => e.tipoMovimiento === "venta").length

  // Show loading while user is being loaded
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!["Admin", "Empaque"].includes(user.rol)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No tienes permisos para acceder a esta sección</p>
      </div>
    )
  }

  const handleCreated = (nuevo: any) => {
    setEgresos((prev) => [nuevo, ...prev])
    setFilteredEgresos((prev) => [nuevo, ...prev])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/empaque')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Egreso de Fruta</h1>
            <p className="text-muted-foreground">Gestión de salidas de productos</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportToCSV} disabled={filteredEgresos.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Egreso
          </Button>
        </div>
        <EgresoFrutaFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={handleCreated}
          tenantId={user?.tenantId || ""}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Egresado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCantidad.toLocaleString()} kg</div>
            <p className="text-xs text-muted-foreground">{egresos.length} movimientos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valor Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalVentas.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{ventas} transacciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Merma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalMerma.toLocaleString()} kg</div>
            <p className="text-xs text-muted-foreground">
              {totalCantidad > 0 ? `${((totalMerma / totalCantidad) * 100).toFixed(1)}%` : "0%"} del total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Precio Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${ventas > 0 ? (totalVentas / egresos.filter(e => e.tipoMovimiento === "venta").reduce((sum, e) => sum + e.cantidad, 0)).toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Por kilogramo</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Buscar y Filtrar</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por tipo de fruta, destino, responsable o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tipoMovimientoFilter} onValueChange={setTipoMovimientoFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tipo de movimiento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="venta">Venta</SelectItem>
                <SelectItem value="merma">Merma</SelectItem>
                <SelectItem value="devolucion">Devolución</SelectItem>
                <SelectItem value="regalo">Regalo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Egresos Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowUp className="h-5 w-5" />
            <span>Registros de Egreso</span>
          </CardTitle>
          <CardDescription>
            {filteredEgresos.length} de {egresos.length} registros
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
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Peso Neto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Finca</TableHead>
                  <TableHead>Remito</TableHead>
                  <TableHead>Chofer</TableHead>
                  <TableHead>Transporte</TableHead>
                  <TableHead>Chasis</TableHead>
                  <TableHead>Acoplado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEgresos.map((egreso) => (
                  <TableRow key={egreso.id}>
                    <TableCell className="font-medium">
                      {egreso.fecha ? new Date(egreso.fecha).toLocaleDateString() : ""}
                    </TableCell>
                    <TableCell>{egreso.producto}</TableCell>
                    <TableCell>{egreso.peso_neto}</TableCell>
                    <TableCell>{egreso.cliente}</TableCell>
                    <TableCell>{egreso.finca}</TableCell>
                    <TableCell>{egreso.num_remito}</TableCell>
                    <TableCell>{egreso.chofer}</TableCell>
                    <TableCell>{egreso.transporte}</TableCell>
                    <TableCell>{egreso.chasis}</TableCell>
                    <TableCell>{egreso.acoplado}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredEgresos.length === 0 && (
            <div className="text-center py-8">
              <ArrowUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron registros de egreso</p>
              <p className="text-sm text-muted-foreground">Registra el primer egreso de fruta</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}