"use client"

import { supabase } from "../../lib/supabaseClient";
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/ui/input"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { empaqueApi, ingresoFrutaApi, palletsApi, despachoApi } from "../../lib/api"
import { authService } from "../../lib/supabaseAuth"
import type { RegistroEmpaque } from "../../lib/mocks"
import { Search, Package, AlertTriangle, ArrowDown, Cog, Archive, Truck, ArrowUp } from "lucide-react"


export function EmpaquePage() {
  const [registros, setRegistros] = useState<RegistroEmpaque[]>([])
  const [filteredRegistros, setFilteredRegistros] = useState<RegistroEmpaque[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  // Filtro y datos para la tabla de ingreso de fruta
  const [filtroFecha, setFiltroFecha] = useState("");
  const [ingresosFruta, setIngresosFruta] = useState<any[]>([]);
  const [pallets, setPallets] = useState<any[]>([]);
  const [isLoadingPallets, setIsLoadingPallets] = useState(true);
  const [isLoadingIngresos, setIsLoadingIngresos] = useState(true);
  const [despachos, setDespachos] = useState<any[]>([]);
  const [isLoadingDespachos, setIsLoadingDespachos] = useState(true);
  const [egresosFruta, setEgresosFruta] = useState<any[]>([]);
  const [isLoadingEgresosFruta, setIsLoadingEgresosFruta] = useState(true);

  // Estado para preprocesos
  const [preprocesos, setPreprocesos] = useState<any[]>([]);
  const [isLoadingPreprocesos, setIsLoadingPreprocesos] = useState(true);

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
      loadRegistros();
      loadIngresosFruta();
      loadPallets();
      loadDespachos();
      loadEgresosFruta();
      loadPreprocesos();
    }
    // Escuchar evento global para recargar preprocesos
    const handler = () => { loadPreprocesos(); };
    window.addEventListener('preproceso:created', handler);
    return () => {
      window.removeEventListener('preproceso:created', handler);
    };
  }, [user])
  // Cargar preprocesos desde Supabase
  const loadPreprocesos = async () => {
    if (!user?.tenantId) return;
    try {
      setIsLoadingPreprocesos(true);
      const { data, error } = await supabase
        .from("preseleccion")
        .select("*")
        .eq("tenant_id", user.tenantId);
      if (error) {
        console.error("Error al cargar preprocesos:", error);
        setPreprocesos([]);
      } else {
        setPreprocesos(data || []);
      }
    } catch (error) {
      console.error("Error al cargar preprocesos:", error);
      setPreprocesos([]);
    } finally {
      setIsLoadingPreprocesos(false);
    }
  };
  const loadIngresosFruta = async () => {
    if (!user?.tenantId) return;
    try {
      setIsLoadingIngresos(true);
      const data = await ingresoFrutaApi.getIngresos(user.tenantId);
      setIngresosFruta(data);
    } catch (e) {
      setIngresosFruta([]);
    } finally {
      setIsLoadingIngresos(false);
    }
  };

  const loadPallets = async () => {
    if (!user?.tenantId) return;
    try {
      setIsLoadingPallets(true);
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
      setPallets([]);
    } finally {
      setIsLoadingPallets(false);
    }
  };

  const loadDespachos = async () => {
    if (!user?.tenantId) return;
    try {
      setIsLoadingDespachos(true);
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
      setDespachos([]);
    } finally {
      setIsLoadingDespachos(false);
    }
  };

  const loadEgresosFruta = async () => {
    if (!user?.tenantId) return;
    try {
      setIsLoadingEgresosFruta(true);
      const { data, error } = await supabase
        .from("egreso_fruta")
        .select("*")
        .eq("tenant_id", user.tenantId);
      if (error) {
        console.error("Error al cargar egresos de fruta:", error);
        setEgresosFruta([]);
      } else {
        setEgresosFruta(data || []);
      }
    } catch (error) {
      console.error("Error al cargar egresos de fruta:", error);
      setEgresosFruta([]);
    } finally {
      setIsLoadingEgresosFruta(false);
    }
  };

  useEffect(() => {
    applyFilters()
  }, [registros, searchTerm])

  const loadRegistros = async () => {
    if (!user?.tenantId) return

    try {
      setIsLoading(true)
      const data = await empaqueApi.getRegistros(user.tenantId)
      setRegistros(data)
    } catch (error) {
      console.error("Error al cargar registros:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = registros

    if (searchTerm) {
      filtered = filtered.filter(
        (registro) =>
          registro.cultivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          registro.notas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          registro.fecha.includes(searchTerm),
      )
    }

    // Sort by date (most recent first)
    filtered = filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    setFilteredRegistros(filtered)
  }

  const navigateToSubpage = (subpage: string) => {
    router.push(`/empaque/${subpage}`)
  }

  // Calculate statistics
  const totalKgEntraron = registros.reduce((sum, r) => sum + r.kgEntraron, 0)
  const totalKgSalieron = registros.reduce((sum, r) => sum + r.kgSalieron, 0)
  const totalKgDescartados = registros.reduce((sum, r) => sum + r.kgDescartados, 0)
  const porcentajeDescartePromedio = totalKgEntraron > 0 ? (totalKgDescartados / totalKgEntraron) * 100 : 0

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
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Empaque</h1>
          <p className="text-muted-foreground">Registros de procesamiento de fruta</p>
        </div>
      </div>

      {/* Botones de navegación de módulos */}
  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 my-8">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToSubpage('ingreso-fruta')}>
          <CardContent className="p-4 text-center">
            <ArrowDown className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-medium">Ingreso Fruta</h3>
            <p className="text-xs text-muted-foreground">Recepción de materia prima</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToSubpage('preproceso')}>
          <CardContent className="p-4 text-center">
            <Cog className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <h3 className="font-medium">Preproceso</h3>
            <p className="text-xs text-muted-foreground">Preparación y limpieza</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToSubpage('pallets')}>
          <CardContent className="p-4 text-center">
            <Archive className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <h3 className="font-medium">Pallets</h3>
            <p className="text-xs text-muted-foreground">Gestión de pallets</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToSubpage('despacho')}>
          <CardContent className="p-4 text-center">
            <Truck className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <h3 className="font-medium">Despacho</h3>
            <p className="text-xs text-muted-foreground">Envío a clientes</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigateToSubpage('egreso-fruta')}>
          <CardContent className="p-4 text-center">
            <ArrowUp className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <h3 className="font-medium">Egreso Fruta</h3>
            <p className="text-xs text-muted-foreground">Salida de productos</p>
          </CardContent>
        </Card>
      </div>


  {/* Header de resumen */}
  <h2 className="text-xl font-bold mt-10 mb-4">Resumen</h2>
  {/* Resúmenes informativos de cada módulo */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Ingreso de Fruta - tabla filtrable por fecha (Supabase) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ArrowDown className="h-5 w-5 text-blue-600" />
              <span>Ingreso de Fruta</span>
            </CardTitle>
            <CardDescription>Filtrar ingresos por fecha</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-center gap-2">
              <label htmlFor="filtro-fecha" className="text-sm">Fecha:</label>
              <input
                id="filtro-fecha"
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={filtroFecha}
                onChange={e => setFiltroFecha(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
              {filtroFecha && (
                <Button size="sm" variant="ghost" onClick={() => setFiltroFecha("")}>Limpiar</Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg bg-white">
                <thead>
                  <tr className="bg-gray-50 text-muted-foreground">
                    <th className="text-left px-4 py-2 border-b font-semibold">Fecha</th>
                    <th className="text-left px-4 py-2 border-b font-semibold">Productor</th>
                    <th className="text-left px-4 py-2 border-b font-semibold">Producto</th>
                    <th className="text-left px-4 py-2 border-b font-semibold">Lote</th>
                    <th className="text-right px-4 py-2 border-b font-semibold">Cantidad Bins</th>
                    <th className="text-right px-4 py-2 border-b font-semibold">Peso Neto</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingIngresos ? (
                    <tr><td colSpan={6} className="text-center text-muted-foreground px-4 py-4">Cargando...</td></tr>
                  ) : (
                    ingresosFruta
                      .filter(r => !filtroFecha || (r.fecha && r.fecha.startsWith(filtroFecha)))
                      .slice(0, 10)
                      .map((r, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-4 py-2 border-b">{r.fecha ? new Date(r.fecha).toLocaleDateString() : "-"}</td>
                          <td className="px-4 py-2 border-b">{r.productor ?? "-"}</td>
                          <td className="px-4 py-2 border-b">{r.producto ?? "-"}</td>
                          <td className="px-4 py-2 border-b">{r.lote ?? "-"}</td>
                          <td className="px-4 py-2 border-b text-right">{r.cant_bin ?? "-"}</td>
                          <td className="px-4 py-2 border-b text-right">{r.peso_neto ? `${r.peso_neto} kg` : "-"}</td>
                        </tr>
                      ))
                  )}
                  {!isLoadingIngresos && ingresosFruta.filter(r => !filtroFecha || (r.fecha && r.fecha.startsWith(filtroFecha))).length === 0 && (
                    <tr><td colSpan={6} className="text-center text-muted-foreground px-4 py-4">Sin registros</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Preproceso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cog className="h-5 w-5 text-orange-600" />
              <span>Preproceso</span>
            </CardTitle>
            <CardDescription>Resumen de preparación y limpieza</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPreprocesos ? (
              <div className="text-muted-foreground">Cargando...</div>
            ) : (
              <div className="flex flex-col gap-2">
                <div><span className="font-medium">Total procesado:</span> {preprocesos.reduce((sum, p) => sum + (p.bin_volcados || 0), 0).toLocaleString()} bins</div>
                <div><span className="font-medium">Última fecha:</span> {preprocesos.length > 0 ? new Date(preprocesos[0].fecha).toLocaleDateString() : '-'}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pallets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Archive className="h-5 w-5 text-green-600" />
              <span>Pallets</span>
            </CardTitle>
            <CardDescription>Resumen de pallets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div><span className="font-medium">Total empacado:</span> {pallets.reduce((sum, p) => sum + (p.peso || 0), 0).toLocaleString()} kg</div>
              <div><span className="font-medium">Total pallets:</span> {pallets.length}</div>
              <div><span className="font-medium">Última fecha:</span> {pallets.length > 0 ? new Date(pallets[0].created_at).toLocaleDateString() : '-'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Despacho */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-purple-600" />
              <span>Despacho</span>
            </CardTitle>
            <CardDescription>Resumen de envíos recientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div><span className="font-medium">Total despachado:</span> {despachos.reduce((sum, d) => sum + (d.total_cajas || 0), 0).toLocaleString()} cajas</div>
              <div><span className="font-medium">Total pallets:</span> {despachos.reduce((sum, d) => sum + (d.total_pallets || 0), 0)}</div>
              <div><span className="font-medium">Última fecha:</span> {despachos.length > 0 ? new Date(despachos[0].created_at).toLocaleDateString() : '-'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Egreso de Fruta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ArrowUp className="h-5 w-5 text-red-600" />
              <span>Egreso de Fruta</span>
            </CardTitle>
            <CardDescription>Resumen de salidas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div><span className="font-medium">Total enviado:</span> {egresosFruta.reduce((sum, e) => sum + (e.peso_neto || 0), 0).toLocaleString()} kg</div>
              <div><span className="font-medium">Total egresos:</span> {egresosFruta.length}</div>
              <div><span className="font-medium">Última fecha:</span> {egresosFruta.length > 0 ? new Date(egresosFruta[0].created_at).toLocaleDateString() : '-'}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
