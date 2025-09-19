"use client"

import { supabase } from "../../lib/supabaseClient";
import DespachoFormModal from "./despacho-form-modal";
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/ui/button"
import { Input } from "@/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { authService } from "../../lib/supabaseAuth"
import { Plus, Search, Download, Truck, Package, MapPin, Calendar, FileText, CheckCircle, Clock, AlertTriangle, ArrowLeft } from "lucide-react"

export function DespachoPage() {
  const [despachos, setDespachos] = useState<any[]>([])
  const [filteredDespachos, setFilteredDespachos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [estadoFilter, setEstadoFilter] = useState<string>("all")
  const [modalOpen, setModalOpen] = useState(false);

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
      loadDespachos()
    }
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [despachos, searchTerm, estadoFilter])

  const loadDespachos = async () => {
    if (!user?.tenantId) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("despacho")
        .select("*")
        .eq("tenant_id", user.tenantId);
      if (error) {
        console.error("Error al cargar despachos:", error);
        setDespachos([]);
      } else {
        setDespachos(data || []);
      }
    } catch (error) {
      console.error("Error al cargar despachos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = despachos

    if (searchTerm) {
      filtered = filtered.filter(
        (despacho) =>
          despacho.num_remito?.toString().includes(searchTerm) ||
          despacho.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          despacho.transporte?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          despacho.destino?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Si tenés un campo "estado" en la tabla, podés filtrar por estado
    if (estadoFilter !== "all" && despachos.length > 0 && "estado" in despachos[0]) {
      filtered = filtered.filter((despacho) => despacho.estado === estadoFilter)
    }

    // Sort by date (most recent first)
    filtered = filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    setFilteredDespachos(filtered)
  }

  const exportToCSV = () => {
    const headers = [
      "Fecha", "Guía", "Cliente", "Destino", "Transporte", "Chofer", "Total Pallets", "Total Cajas"
    ]
    const csvData = [
      headers.join(","),
      ...filteredDespachos.map((despacho) => [
        despacho.fecha,
        despacho.num_remito,
        `"${despacho.cliente}"`,
        `"${despacho.destino}"`,
        `"${despacho.transporte}"`,
        `"${despacho.chofer}"`,
        despacho.total_pallets,
        despacho.total_cajas
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

  // Estadísticas básicas
  const totalDespachos = despachos.length
  const totalPallets = despachos.reduce((sum, d) => sum + (d.total_pallets || 0), 0)
  const totalCajas = despachos.reduce((sum, d) => sum + (d.total_cajas || 0), 0)

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
          <Button onClick={() => setModalOpen(true)}>
            Nuevo Despacho
          </Button>
          <DespachoFormModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onCreated={loadDespachos}
            tenantId={user.tenantId}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Despachos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDespachos}</div>
            <p className="text-xs text-muted-foreground">{totalPallets} pallets totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cajas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCajas}</div>
            <p className="text-xs text-muted-foreground">Cajas enviadas</p>
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
                placeholder="Buscar por guía, cliente, transporte o destino..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* Si tenés campo estado, podés filtrar por estado */}
            {despachos.length > 0 && "estado" in despachos[0] && (
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
            )}
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
                  <TableHead>Destino</TableHead>
                  <TableHead>Transporte</TableHead>
                  <TableHead>Chofer</TableHead>
                  <TableHead>Total Pallets</TableHead>
                  <TableHead>Total Cajas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDespachos.map((despacho) => (
                  <TableRow key={despacho.id}>
                    <TableCell>
                      {despacho.fecha ? new Date(despacho.fecha).toLocaleDateString() : ""}
                    </TableCell>
                    <TableCell>{despacho.num_remito}</TableCell>
                    <TableCell>{despacho.cliente}</TableCell>
                    <TableCell>{despacho.destino}</TableCell>
                    <TableCell>{despacho.transporte}</TableCell>
                    <TableCell>{despacho.chofer}</TableCell>
                    <TableCell>{despacho.total_pallets}</TableCell>
                    <TableCell>{despacho.total_cajas}</TableCell>
                  </TableRow>
                ))}
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