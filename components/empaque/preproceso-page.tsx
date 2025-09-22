"use client"

import PreprocesoFormModal from "./preproceso-form-modal";
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/ui/button"
import { Input } from "@/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { authService } from "../../lib/supabaseAuth"
import type { Preproceso } from "../../lib/types"
import { Plus, Search, Download, Cog, Thermometer, Droplets, CheckCircle, Clock, Play, ArrowLeft } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"
import * as XLSX from 'xlsx'

export function PreprocesoPage() {
  const [registros, setRegistros] = useState<Preproceso[]>([])
  const [filteredRegistros, setFilteredRegistros] = useState<Preproceso[]>([])
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
      loadRegistros()
    }
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [registros, searchTerm, estadoFilter])

  const loadRegistros = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("preseleccion")
        .select("*")
        .eq("tenant_id", user.tenantId);
      if (error) {
        console.error("Error al cargar registros:", error);
        setRegistros([]);
      } else {
        setRegistros(data || []);
      }
    } catch (error) {
      console.error("Error al cargar registros:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = registros

    if (searchTerm) {
      filtered = filtered.filter(
        (registro) =>
          (registro.fecha?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
          (registro.semana?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
          (registro.responsable?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      )
    }

    if (estadoFilter !== "all") {
      filtered = filtered.filter((registro) => registro.estado === estadoFilter)
    }

    filtered = filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    setFilteredRegistros(filtered)
  }

  const exportToExcel = () => {
    const worksheetData = [
      ["Fecha", "Semana", "Duración", "Bin Volcados", "Ritmo Máquina", "Duración Proceso", "Bin Pleno", "Bin Intermedio l", "Bin Intermedio ll", "Bin Incipiente", "Cant. Personal"],
      ...filteredRegistros.map((registro) => [
        registro.fecha,
        registro.semana,
        registro.duracion,
        registro.bin_volcados,
        registro.ritmo_maquina,
        registro.duracion_proceso,
        registro.bin_pleno,
        registro.bin_intermedio_l,
        registro.bin_intermedio_ll,
        registro.bin_incipiente,
        registro.cant_personal
      ])
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Preproceso")
    
    const today = new Date().toISOString().split("T")[0]
    XLSX.writeFile(workbook, `preproceso-${today}.xlsx`)
  }

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
            <h1 className="text-2xl font-bold">Preproceso</h1>
            <p className="text-muted-foreground">Gestión de preparación y limpieza de fruta</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportToExcel} disabled={filteredRegistros.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Preproceso
          </Button>
          <PreprocesoFormModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onCreated={loadRegistros}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registros.length}</div>
            <p className="text-xs text-muted-foreground">Procesos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Bins Volcados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {registros.reduce((sum, r) => sum + (r.bin_volcados || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Bins procesados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Personal Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {registros.length > 0 ? (registros.reduce((sum, r) => sum + (r.cant_personal || 0), 0) / registros.length).toFixed(1) : "0"}
            </div>
            <p className="text-xs text-muted-foreground">Personas por proceso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {registros.length > 0 ? (registros.reduce((sum, r) => sum + (r.duracion_proceso || 0), 0) / registros.length).toFixed(1) : "0"}h
            </div>
            <p className="text-xs text-muted-foreground">Tiempo promedio</p>
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
                placeholder="Buscar por fecha, semana o responsable..."
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
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
                <SelectItem value="pausado">Pausado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cog className="h-5 w-5" />
            <span>Registros de Preproceso</span>
          </CardTitle>
          <CardDescription>
            {filteredRegistros.length} de {registros.length} registros
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
                  <TableHead>Semana</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Bin Volcados</TableHead>
                  <TableHead>Ritmo Máquina</TableHead>
                  <TableHead>Duración Proceso</TableHead>
                  <TableHead>Bin Pleno</TableHead>
                  <TableHead>Bin Intermedio l</TableHead>
                  <TableHead>Bin Intermedio ll</TableHead>
                  <TableHead>Bin Incipiente</TableHead>
                  <TableHead>Cant. Personal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistros.map((registro) => (
                  <TableRow key={registro.id}>
                    <TableCell>{registro.fecha?.slice(0,10)}</TableCell>
                    <TableCell>{registro.semana}</TableCell>
                    <TableCell>{registro.duracion}</TableCell>
                    <TableCell>{registro.bin_volcados}</TableCell>
                    <TableCell>{registro.ritmo_maquina}</TableCell>
                    <TableCell>{registro.duracion_proceso}</TableCell>
                    <TableCell>{registro.bin_pleno}</TableCell>
                    <TableCell>{registro.bin_intermedio_l}</TableCell>
                    <TableCell>{registro.bin_intermedio_ll}</TableCell>
                    <TableCell>{registro.bin_incipiente}</TableCell>
                    <TableCell>{registro.cant_personal}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}