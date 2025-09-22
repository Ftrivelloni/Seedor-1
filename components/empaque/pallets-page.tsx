"use client"

import { supabase } from "../../lib/supabaseClient";
import PalletsFormModal from "./pallets-form-modal";
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/ui/button"
import { Input } from "@/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { authService } from "../../lib/supabaseAuth"
import type { Pallet } from "../../lib/types"
import { Plus, Search, Download, Archive, ArrowLeft } from "lucide-react"
import * as XLSX from 'xlsx'

export function PalletsPage() {
  const [pallets, setPallets] = useState<Pallet[]>([])
  const [filteredPallets, setFilteredPallets] = useState<Pallet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [ubicacionFilter, setUbicacionFilter] = useState<string>("all")
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
      loadPallets()
    }
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [pallets, searchTerm, ubicacionFilter])

  const loadPallets = async () => {
    if (!user?.tenantId) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("pallets")
        .select("*")
        .eq("tenant_id", user.tenantId);
      if (error) {
        console.error("Error al cargar pallets:", error);
        setPallets([]);
      } else {
        setPallets(data || []);
      }
    } catch (error) {
      console.error("Error al cargar pallets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = pallets

    if (searchTerm) {
      filtered = filtered.filter(
        (pallet) =>
          (pallet.num_pallet?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
          (pallet.producto?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
          (pallet.productor?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
          (pallet.destino?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      )
    }

    if (ubicacionFilter !== "all") {
      filtered = filtered.filter((pallet) => 
        pallet.categoria?.toLowerCase().includes(ubicacionFilter.toLowerCase()) ?? false
      )
    }

    // Sort by date (most recent first)
    filtered = filtered.sort((a, b) => new Date(b.fecha || '').getTime() - new Date(a.fecha || '').getTime())

    setFilteredPallets(filtered)
  }

  const exportToExcel = () => {
    const worksheetData = [
      ["Nº Pallet", "Fecha", "Producto", "Productor", "Cajas", "Peso", "Kilos", "Categoría", "Cod. Envase", "Destino"],
      ...filteredPallets.map((pallet) => [
        pallet.num_pallet || "",
        pallet.fecha || "",
        pallet.producto || "",
        pallet.productor || "",
        pallet.cant_cajas || 0,
        `${pallet.peso || 0} kg`,
        `${pallet.kilos || 0} kg`,
        pallet.categoria || "",
        pallet.cod_envase || "",
        pallet.destino || ""
      ])
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pallets")
    
    const today = new Date().toISOString().split("T")[0]
    XLSX.writeFile(workbook, `pallets-${today}.xlsx`)
  }

  const getUbicaciones = () => {
    const ubicaciones = Array.from(new Set(pallets.map(p => p.categoria || 'Sin categoría')))
    return ubicaciones.sort()
  }

  // Calculate statistics
  const totalCajas = pallets.reduce((sum, p) => sum + (p.cant_cajas || 0), 0)
  const totalPeso = pallets.reduce((sum, p) => sum + (p.peso || 0), 0)
  const totalKilos = pallets.reduce((sum, p) => sum + (p.kilos || 0), 0)

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
            <h1 className="text-2xl font-bold">Gestión de Pallets</h1>
            <p className="text-muted-foreground">Control de pallets y almacenamiento</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportToExcel} disabled={filteredPallets.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Pallet
          </Button>
          <PalletsFormModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onCreated={loadPallets}
            tenantId={user?.tenant?.id || ""}
          />
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
            <p className="text-xs text-muted-foreground">Peso neto total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Kilos Bruto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalKilos.toLocaleString()} kg</div>
            <p className="text-xs text-muted-foreground">Peso bruto total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Promedio Cajas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {pallets.length > 0 ? (totalCajas / pallets.length).toFixed(1) : "0"}
            </div>
            <p className="text-xs text-muted-foreground">Cajas por pallet</p>
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
                placeholder="Buscar por nº pallet, producto, productor o destino..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={ubicacionFilter} onValueChange={setUbicacionFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {getUbicaciones().map((ubicacion, index) => (
                  <SelectItem key={`categoria-${index}-${ubicacion}`} value={ubicacion}>{ubicacion}</SelectItem>
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
                  <TableHead>Nº Pallet</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Productor</TableHead>
                  <TableHead className="text-right">Cajas</TableHead>
                  <TableHead className="text-right">Peso</TableHead>
                  <TableHead className="text-right">Kilos</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Cod. Envase</TableHead>
                  <TableHead>Destino</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPallets.map((pallet) => (
                  <TableRow key={pallet.id}>
                    <TableCell className="font-medium font-mono">
                      {pallet.num_pallet}
                    </TableCell>
                    <TableCell>
                      {pallet.fecha ? new Date(pallet.fecha).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>{pallet.producto || "-"}</TableCell>
                    <TableCell>{pallet.productor || "-"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {pallet.cant_cajas || 0}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {pallet.peso ? `${pallet.peso.toLocaleString()} kg` : "0 kg"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {pallet.kilos ? `${pallet.kilos.toLocaleString()} kg` : "0 kg"}
                    </TableCell>
                    <TableCell>{pallet.categoria || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {pallet.cod_envase || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {pallet.destino || <span className="text-muted-foreground">Sin asignar</span>}
                    </TableCell>
                  </TableRow>
                ))}
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