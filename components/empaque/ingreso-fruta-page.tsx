"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/ui/button"
import { Input } from "@/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Plus, Search, ArrowLeft } from "lucide-react"
import { authService } from "../../lib/supabaseAuth"
import { IngresoFrutaFormModal } from "./ingreso-fruta-form-modal"

export function IngresoFrutaPage() {

  const [registros, setRegistros] = useState<any[]>([])
  const [filteredRegistros, setFilteredRegistros] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tenantUuid, setTenantUuid] = useState<string | null>(null)

  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()

  // Load user from Supabase auth
  useEffect(() => {
    const loadUser = async () => {
      const sessionUser = await authService.checkSession()
      if (!sessionUser) {
        router.push("/login")
        return
      }
      setCurrentUser(sessionUser)
    }
    loadUser()
  }, [router])

  const user = currentUser

  // Obtener el UUID real del tenant al cargar la página
  useEffect(() => {
    if (user?.tenantId) {
      setTenantUuid(user.tenantId)
    }
  }, [user])

  useEffect(() => {
    const loadRegistros = async () => {
      if (!user?.tenantId) return
      try {
        setIsLoading(true)
        const { ingresoFrutaApi } = await import("../../lib/api")
        const data = await ingresoFrutaApi.getIngresos(user.tenantId)
        setRegistros(data)
      } catch (error) {
        console.error("Error al cargar registros:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadRegistros()
  }, [user])

  useEffect(() => {
    let filtered = registros
    if (searchTerm) {
      filtered = filtered.filter(
        (registro) =>
          (registro.productor || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (registro.producto || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (registro.lote?.toString() || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    filtered = filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    setFilteredRegistros(filtered)
  }, [registros, searchTerm])

  const totalBins = registros.reduce((sum, r) => sum + (r.cant_bin || 0), 0)
  const totalPeso = registros.reduce((sum, r) => sum + (r.peso_neto || 0), 0)

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
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/empaque')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Ingreso de Fruta</h1>
            <p className="text-muted-foreground">Gestión de recepción de materia prima</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Ingreso
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Buscar</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por productor, producto o lote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Modal de nuevo ingreso */}
      <IngresoFrutaFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async (data) => {
          if (!user?.tenantId) {
            alert("No se pudo obtener el ID del tenant. Contacte a soporte.");
            return;
          }
          setSaving(true)
          try {
            const { ingresoFrutaApi } = await import("../../lib/api")
            await ingresoFrutaApi.createIngreso({ ...data, tenant_id: user.tenantId })
            // Recargar registros
            const nuevos = await ingresoFrutaApi.getIngresos(user.tenantId)
            setRegistros(nuevos)
            setModalOpen(false)
          } catch (e: any) {
            alert("Error al guardar el ingreso: " + (e?.message || JSON.stringify(e)))
            console.error(e)
          } finally {
            setSaving(false)
          }
        }}
      />

      {/* Visualización en tablas separadas pero linkeadas */}
      <div className="space-y-10">
        {/* Tabla: Datos Generales */}
        <div>
          <h4 className="font-semibold mb-2">Datos generales</h4>
          <table className="w-full text-sm border border-gray-200 rounded-lg bg-white mb-2">
            <thead>
              <tr className="bg-gray-50 text-muted-foreground">
                <th className="text-left px-4 py-2 border-b font-semibold">Fecha</th>
                <th className="text-left px-4 py-2 border-b font-semibold">Ticket</th>
                <th className="text-left px-4 py-2 border-b font-semibold">Remito</th>
                <th className="text-left px-4 py-2 border-b font-semibold">Productor</th>
                <th className="text-left px-4 py-2 border-b font-semibold">Finca</th>
                <th className="text-left px-4 py-2 border-b font-semibold">Producto</th>
                <th className="text-left px-4 py-2 border-b font-semibold">Lote</th>
                <th className="text-left px-4 py-2 border-b font-semibold">Contratista</th>
                <th className="text-left px-4 py-2 border-b font-semibold">Tipo de cosecha</th>
                <th className="text-left px-4 py-2 border-b font-semibold">Liquidación</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} className="text-center text-muted-foreground px-4 py-4">Cargando...</td></tr>
              ) : filteredRegistros.length === 0 ? (
                <tr><td colSpan={10} className="text-center text-muted-foreground px-4 py-4">No se encontraron registros de ingreso</td></tr>
              ) : (
                filteredRegistros.map((registro, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 border-b">{registro.fecha ? new Date(registro.fecha).toLocaleDateString() : "-"}</td>
                    <td className="px-4 py-2 border-b">{registro.num_ticket ?? "-"}</td>
                    <td className="px-4 py-2 border-b">{registro.num_remito ?? "-"}</td>
                    <td className="px-4 py-2 border-b">{registro.productor ?? "-"}</td>
                    <td className="px-4 py-2 border-b">{registro.finca ?? "-"}</td>
                    <td className="px-4 py-2 border-b">{registro.producto ?? "-"}</td>
                    <td className="px-4 py-2 border-b">{registro.lote ?? "-"}</td>
                    <td className="px-4 py-2 border-b">{registro.contratista ?? "-"}</td>
                    <td className="px-4 py-2 border-b">{registro.tipo_cosecha ?? "-"}</td>
                    <td className="px-4 py-2 border-b">{registro.estado_liquidacion ? "Sí" : "No"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Tabla: Transporte */}
        <div>
          <h4 className="font-semibold mb-2">Transporte</h4>
          <table className="w-full text-sm border border-gray-200 rounded-lg bg-white mb-2">
            <thead>
              <tr className="bg-gray-50 text-muted-foreground">
                <th className="text-left px-4 py-2 border-b font-semibold">Transporte</th>
                <th className="text-left px-4 py-2 border-b font-semibold">Chofer</th>
                <th className="text-left px-4 py-2 border-b font-semibold">Chasis</th>
                <th className="text-left px-4 py-2 border-b font-semibold">Acoplado</th>
                <th className="text-left px-4 py-2 border-b font-semibold">Operario</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center text-muted-foreground px-4 py-4">Cargando...</td></tr>
              ) : filteredRegistros.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-muted-foreground px-4 py-4">No se encontraron registros de ingreso</td></tr>
              ) : (
                filteredRegistros.map((registro, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 border-b">{registro.transporte ?? "-"}</td>
                    <td className="px-4 py-2 border-b">{registro.chofer ?? "-"}</td>
                    <td className="px-4 py-2 border-b">{registro.chasis ?? "-"}</td>
                    <td className="px-4 py-2 border-b">{registro.acoplado ?? "-"}</td>
                    <td className="px-4 py-2 border-b">{registro.operario ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Tabla: Bins y Peso */}
        <div>
          <h4 className="font-semibold mb-2">Bins y peso</h4>
          <table className="w-full text-sm border border-gray-200 rounded-lg bg-white">
            <thead>
              <tr className="bg-gray-50 text-muted-foreground">
                <th className="text-left px-4 py-2 border-b font-semibold">Cantidad de bins</th>
                <th className="text-left px-4 py-2 border-b font-semibold">Tipo bin</th>
                <th className="text-left px-4 py-2 border-b font-semibold">Peso Neto</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={3} className="text-center text-muted-foreground px-4 py-4">Cargando...</td></tr>
              ) : filteredRegistros.length === 0 ? (
                <tr><td colSpan={3} className="text-center text-muted-foreground px-4 py-4">No se encontraron registros de ingreso</td></tr>
              ) : (
                filteredRegistros.map((registro, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 border-b">{registro.cant_bin ?? "-"}</td>
                    <td className="px-4 py-2 border-b">{registro.tipo_bin ?? "-"}</td>
                    <td className="px-4 py-2 border-b">{registro.peso_neto ? `${registro.peso_neto} kg` : "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}