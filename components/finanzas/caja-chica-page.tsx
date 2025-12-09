"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "../../hooks/use-auth"
import {
  finanzasApiService,
  type MovimientoCaja,
} from "../../lib/finanzas/finanzas-service"
import { FinanzasFormModal } from "./finanzas-form-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Download, FileText, Search, Plus, ArrowLeft } from "lucide-react"

export function CajaChicaPage() {
  const { user, loading: authLoading } = useAuth({ requireRoles: ["admin", "finanzas"], redirectToLogin: true })
  const searchParams = useSearchParams()
  const router = useRouter()
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([])
  const [filteredMovimientos, setFilteredMovimientos] = useState<MovimientoCaja[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTipo, setFilterTipo] = useState("all")
  const [filterCategoria, setFilterCategoria] = useState("all")

  useEffect(() => {
    loadMovimientos()
  }, [user])

  useEffect(() => {
    // Seed filter from URL (e.g., /finanzas/caja?tipo=ingreso)
    const tipo = searchParams?.get('tipo')
    if (tipo === 'ingreso' || tipo === 'egreso') {
      setFilterTipo(tipo)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    applyFilters()
  }, [movimientos, searchTerm, filterTipo, filterCategoria])

  const loadMovimientos = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const data = await finanzasApiService.movements.listMovements({ tenantId: user.tenantId || '' })
      setMovimientos(data)
    } catch (err) {
      console.error("Error al cargar movimientos:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = movimientos
    if (searchTerm) {
      filtered = filtered.filter(
        (m) =>
          m.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.comprobante?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.fecha.includes(searchTerm),
      )
    }
    if (filterTipo !== "all") filtered = filtered.filter((m) => m.tipo === filterTipo)
    if (filterCategoria !== "all") filtered = filtered.filter((m) => m.categoria === filterCategoria)
    filtered = filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    setFilteredMovimientos(filtered)
  }

  const handleCreateMovimiento = async (movimientoData: Omit<MovimientoCaja, "id">) => {
    await finanzasApiService.movements.createMovement(movimientoData.tenantId, {
      date: movimientoData.fecha,
      kind: movimientoData.tipo,
      amount: movimientoData.monto,
      notes: movimientoData.concepto,
      categoryName: movimientoData.categoria,
      receipt: movimientoData.comprobante,
    })
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
    link.setAttribute("download", `caja-chica-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const uniqueCategories = [...new Set(movimientos.map((m) => m.categoria))]

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex-1 flex flex-col p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/finanzas")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold leading-tight">Caja chica</h1>
            <p className="text-sm text-muted-foreground">Registra y revisa los movimientos de caja</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Movimientos de Caja</CardTitle>
            <CardDescription>{user?.tenant?.name || "Tu empresa"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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

            <div className="flex gap-2 mb-4">
              <Button variant="outline" onClick={exportToCSV} disabled={filteredMovimientos.length === 0}>
                <Download className="h-4 w-4 mr-2" /> Exportar CSV
              </Button>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Nuevo Movimiento
              </Button>
            </div>

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
                        <span className={`font-bold ${movimiento.tipo === "ingreso" ? "text-green-600" : "text-red-600"}`}>
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
          tenantId={user.tenantId || ''}
        />
      </div>
    </div>
  )
}
