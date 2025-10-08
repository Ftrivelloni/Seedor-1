"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { FinanzasFormModal } from "./finanzas-form-modal"
import { finanzasApi } from "../../lib/api"
import { useAuth } from "../../hooks/use-auth"
import type { MovimientoCaja } from "../../lib/mocks"
import { Plus, Search, Download, DollarSign, TrendingUp, TrendingDown, FileText } from "lucide-react"

export function FinanzasPage() {
  const { user, loading: authLoading } = useAuth({ requireRoles: ['admin', 'finanzas'] })
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([])
  const [filteredMovimientos, setFilteredMovimientos] = useState<MovimientoCaja[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTipo, setFilterTipo] = useState("all")
  const [filterCategoria, setFilterCategoria] = useState("all")

  useEffect(() => {
    loadMovimientos()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [movimientos, searchTerm, filterTipo, filterCategoria])

  const loadMovimientos = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const data = await finanzasApi.getMovimientos(user.tenantId)
      setMovimientos(data)
    } catch (error) {
      console.error("Error al cargar movimientos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = movimientos

    if (searchTerm) {
      filtered = filtered.filter(
        (movimiento) =>
          movimiento.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movimiento.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movimiento.comprobante?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movimiento.fecha.includes(searchTerm),
      )
    }

    if (filterTipo !== "all") {
      filtered = filtered.filter((movimiento) => movimiento.tipo === filterTipo)
    }

    if (filterCategoria !== "all") {
      filtered = filtered.filter((movimiento) => movimiento.categoria === filterCategoria)
    }

    filtered = filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    setFilteredMovimientos(filtered)
  }

  const handleCreateMovimiento = async (movimientoData: Omit<MovimientoCaja, "id">) => {
    await finanzasApi.createMovimiento(movimientoData)
    await loadMovimientos()
  }

  const exportToCSV = () => {
    const headers = ["Fecha", "Tipo", "Concepto", "Categoría", "Monto", "Comprobante"]
    const csvData = [
      headers.join(","),
      ...filteredMovimientos.map((movimiento) => {
        return [
          movimiento.fecha,
          movimiento.tipo === "ingreso" ? "Ingreso" : "Egreso",
          `"${movimiento.concepto}"`,
          `"${movimiento.categoria}"`,
          movimiento.monto,
          `"${movimiento.comprobante || ""}"`,
        ].join(",")
      }),
    ].join("\n")

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `movimientos-caja-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalIngresos = movimientos.filter((m) => m.tipo === "ingreso").reduce((sum, m) => sum + m.monto, 0)
  const totalEgresos = movimientos.filter((m) => m.tipo === "egreso").reduce((sum, m) => sum + m.monto, 0)
  const balance = totalIngresos - totalEgresos

  const uniqueCategories = [...new Set(movimientos.map((m) => m.categoria))]

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No tienes permisos para acceder a esta sección</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold">Gestión Financiera</h1>
            <p className="text-sm text-muted-foreground">Control de caja chica y movimientos - {user?.tenant?.name || 'Tu Empresa'}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={exportToCSV} disabled={filteredMovimientos.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Movimiento
            </Button>
            <div className="text-right">
              <p className="text-sm font-medium">{user?.nombre || user?.email}</p>
              <p className="text-xs text-muted-foreground">{user?.rol || 'Usuario'}</p>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">

      <Card className={balance >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-6 w-6" />
            <span>Balance de Caja Chica</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-4">
            <span className={balance >= 0 ? "text-green-600" : "text-red-600"}>${balance.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Ingresos</p>
                <p className="text-xl font-semibold text-green-600">${totalIngresos.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Egresos</p>
                <p className="text-xl font-semibold text-red-600">${totalEgresos.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{movimientos.length}</div>
            <p className="text-xs text-muted-foreground">Registros totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {movimientos.filter((m) => m.tipo === "ingreso").length}
            </div>
            <p className="text-xs text-muted-foreground">Movimientos de entrada</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Egresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {movimientos.filter((m) => m.tipo === "egreso").length}
            </div>
            <p className="text-xs text-muted-foreground">Movimientos de salida</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCategories.length}</div>
            <p className="text-xs text-muted-foreground">Tipos diferentes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar movimientos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="ingreso">Ingresos</SelectItem>
                <SelectItem value="egreso">Egresos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {uniqueCategories.map((categoria) => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Movimientos de Caja</span>
          </CardTitle>
          <CardDescription>
            {filteredMovimientos.length} de {movimientos.length} movimientos
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Comprobante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovimientos.map((movimiento) => (
                  <TableRow key={movimiento.id}>
                    <TableCell className="font-medium">{new Date(movimiento.fecha).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={movimiento.tipo === "ingreso" ? "default" : "destructive"}>
                        {movimiento.tipo === "ingreso" ? "Ingreso" : "Egreso"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium truncate">{movimiento.concepto}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{movimiento.categoria}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-bold ${movimiento.tipo === "ingreso" ? "text-green-600" : "text-red-600"}`}
                      >
                        {movimiento.tipo === "ingreso" ? "+" : "-"}${movimiento.monto.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {movimiento.comprobante && <FileText className="h-4 w-4 text-muted-foreground" />}
                        <span className="text-sm">{movimiento.comprobante || "Sin comprobante"}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredMovimientos.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron movimientos</p>
              <p className="text-sm text-muted-foreground">Crea el primer movimiento para comenzar</p>
            </div>
          )}
        </CardContent>
      </Card>

      <FinanzasFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateMovimiento}
        tenantId={user.tenantId}
      />
        </div>
      </main>
    </div>
  )
}
