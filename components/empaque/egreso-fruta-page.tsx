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
import { Plus, Search, Download, ArrowUp, ArrowLeft } from "lucide-react"
import EgresoFrutaFormModal from "./egreso-fruta-form-modal"
import { supabase } from "../../lib/supabaseClient"

export function EgresoFrutaPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [egresos, setEgresos] = useState<any[]>([])
  const [filteredEgresos, setFilteredEgresos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

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
  }, [egresos, searchTerm])

  const loadEgresos = async () => {
    if (!user?.tenantId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("egreso_fruta")
        .select("*")
        .eq("tenant_id", user.tenantId);
      if (error) {
        console.error("Error al cargar egresos:", error);
        setEgresos([]);
      } else {
        setEgresos(data || []);
      }
    } catch (error) {
      console.error("Error al cargar egresos:", error);
      setEgresos([]);
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
          onCreated={loadEgresos}
          tenantId={user?.tenantId || ""}
        />
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
                placeholder="Buscar por tipo de fruta, cliente, chofer o remito..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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