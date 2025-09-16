"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/ui/button"
import { Input } from "@/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { authService } from "../../lib/auth"
import type { Despacho } from "../../lib/types"
import { Plus, Search, Download, Truck, Package, MapPin, Calendar, FileText, CheckCircle, Clock, AlertTriangle, ArrowLeft } from "lucide-react"

export function DespachoPage() {
  const [despachos, setDespachos] = useState<Despacho[]>([])
  const [filteredDespachos, setFilteredDespachos] = useState<Despacho[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [estadoFilter, setEstadoFilter] = useState<string>("all")

  const user = authService.getCurrentUser()
  const router = useRouter()

  useEffect(() => {
    loadDespachos()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [despachos, searchTerm, estadoFilter])

  const loadDespachos = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      // TODO: Replace with actual API call
      const mockData: Despacho[] = [
        {
          id: "dsp001",
          tenantId: user.tenantId,
          fecha: "2024-03-15",
          numeroGuia: "GD-2024-001",
          cliente: "Supermercado Central",
          transportista: "Transportes del Valle",
          pallets: ["PAL-2024-001", "PAL-2024-003"],
          destino: "Centro de Distribución Norte",
          fechaEntregaEstimada: "2024-03-16",
          responsable: "Carlos Ruiz",
          estado: "en_transito",
          observaciones: "Entrega matutina, producto premium",
          documentos: ["Factura", "Guía de remisión", "Certificado de calidad"]
        },
        {
          id: "dsp002",
          tenantId: user.tenantId,
          fecha: "2024-03-14",
          numeroGuia: "GD-2024-002",
          cliente: "Exportación Brasil",
          transportista: "Logística Internacional",
          pallets: ["PAL-2024-004"],
          destino: "Puerto de Santos",
          fechaEntregaEstimada: "2024-03-20",
          responsable: "María González",
          estado: "entregado",
          observaciones: "Exportación exitosa, cliente satisfecho"
        },
        {
          id: "dsp003",
          tenantId: user.tenantId,
          fecha: "2024-03-16",
          numeroGuia: "GD-2024-003",
          cliente: "Mercado Municipal",
          transportista: "Distribuidora Local",
          pallets: ["PAL-2024-002"],
          destino: "Mercado Central",
          fechaEntregaEstimada: "2024-03-17",
          responsable: "Ana López",
          estado: "preparando",
          observaciones: "Verificar documentación antes del envío"
        },
        {
          id: "dsp004",
          tenantId: user.tenantId,
          fecha: "2024-03-13",
          numeroGuia: "GD-2024-004",
          cliente: "Cadena de Restaurantes",
          transportista: "Express Delivery",
          pallets: ["PAL-2024-005"],
          destino: "Almacén Central",
          fechaEntregaEstimada: "2024-03-14",
          responsable: "Carlos Ruiz",
          estado: "devuelto",
          observaciones: "Cliente rechazó por retraso en entrega"
        }
      ]
      setDespachos(mockData)
    } catch (error) {
      console.error("Error al cargar despachos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = despachos

    if (searchTerm) {
      filtered = filtered.filter(
        (despacho) =>
          despacho.numeroGuia.toLowerCase().includes(searchTerm.toLowerCase()) ||
          despacho.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
          despacho.transportista.toLowerCase().includes(searchTerm.toLowerCase()) ||
          despacho.destino.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (estadoFilter !== "all") {
      filtered = filtered.filter((despacho) => despacho.estado === estadoFilter)
    }

    // Sort by date (most recent first)
    filtered = filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    setFilteredDespachos(filtered)
  }

  const exportToCSV = () => {
    const headers = ["Fecha", "Guía", "Cliente", "Transportista", "Pallets", "Destino", "Entrega Estimada", "Estado", "Responsable"]
    const csvData = [
      headers.join(","),
      ...filteredDespachos.map((despacho) => [
        despacho.fecha,
        despacho.numeroGuia,
        `"${despacho.cliente}"`,
        `"${despacho.transportista}"`,
        despacho.pallets.join("; "),
        `"${despacho.destino}"`,
        despacho.fechaEntregaEstimada,
        despacho.estado,
        `"${despacho.responsable}"`
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    const today = new Date().toISOString().split("T")[0]
    link.setAttribute("download", `despachos-${today}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getEstadoBadge = (estado: Despacho["estado"]) => {
    switch (estado) {
      case "preparando":
        return <Badge variant="secondary"><Package className="h-3 w-3 mr-1" />Preparando</Badge>
      case "en_transito":
        return <Badge variant="default" className="bg-blue-500"><Truck className="h-3 w-3 mr-1" />En Tránsito</Badge>
      case "entregado":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Entregado</Badge>
      case "devuelto":
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Devuelto</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const getDiasEntrega = (fechaEntrega: string) => {
    const hoy = new Date()
    const entrega = new Date(fechaEntrega)
    const diferencia = Math.ceil((entrega.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    return diferencia
  }

  // Calculate statistics
  const totalPallets = despachos.reduce((sum, d) => sum + d.pallets.length, 0)
  const enTransito = despachos.filter(d => d.estado === "en_transito").length
  const entregados = despachos.filter(d => d.estado === "entregado").length
  const preparando = despachos.filter(d => d.estado === "preparando").length

  if (!user || !["Admin", "Empaque"].includes(user.rol)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No tienes permisos para acceder a esta sección</p>
      </div>
    )
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
            <h1 className="text-2xl font-bold">Gestión de Despachos</h1>
            <p className="text-muted-foreground">Control de envíos y entregas a clientes</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportToCSV} disabled={filteredDespachos.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Despacho
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Despachos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{despachos.length}</div>
            <p className="text-xs text-muted-foreground">{totalPallets} pallets totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En Preparación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{preparando}</div>
            <p className="text-xs text-muted-foreground">Pendientes de envío</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En Tránsito</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{enTransito}</div>
            <p className="text-xs text-muted-foreground">En camino al destino</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Entregados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{entregados}</div>
            <p className="text-xs text-muted-foreground">Completados exitosamente</p>
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
                placeholder="Buscar por guía, cliente, transportista o destino..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="preparando">Preparando</SelectItem>
                <SelectItem value="en_transito">En Tránsito</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
                <SelectItem value="devuelto">Devuelto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Despachos Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Truck className="h-5 w-5" />
            <span>Despachos</span>
          </CardTitle>
          <CardDescription>
            {filteredDespachos.length} de {despachos.length} despachos
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
                  <TableHead>Guía</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Transportista</TableHead>
                  <TableHead>Pallets</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Documentos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDespachos.map((despacho) => {
                  const diasEntrega = getDiasEntrega(despacho.fechaEntregaEstimada)
                  const entregaProxima = diasEntrega <= 1 && diasEntrega >= 0

                  return (
                    <TableRow key={despacho.id}>
                      <TableCell className="font-medium">
                        {new Date(despacho.fecha).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-medium">
                        {despacho.numeroGuia}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{despacho.cliente}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{despacho.transportista}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{despacho.pallets.length}</span>
                          <div className="text-xs text-muted-foreground">
                            {despacho.pallets.slice(0, 2).map(p => p.split('-').pop()).join(', ')}
                            {despacho.pallets.length > 2 && '...'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{despacho.destino}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center space-x-1 ${entregaProxima ? 'text-orange-600' : ''}`}>
                          <Calendar className="h-3 w-3" />
                          <div className="text-xs">
                            <div>{new Date(despacho.fechaEntregaEstimada).toLocaleDateString()}</div>
                            <div className="text-muted-foreground">
                              {diasEntrega > 0 ? `En ${diasEntrega}d` : 
                               diasEntrega === 0 ? 'Hoy' : 
                               `${Math.abs(diasEntrega)}d atraso`}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getEstadoBadge(despacho.estado)}</TableCell>
                      <TableCell className="text-sm">{despacho.responsable}</TableCell>
                      <TableCell>
                        {despacho.documentos && despacho.documentos.length > 0 ? (
                          <div className="flex items-center space-x-1">
                            <FileText className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{despacho.documentos.length} docs</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Sin docs</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredDespachos.length === 0 && (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron despachos</p>
              <p className="text-sm text-muted-foreground">Crea el primer despacho para comenzar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}