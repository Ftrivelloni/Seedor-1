"use client"
import PreprocesoFormModal from "./preproceso-form-modal";
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { authService } from "../../lib/supabaseAuth"
import { supabase } from "../../lib/supabaseClient"
import { Plus, Download, ArrowLeft, Cog } from "lucide-react"

export function PreprocesoPage() {
  const [registros, setRegistros] = useState<any[]>([])
  const [filteredRegistros, setFilteredRegistros] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

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
    if (user) loadRegistros()
  }, [user])

  useEffect(() => {
    let filtered = registros
    if (searchTerm) {
      filtered = filtered.filter(
        (registro) =>
          (registro.semana?.toString().includes(searchTerm)) ||
          (registro.fecha?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    filtered = filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    setFilteredRegistros(filtered)
  }, [registros, searchTerm])

  const loadRegistros = async () => {
    if (!user?.tenantId) return
    setIsLoading(true)
    const { data, error } = await supabase
      .from("preseleccion")
      .select("*")
      .eq("tenant_id", user.tenantId)
    setIsLoading(false)
    if (error) {
      setRegistros([])
    } else {
      setRegistros(data || [])
    }
  }

  const exportToCSV = () => {
    const headers = ["Fecha", "Semana", "Duración", "Bin Volcados", "Ritmo Máquina", "Duración Proceso", "Bin Pleno", "Bin Intermedio I", "Bin Intermedio II", "Bin Incipiente", "Cant. Personal"]
    const csvData = [
      headers.join(","),
      ...filteredRegistros.map((registro) => [
        registro.fecha,
        registro.semana,
        registro.duracion,
        registro.bin_volcados,
        registro.ritmo_maquina,
        registro.duracion_proceso,
        registro.bin_pleno,
        registro.bin_intermedio_I,
        registro.bin_intermedio_II,
        registro.bin_incipiente,
        registro.cant_personal
      ].join(","))
    ].join("\n")
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    const today = new Date().toISOString().split("T")[0]
    link.setAttribute("download", `preproceso-${today}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
          <Button variant="outline" onClick={exportToCSV} disabled={filteredRegistros.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Preproceso
          </Button>
          <PreprocesoFormModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onCreated={loadRegistros}
            tenantId={user.tenantId}
          />
        </div>
      </div>
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
                  <TableHead>Bin Intermedio I</TableHead>
                  <TableHead>Bin Intermedio II</TableHead>
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
                    <TableCell>{registro.bin_intermedio_I}</TableCell>
                    <TableCell>{registro.bin_intermedio_II}</TableCell>
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
