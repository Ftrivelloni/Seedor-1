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
import type { Pallet } from "../../lib/types"
import { Plus, Search, Download, Archive, MapPin, Thermometer, Calendar, Package, ArrowLeft } from "lucide-react"

export function PalletsPage() {
  const [pallets, setPallets] = useState<Pallet[]>([])
  const [filteredPallets, setFilteredPallets] = useState<Pallet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [estadoFilter, setEstadoFilter] = useState<string>("all")
  const [ubicacionFilter, setUbicacionFilter] = useState<string>("all")

  const user = authService.getCurrentUser()
  const router = useRouter()

  useEffect(() => {
    loadPallets()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [pallets, searchTerm, estadoFilter, ubicacionFilter])

  const loadPallets = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      // TODO: Replace with actual API call
      const mockData: Pallet[] = [
        {
          id: "plt001",
          tenantId: user.tenantId,
          codigo: "PAL-2024-001",
          fechaCreacion: "2024-03-15",
          tipoFruta: "Naranjas",
          cantidadCajas: 48,
          pesoTotal: 1152,
          loteOrigen: "LSJ-2024-001",
          destino: "Supermercado Central",
          ubicacion: "Cámara Fría A-1",
          estado: "listo_despacho",
          temperaturaAlmacen: 4.2,
          fechaVencimiento: "2024-03-25",
          observaciones: "Producto premium, manejo cuidadoso"
        },
        {
          id: "plt002",
          tenantId: user.tenantId,
          codigo: "PAL-2024-002",
          fechaCreacion: "2024-03-15",
          tipoFruta: "Limones",
          cantidadCajas: 36,
          pesoTotal: 720,
          loteOrigen: "LP-2024-015",
          ubicacion: "Cámara Fría B-2",
          estado: "en_camara",
          temperaturaAlmacen: 3.8,
          fechaVencimiento: "2024-03-30"
        },
        {
          id: "plt003",
          tenantId: user.tenantId,
          codigo: "PAL-2024-003",
          fechaCreacion: "2024-03-16",
          tipoFruta: "Mandarinas",
          cantidadCajas: 40,
          pesoTotal: 800,
          loteOrigen: "FSJ-2024-002",
          ubicacion: "Zona de Armado",
          estado: "armado",
          observaciones: "Pendiente control de calidad final"
        },
        {
          id: "plt004",
          tenantId: user.tenantId,
          codigo: "PAL-2024-004",
          fechaCreacion: "2024-03-14",
          tipoFruta: "Naranjas",
          cantidadCajas: 50,
          pesoTotal: 1200,
          loteOrigen: "LSJ-2024-001",
          destino: "Exportación Brasil",
          ubicacion: "Muelle de Carga",
          estado: "despachado",
          temperaturaAlmacen: 4.0,
          fechaVencimiento: "2024-03-28"
        }
      ]
      setPallets(mockData)
    } catch (error) {
      console.error("Error al cargar pallets:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = pallets

    if (searchTerm) {
      filtered = filtered.filter(
        (pallet) =>
          pallet.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pallet.tipoFruta.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pallet.loteOrigen.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pallet.destino?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (estadoFilter !== "all") {
      filtered = filtered.filter((pallet) => pallet.estado === estadoFilter)
    }

    if (ubicacionFilter !== "all") {
      filtered = filtered.filter((pallet) => 
        pallet.ubicacion.toLowerCase().includes(ubicacionFilter.toLowerCase())
      )
    }

    // Sort by date (most recent first)
    filtered = filtered.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())

    setFilteredPallets(filtered)
  }

  const exportToCSV = () => {
    const headers = ["Código", "Fecha", "Tipo Fruta", "Cajas", "Peso Total", "Lote Origen", "Ubicación", "Estado", "Destino"]
    const csvData = [
      headers.join(","),
      ...filteredPallets.map((pallet) => [
        pallet.codigo,
        pallet.fechaCreacion,
        `"${pallet.tipoFruta}"`,
        pallet.cantidadCajas,
        `${pallet.pesoTotal} kg`,
        pallet.loteOrigen,
        `"${pallet.ubicacion}"`,
        pallet.estado,
        `"${pallet.destino || ""}"`
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    const today = new Date().toISOString().split("T")[0]
    link.setAttribute("download", `pallets-${today}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getEstadoBadge = (estado: Pallet["estado"]) => {
    switch (estado) {
      case "armado":
        return <Badge variant="secondary"><Package className="h-3 w-3 mr-1" />Armado</Badge>
      case "en_camara":
        return <Badge variant="default" className="bg-blue-500"><Thermometer className="h-3 w-3 mr-1" />En Cámara</Badge>
      case "listo_despacho":
        return <Badge variant="default" className="bg-green-500"><Archive className="h-3 w-3 mr-1" />Listo Despacho</Badge>
      case "despachado":
        return <Badge variant="outline"><Download className="h-3 w-3 mr-1" />Despachado</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const getUbicaciones = () => {
    const ubicaciones = Array.from(new Set(pallets.map(p => p.ubicacion)))
    return ubicaciones.sort()
  }

  // Calculate statistics
  const totalCajas = pallets.reduce((sum, p) => sum + p.cantidadCajas, 0)
  const totalPeso = pallets.reduce((sum, p) => sum + p.pesoTotal, 0)
  const enCamara = pallets.filter(p => p.estado === "en_camara").length
  const listoDespacho = pallets.filter(p => p.estado === "listo_despacho").length

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
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Gestión de Pallets</h1>
            <p className="text-muted-foreground">Control de pallets y almacenamiento</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportToCSV} disabled={filteredPallets.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Pallet
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pallets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pallets.length}</div>
            <p className="text-xs text-muted-foreground">{totalCajas} cajas totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Peso Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPeso.toLocaleString()} kg</div>
            <p className="text-xs text-muted-foreground">Producto almacenado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En Cámara</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{enCamara}</div>
            <p className="text-xs text-muted-foreground">En refrigeración</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Listos Despacho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{listoDespacho}</div>
            <p className="text-xs text-muted-foreground">Disponibles para envío</p>
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
                placeholder="Buscar por código, tipo de fruta, lote o destino..."
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
                <SelectItem value="armado">Armado</SelectItem>
                <SelectItem value="en_camara">En Cámara</SelectItem>
                <SelectItem value="listo_despacho">Listo Despacho</SelectItem>
                <SelectItem value="despachado">Despachado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ubicacionFilter} onValueChange={setUbicacionFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ubicaciones</SelectItem>
                {getUbicaciones().map((ubicacion) => (
                  <SelectItem key={ubicacion} value={ubicacion}>{ubicacion}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pallets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Archive className="h-5 w-5" />
            <span>Pallets</span>
          </CardTitle>
          <CardDescription>
            {filteredPallets.length} de {pallets.length} pallets
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
                  <TableHead>Código</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo Fruta</TableHead>
                  <TableHead className="text-right">Cajas</TableHead>
                  <TableHead className="text-right">Peso Total</TableHead>
                  <TableHead>Lote Origen</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Temp.</TableHead>
                  <TableHead>Vencimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPallets.map((pallet) => {
                  const diasVencimiento = pallet.fechaVencimiento ? 
                    Math.ceil((new Date(pallet.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
                  const proximoVencimiento = diasVencimiento !== null && diasVencimiento <= 3

                  return (
                    <TableRow key={pallet.id}>
                      <TableCell className="font-medium font-mono">
                        {pallet.codigo}
                      </TableCell>
                      <TableCell>
                        {new Date(pallet.fechaCreacion).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{pallet.tipoFruta}</TableCell>
                      <TableCell className="text-right font-medium">
                        {pallet.cantidadCajas}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {pallet.pesoTotal.toLocaleString()} kg
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {pallet.loteOrigen}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{pallet.ubicacion}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getEstadoBadge(pallet.estado)}</TableCell>
                      <TableCell className="text-sm">
                        {pallet.destino || <span className="text-muted-foreground">Sin asignar</span>}
                      </TableCell>
                      <TableCell>
                        {pallet.temperaturaAlmacen ? (
                          <div className="flex items-center space-x-1">
                            <Thermometer className="h-3 w-3 text-blue-500" />
                            <span className="text-xs">{pallet.temperaturaAlmacen}°C</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {pallet.fechaVencimiento ? (
                          <div className={`flex items-center space-x-1 ${proximoVencimiento ? 'text-destructive' : ''}`}>
                            <Calendar className="h-3 w-3" />
                            <span className="text-xs">
                              {new Date(pallet.fechaVencimiento).toLocaleDateString()}
                              {diasVencimiento !== null && (
                                <div className="text-xs">
                                  ({diasVencimiento > 0 ? `${diasVencimiento}d` : 'Vencido'})
                                </div>
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredPallets.length === 0 && (
            <div className="text-center py-8">
              <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron pallets</p>
              <p className="text-sm text-muted-foreground">Crea el primer pallet para comenzar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}